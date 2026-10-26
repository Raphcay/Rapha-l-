"""Module 3 — offres aux membres qui ont ajouté une annonce en favori.

- Fonction native de Vinted en priorité, offre individuelle sinon (si disponible).
- Remise tirée dans la plage configurée, jamais sous le plancher de l'annonce.
- Une seule offre par annonce et par période, mémorisée en base.
"""
from __future__ import annotations

import logging
import time

from ..app import App
from ..clients.base import FeatureUnavailable, Item
from ..pricing import offer_price
from ..safety import LimitReached

log = logging.getLogger("vinted")
MODULE = "offers"
DAY = 86400


def recently_offered(app: App, item_id: str, period_days: float) -> bool:
    since = time.time() - period_days * DAY
    if app.dry_run:  # en simulation on tient compte des vraies offres et des offres simulées
        row = app.db.one("SELECT 1 FROM offers WHERE item_id = ? AND ts >= ?", (item_id, since))
    else:
        row = app.db.one("SELECT 1 FROM offers WHERE item_id = ? AND ts >= ? AND dry_run = 0", (item_id, since))
    return row is not None


def _record(app: App, item: Item, price: float, floor: float, mode: str, recipients: int) -> None:
    app.db.execute("INSERT INTO offers (ts, item_id, original_price, offer_price, floor, mode, recipients, dry_run)"
                   " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                   (time.time(), item.id, item.price, price, floor, mode, recipients, int(app.dry_run)))


def offer_for_item(app: App, item: Item) -> str:
    cfg = app.cfg["offers"]
    client = app.client
    price, floor, why = offer_price(item, cfg, app.rng)
    if price is None:
        app.note(MODULE, "offer", item.id, {"reason": why})
        log.info("   ↷ %s : %s", item.title, why)
        return "skipped"
    details = {"title": item.title, "price": item.price, "offer": price, "floor": floor, "favourites": item.favourites}
    desc = f"Offre {price:.2f} € (au lieu de {item.price:.2f} €, {why}) aux {item.favourites} membres intéressés par « {item.title} »"

    try:
        if app.dry_run:
            app.perform(MODULE, "offers", "offer_native", item.id, details, lambda: None, desc)
            _record(app, item, price, floor, "native?", item.favourites)
            return "simulated"
        status, n = app.perform(MODULE, "offers", "offer_native", item.id, details,
                                lambda: client.offer_to_likers(item.id, price), desc)
        _record(app, item, price, floor, "native", n)
        return status
    except FeatureUnavailable as exc:
        app.db.record_action(MODULE, "offer_native", item.id, {"unavailable": str(exc)},
                             dry_run=False, status="skipped")
        log.info("   ↷ Fonction native indisponible pour %s (%s)", item.id, exc)

    if not cfg.get("fallback_individual"):
        return "skipped"
    try:
        likers = client.list_item_likers(item.id)
    except FeatureUnavailable as exc:
        app.notifier.alert("Offre à faire à la main", f"« {item.title} » : {price:.2f} € suggéré ({exc})")
        app.note(MODULE, "offer_individual", item.id, {"reason": str(exc), "suggested": price}, status="flagged")
        return "flagged"
    sent = 0
    for user_id in likers:
        try:
            app.perform(MODULE, "offers", "offer_individual", f"{item.id}:{user_id}", {**details, "user_id": user_id},
                        lambda u=user_id: client.send_individual_offer(item.id, u, price),
                        f"Offre individuelle {price:.2f} € à {user_id} pour « {item.title} »")
            sent += 1
        except FeatureUnavailable as exc:
            app.notifier.alert("Offre à faire à la main", f"« {item.title} » : {price:.2f} € suggéré ({exc})")
            break
    if sent:
        _record(app, item, price, floor, "individual", sent)
        return "done"
    return "flagged"


def run(app: App, max_n: int | None = None) -> dict:
    cfg = app.cfg["offers"]
    app.guard.ensure_running()
    log.info("💸 Offres — mode %s", app.mode)
    items = app.client.list_my_items()
    summary = {"annonces_avec_favoris": 0, "offres": 0, "déjà_faites": 0, "ignorées": 0}
    done = 0
    for item in sorted(items, key=lambda i: -i.favourites):
        if item.is_closed or item.is_reserved or item.is_hidden or item.favourites < int(cfg["min_favourites"]):
            continue
        summary["annonces_avec_favoris"] += 1
        if recently_offered(app, item.id, float(cfg["period_days"])):
            summary["déjà_faites"] += 1
            continue
        try:
            result = offer_for_item(app, item)
        except LimitReached as exc:
            log.warning("⛔ %s", exc)
            break
        if result in ("done", "simulated"):
            summary["offres"] += 1
            done += 1
        else:
            summary["ignorées"] += 1
        if max_n and done >= max_n:
            break
    log.info("💸 Bilan offres : %s", summary)
    return summary
