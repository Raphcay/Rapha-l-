"""Module 2 — republication aux meilleures heures.

Ordre de sécurité : backup (JSON + photos) → création de la copie → vérification du nouvel
identifiant → seulement ensuite suppression/masquage de l'ancienne annonce.
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from ..app import App
from ..clients.base import Item
from ..safety import LimitReached
from ..slots import best_slots, in_slot, spread_times, windows_for_day

log = logging.getLogger("vinted")
MODULE = "republish"
DAY = 86400


def snapshot_my_items(app: App, items: list[Item]) -> None:
    ts = time.time()
    for i in items:
        app.db.execute("INSERT OR REPLACE INTO my_item_snapshots (ts, item_id, views, favourites, price)"
                       " VALUES (?, ?, ?, ?, ?)", (ts, i.id, i.views, i.favourites, i.price))


def eligible(app: App, items: list[Item], now: float | None = None) -> list[tuple[Item, float]]:
    cfg = app.cfg["republish"]
    now = now or time.time()
    excluded = {str(x) for x in cfg.get("exclude_item_ids") or []}
    since = now - float(cfg["min_days_without_sale"]) * DAY
    excluded |= {r[0] for r in app.db.query(
        "SELECT old_item_id FROM republications WHERE ts >= ? AND (dry_run = 0 OR ? = 1)",
        (since, int(app.dry_run)))}
    out = []
    for item in items:
        if item.id in excluded or item.is_closed or item.is_reserved or item.is_hidden:
            continue
        if not item.created_ts:
            log.debug("Âge inconnu pour %s : ignorée", item.id)
            continue
        age = (now - item.created_ts) / DAY
        if age >= float(cfg["min_days_without_sale"]):
            out.append((item, age))
    out.sort(key=lambda x: (-x[1], x[0].views))
    return out


def backup(app: App, item: Item, upload_data: dict, with_photos: bool) -> tuple[Path, list[str]]:
    root = Path(app.cfg["paths"]["backups"]) / ("simulation" if app.dry_run else "")
    folder = root / f"{datetime.now():%Y%m%d-%H%M%S}_{item.id}"
    folder.mkdir(parents=True, exist_ok=True)
    payload = {"saved_at": datetime.now().isoformat(timespec="seconds"),
               "item": {k: v for k, v in asdict(item).items() if k != "raw"},
               "item_raw": item.raw, "upload_data": upload_data}
    (folder / "annonce.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    photos = app.client.download_photos(item, str(folder / "photos")) if with_photos else []
    if with_photos and len(photos) != len(item.photos):
        raise RuntimeError(f"Backup incomplet : {len(photos)}/{len(item.photos)} photos")
    return folder, photos


def _last_live_republish_ts(app: App) -> float:
    row = app.db.one("SELECT MAX(ts) FROM republications WHERE dry_run = 0")
    return float(row[0] or 0)


def republish_one(app: App, item: Item) -> str | None:
    client = app.client
    action = app.cfg["republish"]["old_listing_action"]
    upload = client.get_item_upload_data(item.id)
    if not upload.get("title") or not item.photos:
        raise RuntimeError("Données de l'annonce incomplètes (titre ou photos) : republication annulée")
    folder, photos = backup(app, item, upload, with_photos=not app.dry_run)
    log.info("💾 Backup : %s", folder)

    def do() -> str:
        new_id = client.create_item_copy(upload, photos)
        if not new_id or new_id == item.id:
            raise RuntimeError("Nouvelle annonce non confirmée : l'ancienne est conservée")
        try:
            (client.hide_item if action == "hide" else client.delete_item)(item.id)
        except Exception as exc:
            app.notifier.alert("Republication : doublon", f"Nouvelle annonce {new_id} créée mais "
                               f"l'ancienne {item.id} n'a pas pu être retirée ({exc}). À faire à la main.")
            raise
        return new_id

    status, new_id = app.perform(
        MODULE, "republish", "republish", item.id,
        {"title": item.title, "price": item.price, "photos": len(item.photos), "old_action": action,
         "backup": str(folder)},
        do, f"Republication de « {item.title} » ({item.price:.2f} €, {len(item.photos)} photos) "
            f"puis {'masquage' if action == 'hide' else 'suppression'} de l'ancienne ({item.id})",
    )
    app.db.execute("INSERT INTO republications (ts, old_item_id, new_item_id, title, backup_path, old_action, dry_run)"
                   " VALUES (?, ?, ?, ?, ?, ?, ?)",
                   (time.time(), item.id, new_id, item.title, str(folder), action, int(app.dry_run)))
    return new_id


def run(app: App, now: bool = False, max_n: int | None = None, item_id: str | None = None) -> dict:
    cfg = app.cfg["republish"]
    app.guard.ensure_running()
    slots, source = best_slots(app.db, app.cfg)
    log.info("🔁 Republication — mode %s — créneaux (%s) : %s", app.mode, source,
             ", ".join(s.label() for s in slots if s.weekday == datetime.now().weekday()) or "aucun aujourd'hui")

    items = app.client.list_my_items()
    snapshot_my_items(app, items)
    candidates = eligible(app, items)
    app.db.set_state("eligible_count", len(candidates))
    if item_id:
        candidates = [c for c in candidates if c[0].id == str(item_id)]
    log.info("🔁 %d annonce(s) éligible(s) (> %s jours sans vente)", len(candidates), cfg["min_days_without_sale"])
    for item, age in candidates[:10]:
        log.info("   • %s — %.2f € — %.0f j — %d vues, %d favoris", item.title, item.price, age, item.views, item.favourites)

    remaining = app.guard.remaining("republish")
    plan = spread_times(windows_for_day(slots, datetime.now().date()), min(len(candidates), remaining),
                        int(cfg["min_gap_minutes"]), app.rng, not_before=datetime.now())
    if plan:
        log.info("🗓  Étalement prévu aujourd'hui : %s", ", ".join(t.strftime("%H:%M") for t in plan))

    summary = {"éligibles": len(candidates), "republiées": 0, "plafond_restant": remaining}
    if not now and not in_slot(slots, datetime.now()):
        if not app.dry_run:
            log.info("⏸  Hors créneau : rien n'est republié maintenant (utilise `run`, ou --now pour forcer).")
            return summary
        log.info("ℹ️  Hors créneau : en réel, l'outil attendrait le prochain créneau. Simulation quand même :")
    gap = time.time() - _last_live_republish_ts(app)
    if not app.dry_run and not now and gap < int(cfg["min_gap_minutes"]) * 60:
        log.info("⏸  Dernière republication il y a %.0f min : on espace (min %s min).", gap / 60, cfg["min_gap_minutes"])
        return summary

    for item, _age in candidates[: int(max_n or cfg["max_per_run"])]:
        try:
            republish_one(app, item)
            summary["republiées"] += 1
        except LimitReached as exc:
            log.warning("⛔ %s", exc)
            break
        except Exception as exc:
            log.error("❌ Republication de %s échouée : %s", item.id, exc)
            app.notifier.alert("Republication échouée", f"{item.title} : {exc}")
            break
    return summary
