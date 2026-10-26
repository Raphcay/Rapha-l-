"""Mode `run` : planifie tous les modules dans la journée, un seul à la fois."""
from __future__ import annotations

import logging
import time
from datetime import date, datetime, time as dtime, timedelta

from ..app import App
from ..safety import LimitReached, SafetyStop
from ..slots import best_slots, hm, spread_times, windows_for_day
from . import offers, replies, republish, scout

log = logging.getLogger("vinted")


def _at(day: date, minutes: int) -> datetime:
    return datetime.combine(day, dtime()) + timedelta(minutes=minutes)


def plan_day(app: App, day: date, now: datetime) -> list[tuple[datetime, str]]:
    cfg, rng = app.cfg, app.rng
    start, end = (_at(day, hm(x)) for x in cfg["human"]["active_hours"])
    start = max(start, now)
    if start >= end:
        return []
    tasks: list[tuple[datetime, str]] = []

    lo, hi = cfg["replies"]["poll_minutes"]
    t = start + timedelta(minutes=rng.uniform(1, 5))
    while t < end:
        tasks.append((t, "replies"))
        t += timedelta(minutes=rng.uniform(float(lo), float(hi)))

    every = float(cfg["republish"]["snapshot_every_minutes"])
    t = start + timedelta(minutes=rng.uniform(10, 30))
    while t < end:
        tasks.append((t, "snapshot"))
        t += timedelta(minutes=every * rng.uniform(0.85, 1.15))

    slots, _ = best_slots(app.db, cfg)
    windows = windows_for_day(slots, day)
    n_rep = min(app.guard.remaining("republish"), int(app.db.get_state("eligible_count", 2)))
    for t in spread_times(windows, n_rep, int(cfg["republish"]["min_gap_minutes"]), rng, not_before=start):
        tasks.append((t, "republish"))

    offer_time = spread_times(windows[-1:] or [(start, end)], 1, 1, rng, not_before=start)
    if offer_time:
        tasks.append((offer_time[0], "offers"))

    if cfg["scout"]["keywords"] and not app.db.one("SELECT 1 FROM scout_snapshots WHERE day = ?", (day.isoformat(),)):
        scout_end = min(end, start + timedelta(hours=3))
        tasks += [(t, "scout") for t in spread_times([(start, scout_end)], 1, 1, rng)]

    tasks.sort()
    # Jamais deux tâches collées : au moins 2 minutes d'écart.
    spaced: list[tuple[datetime, str]] = []
    for t, name in tasks:
        if spaced and t < spaced[-1][0] + timedelta(minutes=2):
            if name == "replies" or name == "snapshot":
                continue
            t = spaced[-1][0] + timedelta(minutes=2)
        spaced.append((t, name))
    return spaced


def execute(app: App, name: str) -> None:
    if name == "replies":
        replies.run(app)
    elif name == "snapshot":
        items = app.client.list_my_items()
        republish.snapshot_my_items(app, items)
        app.db.set_state("eligible_count", len(republish.eligible(app, items)))
        log.info("📈 Relevé vues/favoris enregistré")
    elif name == "republish":
        republish.run(app, now=True, max_n=1)
    elif name == "offers":
        offers.run(app)
    elif name == "scout":
        scout.run(app)


def _sleep_until(app: App, when: datetime) -> None:
    if app.guard.fast:
        return
    while True:
        left = (when - datetime.now()).total_seconds()
        if left <= 0:
            return
        time.sleep(min(left, 60))


def run(app: App, plan_only: bool = False, once: bool = False) -> None:
    log.info("🤖 Mode run — %s. Ctrl+C pour arrêter proprement.", app.mode)
    errors = 0
    while True:
        app.guard.ensure_running()
        now = datetime.now()
        plan = plan_day(app, now.date(), now)
        if once and not plan_only:
            seen, plan = set(), [(now, n) for _, n in plan]
            plan = [(t, n) for t, n in plan if not (n in seen or seen.add(n))]
        log.info("🗓  Plan du %s : %s", now.strftime("%d/%m"),
                 ", ".join(f"{t:%H:%M} {n}" for t, n in plan if n not in ("replies", "snapshot"))
                 + f" (+ {sum(n == 'replies' for _, n in plan)} relèves messagerie)")
        if plan_only:
            return
        for when, name in plan:
            _sleep_until(app, when)
            try:
                execute(app, name)
                errors = 0
            except SafetyStop as exc:
                log.error("⛔ ARRÊT : %s", exc)
                return
            except LimitReached as exc:
                log.warning("⛔ %s", exc)
            except KeyboardInterrupt:
                raise
            except Exception as exc:
                errors += 1
                log.exception("❌ Tâche %s en échec : %s", name, exc)
                if errors >= 3:
                    app.notifier.alert("Vinted Assistant", "3 erreurs d'affilée : pause de 30 min")
                    if not app.guard.fast:
                        time.sleep(1800)
                    errors = 0
        if once:
            return
        tomorrow = datetime.combine(date.today() + timedelta(days=1), dtime())
        start = tomorrow + timedelta(minutes=hm(app.cfg["human"]["active_hours"][0]))
        log.info("🌙 Journée terminée, reprise le %s", start.strftime("%d/%m à %H:%M"))
        _sleep_until(app, start)
