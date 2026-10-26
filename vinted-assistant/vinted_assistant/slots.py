"""Créneaux de republication : par défaut (config) ou calculés depuis tes propres stats."""
from __future__ import annotations

import random
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time as dtime, timedelta

from .db import DB

DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
DAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


@dataclass(frozen=True)
class Slot:
    weekday: int   # 0 = lundi
    start: int     # minutes depuis minuit
    end: int

    def label(self) -> str:
        return f"{DAYS_FR[self.weekday]} {self.start // 60:02d}h{self.start % 60:02d}-{self.end // 60:02d}h{self.end % 60:02d}"


def hm(value: str) -> int:
    h, m = str(value).split(":")
    return int(h) * 60 + int(m)


def parse_slots(spec: list[dict]) -> list[Slot]:
    out = []
    for s in spec:
        for d in s.get("days", DAYS):
            out.append(Slot(DAYS.index(str(d)[:3].lower()), hm(s["start"]), hm(s["end"])))
    return sorted(set(out), key=lambda s: (s.weekday, s.start))


def slots_from_stats(db: DB, cfg: dict, now: datetime | None = None) -> list[Slot] | None:
    """Score par (jour, heure) = vues gagnées + 3 × favoris gagnés entre deux relevés."""
    rcfg = cfg["republish"]
    rows = db.query("SELECT ts, item_id, views, favourites FROM my_item_snapshots ORDER BY item_id, ts")
    if not rows:
        return None
    span_days = (rows and (max(r["ts"] for r in rows) - min(r["ts"] for r in rows)) / 86400)
    if span_days < float(rcfg["min_stats_days"]):
        return None
    scores: dict[tuple[int, int], float] = defaultdict(float)
    prev = None
    for r in rows:
        if prev is not None and prev["item_id"] == r["item_id"] and 0 < r["ts"] - prev["ts"] <= 6 * 3600:
            gain = max(0, (r["views"] or 0) - (prev["views"] or 0)) + 3 * max(0, (r["favourites"] or 0) - (prev["favourites"] or 0))
            start, end = datetime.fromtimestamp(prev["ts"]), datetime.fromtimestamp(r["ts"])
            hours = []
            t = start.replace(minute=0, second=0, microsecond=0)
            while t < end:
                hours.append((t.weekday(), t.hour))
                t += timedelta(hours=1)
            for key in hours:
                scores[key] += gain / len(hours)
        prev = r
    a_start, a_end = (hm(x) for x in cfg["human"]["active_hours"])
    slots = []
    for wd in range(7):
        candidates = sorted(((s, h) for (d, h), s in scores.items()
                             if d == wd and s > 0 and h * 60 >= a_start and (h + 1) * 60 <= a_end), reverse=True)
        hours = sorted(h for _, h in candidates[: int(rcfg["hours_per_day"])])
        for h in hours:  # fusion des heures consécutives
            if slots and slots[-1].weekday == wd and slots[-1].end == h * 60:
                slots[-1] = Slot(wd, slots[-1].start, (h + 1) * 60)
            else:
                slots.append(Slot(wd, h * 60, (h + 1) * 60))
    return slots or None


def best_slots(db: DB, cfg: dict, now: datetime | None = None) -> tuple[list[Slot], str]:
    if cfg["republish"].get("use_my_stats"):
        stats = slots_from_stats(db, cfg, now)
        if stats:
            return stats, "tes statistiques"
    return parse_slots(cfg["republish"]["default_slots"]), "créneaux par défaut"


def windows_for_day(slots: list[Slot], day: date) -> list[tuple[datetime, datetime]]:
    base = datetime.combine(day, dtime())
    return [(base + timedelta(minutes=s.start), base + timedelta(minutes=s.end))
            for s in slots if s.weekday == day.weekday()]


def in_slot(slots: list[Slot], when: datetime) -> bool:
    return any(a <= when < b for a, b in windows_for_day(slots, when.date()))


def spread_times(windows: list[tuple[datetime, datetime]], n: int, min_gap_minutes: int,
                 rng: random.Random | None = None, not_before: datetime | None = None) -> list[datetime]:
    """Répartit n instants dans les fenêtres, à intervalles irréguliers, jamais en rafale."""
    rng = rng or random.Random()
    if not_before:
        windows = [(max(a, not_before), b) for a, b in windows if b > not_before]
    windows = [(a, b) for a, b in windows if b > a]
    total = sum((b - a).total_seconds() / 60 for a, b in windows)
    if n <= 0 or total <= 0:
        return []
    n = min(n, max(1, int(total // max(1, min_gap_minutes))))
    segment = total / n
    offsets = []
    for i in range(n):
        lo = i * segment + (min_gap_minutes / 2 if i else 0)
        hi = (i + 1) * segment - (min_gap_minutes / 2 if i < n - 1 else 0)
        offsets.append(rng.uniform(lo, max(lo, hi)))
    out = []
    for off in offsets:
        for a, b in windows:
            length = (b - a).total_seconds() / 60
            if off < length:
                out.append(a + timedelta(minutes=off))
                break
            off -= length
    return out
