"""Module 4 — veille best-sellers (lecture seule).

Chaque jour : un snapshot des résultats de recherche par mot-clé. Une annonce récente
qui disparaît d'un jour à l'autre est une vente probable ; quelques-unes sont vérifiées
individuellement (vendue / supprimée). Classement exporté en CSV + rapport HTML.
"""
from __future__ import annotations

import csv
import html
import logging
import re
import statistics
import time
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import quote_plus

from ..app import App
from ..safety import LimitReached

log = logging.getLogger("vinted")
MODULE = "scout"
DAY = 86400


def group_label(keyword: str, brand: str) -> str:
    b = (brand or "").strip()
    if not b or b.lower() in ("sans marque", "autre", "no brand"):
        b = "sans marque"
    return f"{keyword} · {b}"


def take_snapshot(app: App, day: str) -> int:
    cfg = app.cfg["scout"]
    n = 0
    for kw in cfg["keywords"]:
        for page in range(1, int(cfg["pages_per_keyword"]) + 1):
            items = app.client.search_catalog(kw, page, int(cfg["per_page"]), cfg["order"])
            for i in items:
                app.db.execute(
                    "INSERT OR REPLACE INTO scout_snapshots (day, keyword, item_id, title, brand, size, price,"
                    " favourites, created_ts, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (day, kw, i.id, i.title, i.brand, i.size, i.price, i.favourites, i.created_ts, i.url))
            n += len(items)
            log.info("🔎 « %s » page %d : %d annonces", kw, page, len(items))
            if len(items) < int(cfg["per_page"]):
                break
    app.note(MODULE, "snapshot", day, {"items": n}, status="done" if not app.dry_run else "simulated")
    return n


def detect_disappeared(app: App, day: str) -> list[str]:
    cfg = app.cfg["scout"]
    ref = datetime.fromisoformat(day).timestamp() + DAY
    new_ids = []
    for kw in cfg["keywords"]:
        row = app.db.one("SELECT MAX(day) FROM scout_snapshots WHERE keyword = ? AND day < ?", (kw, day))
        prev_day = row[0] if row else None
        if not prev_day:
            continue
        current = {r[0] for r in app.db.query(
            "SELECT item_id FROM scout_snapshots WHERE keyword = ? AND day = ?", (kw, day))}
        for r in app.db.query("SELECT * FROM scout_snapshots WHERE keyword = ? AND day = ?", (kw, prev_day)):
            if r["item_id"] in current:
                continue
            young = r["created_ts"] and (ref - r["created_ts"]) / DAY <= float(cfg["young_days"])
            if not young:
                continue
            cur = app.db.execute(
                "INSERT OR IGNORE INTO scout_disappeared (item_id, keyword, title, brand, price, favourites,"
                " created_ts, last_seen_day, detected_day, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'disappeared')",
                (r["item_id"], kw, r["title"], r["brand"], r["price"], r["favourites"], r["created_ts"], prev_day, day))
            if cur.rowcount:
                new_ids.append(r["item_id"])
    return new_ids


def verify_disappeared(app: App, limit: int) -> dict:
    counts: dict[str, int] = defaultdict(int)
    rows = app.db.query("SELECT item_id FROM scout_disappeared WHERE status = 'disappeared'"
                        " ORDER BY favourites DESC LIMIT ?", (limit,))
    for r in rows:
        state = app.client.item_state(r["item_id"])
        app.db.execute("UPDATE scout_disappeared SET status = ? WHERE item_id = ?", (state, r["item_id"]))
        counts[state] += 1
    return dict(counts)


def ranking(app: App, day: str) -> list[dict]:
    cfg = app.cfg["scout"]
    since = (date.fromisoformat(day) - timedelta(days=int(cfg["window_days"]))).isoformat()
    latest: dict[str, dict] = {}
    for r in app.db.query("SELECT * FROM scout_snapshots WHERE day >= ? AND day <= ? ORDER BY day",
                          (since, day)):
        latest[r["item_id"]] = dict(r)  # la dernière observation l'emporte
    sold_info = {r["item_id"]: dict(r) for r in app.db.query("SELECT * FROM scout_disappeared")}

    groups: dict[str, list[dict]] = defaultdict(list)
    for it in latest.values():
        groups[group_label(it["keyword"], it["brand"])].append(it)

    rows = []
    for label, items in groups.items():
        if len(items) < 2:
            continue
        prices = [i["price"] for i in items if i["price"]]
        favs = [i["favourites"] or 0 for i in items]
        sold_w, days_to_sell, n_sold, n_unverified = 0.0, [], 0, 0
        for i in items:
            s = sold_info.get(i["item_id"])
            if not s or s["status"] in ("active", "gone"):
                continue
            if s["status"] == "sold":
                sold_w += 1
                n_sold += 1
            else:
                sold_w += 0.5
                n_unverified += 1
            if s["created_ts"]:
                end = datetime.fromisoformat(s["detected_day"]).timestamp()
                days_to_sell.append(max(0.5, (end - s["created_ts"]) / DAY))
        sell_rate = sold_w / len(items)
        avg_days = statistics.mean(days_to_sell) if days_to_sell else None
        avg_favs = statistics.mean(favs) if favs else 0
        speed = 1 / (1 + avg_days / 7) if avg_days else 0
        score = round(50 * min(sell_rate * 3, 1) + 30 * min(avg_favs / 20, 1) + 20 * speed, 1)
        keyword, brand = label.split(" · ", 1)
        top = sorted(items, key=lambda i: -(i["favourites"] or 0))[:3]
        query = keyword if brand == "sans marque" else f"{keyword} {brand}"
        rows.append({
            "article": label, "mot_cle": keyword, "marque": brand, "annonces_suivies": len(items),
            "prix_moyen": round(statistics.mean(prices), 2) if prices else 0,
            "prix_median": round(statistics.median(prices), 2) if prices else 0,
            "favoris_moyens": round(avg_favs, 1), "favoris_max": max(favs) if favs else 0,
            "ventes_verifiees": n_sold, "disparitions_non_verifiees": n_unverified,
            "taux_de_vente": round(sell_rate * 100, 1),
            "jours_avant_vente": round(avg_days, 1) if avg_days else "",
            "score": score,
            "recherche_vinted": f"{app.cfg['vinted']['base_url']}/catalog?search_text={quote_plus(query)}",
            "exemples": " | ".join(i["url"] for i in top if i["url"]),
        })
    rows.sort(key=lambda r: -r["score"])
    return rows[: int(cfg["report_top"])]


def write_reports(app: App, rows: list[dict], day: str) -> tuple[Path, Path]:
    out = Path(app.cfg["paths"]["reports"])
    out.mkdir(parents=True, exist_ok=True)
    csv_path, html_path = out / f"classement_{day}.csv", out / f"classement_{day}.html"
    fields = list(rows[0].keys()) if rows else ["article"]
    with csv_path.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, delimiter=";")
        w.writeheader()
        w.writerows(rows)

    def link(url: str, text: str) -> str:
        return f'<a href="{html.escape(url)}" target="_blank" rel="noopener">{html.escape(text)}</a>'

    body = "".join(
        "<tr>"
        f"<td>{n}</td><td><strong>{html.escape(r['article'])}</strong></td>"
        f"<td>{r['prix_moyen']:.2f} €</td><td>{r['prix_median']:.2f} €</td>"
        f"<td>{r['favoris_moyens']}</td><td>{r['taux_de_vente']} %</td>"
        f"<td>{r['jours_avant_vente'] or '—'}</td><td>{r['annonces_suivies']}</td>"
        f"<td><span class='score'>{r['score']}</span></td>"
        f"<td>{link(r['recherche_vinted'], 'recherche')} "
        + " ".join(link(u, f'#{k}') for k, u in enumerate(filter(None, r['exemples'].split(' | ')), 1))
        + "</td></tr>"
        for n, r in enumerate(rows, 1)
    )
    has_sales = any(r["ventes_verifiees"] or r["disparitions_non_verifiees"] for r in rows)
    note = "" if has_sales else ("<p class='note'>Les ventes apparaissent à partir du 2ᵉ jour de veille "
                                 "(comparaison de deux snapshots). Classement actuel basé sur les favoris.</p>")
    html_path.write_text(f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Veille Vinted {day}</title>
<style>
:root {{ --bg:#f7f7f5; --fg:#1d1d1b; --muted:#6b6b66; --line:#e2e2dc; --accent:#09757a; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#141413; --fg:#ecece8; --muted:#9a9a93; --line:#2c2c29; --accent:#4fc1c6; }} }}
body {{ font: 15px/1.45 system-ui, sans-serif; background:var(--bg); color:var(--fg); margin:0; padding:24px 16px; }}
main {{ max-width:1200px; margin:0 auto; }} h1 {{ margin:0 0 4px; font-size:22px; }}
p {{ color:var(--muted); margin:0 0 16px; }} .note {{ color:var(--fg); }}
.wrap {{ overflow-x:auto; }} table {{ border-collapse:collapse; width:100%; }}
th, td {{ padding:8px 10px; border-bottom:1px solid var(--line); text-align:left; white-space:nowrap; }}
th {{ font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }}
td:nth-child(n+3):nth-child(-n+9) {{ text-align:right; font-variant-numeric: tabular-nums; }}
a {{ color:var(--accent); }} .score {{ font-weight:600; }}
</style></head><body><main>
<h1>Veille best-sellers — {day}</h1>
<p>Score = 50 % taux de vente + 30 % favoris + 20 % vitesse. Ventes vérifiées = 1, disparitions non vérifiées = ½.</p>
{note}
<div class="wrap"><table><thead><tr><th>#</th><th>Article</th><th>Prix moyen</th><th>Médiane</th><th>Favoris moy.</th>
<th>Taux de vente</th><th>Jours avant vente</th><th>Annonces</th><th>Score</th><th>Liens</th></tr></thead>
<tbody>{body}</tbody></table></div></main></body></html>""", encoding="utf-8")
    return csv_path, html_path


def _item_id(ref: str) -> str:
    m = re.search(r"/items/(\d+)", str(ref))
    return m.group(1) if m else str(ref).strip()


def favourite_approved(app: App) -> int:
    approved = [_item_id(x) for x in app.cfg["scout"].get("favourite_approved") or []]
    n = 0
    for item_id in approved:
        if app.db.one("SELECT 1 FROM scout_favourited WHERE item_id = ? AND dry_run = ?", (item_id, int(app.dry_run))):
            continue
        try:
            app.perform(MODULE, "likes", "favourite", item_id, {}, lambda i=item_id: app.client.favourite_item(i),
                        f"Ajout en favori de l'annonce {item_id} (liste approuvée)")
        except LimitReached as exc:
            log.warning("⛔ %s", exc)
            break
        app.db.execute("INSERT OR IGNORE INTO scout_favourited (item_id, ts, dry_run) VALUES (?, ?, ?)",
                       (item_id, time.time(), int(app.dry_run)))
        n += 1
    return n


def run(app: App, favourite: bool = False, day: str | None = None) -> dict:
    cfg = app.cfg["scout"]
    app.guard.ensure_running()
    day = day or date.today().isoformat()
    if not cfg["keywords"]:
        log.warning("Aucun mot-clé dans config.yaml (scout.keywords).")
        return {}
    log.info("🔎 Veille — %d mot(s)-clé(s), lecture seule", len(cfg["keywords"]))
    summary: dict = {}
    try:
        summary["annonces_relevées"] = take_snapshot(app, day)
        summary["nouvelles_disparitions"] = len(detect_disappeared(app, day))
        summary["vérifications"] = verify_disappeared(app, int(cfg["verify_disappeared_max"]))
    except LimitReached as exc:
        log.warning("⛔ %s", exc)
    rows = ranking(app, day)
    csv_path, html_path = write_reports(app, rows, day)
    summary["classement"] = len(rows)
    log.info("📊 Classement : %s\n             %s", csv_path, html_path)
    for n, r in enumerate(rows[:5], 1):
        log.info("   %d. %s — %.2f € moy., %s favoris moy., taux de vente %s %%, score %s",
                 n, r["article"], r["prix_moyen"], r["favoris_moyens"], r["taux_de_vente"], r["score"])
    if favourite:
        summary["favoris_ajoutés"] = favourite_approved(app)
    return summary
