"""`python main.py status` : résumé de l'activité et de l'état de l'outil."""
from __future__ import annotations

import json
import time
from datetime import date, datetime

from ..app import App
from ..slots import best_slots
from . import scout

KINDS = [("replies", "Réponses"), ("offers", "Offres"), ("republish", "Republications"), ("likes", "Favoris")]


def run(app: App) -> str:
    db, cfg = app.db, app.cfg
    out = []
    halt = db.get_state("halt")
    out.append("══════════ Vinted Assistant — état ══════════")
    out.append(f"Mode par défaut : {'SIMULATION (dry-run)' if cfg['dry_run'] else 'RÉEL'}"
               + ("   [base démo]" if app.demo else ""))
    out.append(f"État : {'⛔ ARRÊTÉ — ' + halt['reason'] + ' (' + halt['at'] + ') → python main.py resume' if halt else '✅ actif'}")

    out.append(f"\nAujourd'hui ({date.today():%d/%m/%Y})        réel / simulé / plafond")
    for kind, label in KINDS:
        out.append(f"  {label:<18} {db.count_actions(kind, False):>5} / {db.count_actions(kind, True):>6} / {cfg['limits'][kind]:>4}")
    out.append(f"  {'Lectures':<18} {db.counter('reads:live'):>5} / {db.counter('reads:dry'):>6} / {cfg['limits']['page_reads']:>4}")

    week = time.time() - 7 * 86400
    n_offers = db.one("SELECT COUNT(*) FROM offers WHERE ts >= ? AND dry_run = 0", (week,))[0]
    n_rep = db.one("SELECT COUNT(*) FROM republications WHERE ts >= ? AND dry_run = 0", (week,))[0]
    out.append(f"\n7 derniers jours : {n_offers} offre(s) réelle(s), {n_rep} republication(s) réelle(s)")

    slots, source = best_slots(db, cfg)
    today_slots = [s.label() for s in slots if s.weekday == datetime.now().weekday()]
    out.append(f"Créneaux du jour ({source}) : {', '.join(today_slots) or 'aucun'}")

    flags = db.query("SELECT * FROM flags WHERE status = 'open' ORDER BY ts DESC LIMIT 10")
    total = db.one("SELECT COUNT(*) FROM flags WHERE status = 'open'")[0]
    out.append(f"\n🚩 Messages à traiter toi-même : {total}")
    for f in flags:
        out.append(f"  #{f['id']} {datetime.fromtimestamp(f['ts']):%d/%m %H:%M} [{f['category']}] "
                   f"{f['excerpt'][:70]!r}  {f['url'] or ''}")

    last_day = db.one("SELECT MAX(day) FROM scout_snapshots")[0]
    if last_day:
        rows = scout.ranking(app, last_day)[:3]
        out.append(f"\n🔎 Veille (dernier relevé {last_day}) — top 3 :")
        for n, r in enumerate(rows, 1):
            out.append(f"  {n}. {r['article']} — {r['prix_moyen']:.2f} € — score {r['score']}")

    out.append("\nDernières actions :")
    for a in db.query("SELECT * FROM actions ORDER BY id DESC LIMIT 10"):
        det = json.loads(a["details"] or "{}")
        hint = det.get("title") or det.get("category") or det.get("reason") or det.get("error") or ""
        out.append(f"  {datetime.fromtimestamp(a['ts']):%d/%m %H:%M}  {a['status']:<9} {a['module']:<10} "
                   f"{a['action']:<16} {str(a['target'] or '')[:14]:<14} {str(hint)[:50]}")
    text = "\n".join(out)
    print(text)
    return text
