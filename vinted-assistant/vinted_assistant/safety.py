"""Garde-fous : délais humains, plafonds quotidiens, arrêt d'urgence."""
from __future__ import annotations

import logging
import random
import re
import time
import unicodedata
from typing import Callable

from .db import DB, today
from .notify import Notifier

log = logging.getLogger("vinted")

# Textes qui déclenchent l'arrêt immédiat s'ils apparaissent sur une page Vinted.
WARNING_PATTERNS = [
    r"activite inhabituelle",
    r"activite suspecte",
    r"comportement (automatise|suspect|inhabituel)",
    r"compte (a ete |est )?(suspendu|bloque|restreint|limite|desactive)",
    r"avertissement",
    r"trop de (requetes|tentatives|demandes)",
    r"reessaie(z)? plus tard",
    r"verifie(z)? que (tu es|vous etes) (un )?humain",
    r"nous avons (bloque|restreint)",
]


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text.lower().replace("’", "'")


class SafetyStop(Exception):
    """Arrêt d'urgence : captcha, avertissement, 429/403. Nécessite `python main.py resume`."""


class LimitReached(Exception):
    """Plafond quotidien atteint pour un type d'action."""


class Guard:
    def __init__(self, cfg: dict, db: DB, notifier: Notifier, dry_run: bool,
                 fast: bool = False, sleep: Callable[[float], None] = time.sleep,
                 rng: random.Random | None = None):
        self.cfg = cfg
        self.db = db
        self.notifier = notifier
        self.dry_run = dry_run
        self.fast = fast          # mode démo / tests : aucune attente
        self._sleep = sleep
        self.rng = rng or random.Random()
        self._count = 0
        self._next_long = self._draw_long()

    # ------------------------------------------------------------------ arrêt d'urgence
    def ensure_running(self) -> None:
        halt = self.db.get_state("halt")
        if halt:
            raise SafetyStop(
                f"Outil à l'arrêt depuis {halt.get('at')} : {halt.get('reason')}. "
                "Vérifie ton compte dans le navigateur, puis lance `python main.py resume`."
            )

    def halt(self, reason: str, detail: str = "") -> None:
        at = time.strftime("%Y-%m-%d %H:%M:%S")
        self.db.set_state("halt", {"reason": reason, "detail": detail, "at": at})
        self.db.record_action("safety", "halt", detail[:200], {"reason": reason},
                              dry_run=self.dry_run, status="stopped")
        self.notifier.alert("Vinted Assistant ARRÊTÉ", f"{reason} {detail}".strip())
        raise SafetyStop(reason)

    def check_page_text(self, text: str) -> str | None:
        norm = normalize(text)
        for pattern in WARNING_PATTERNS:
            if re.search(pattern, norm):
                return pattern
        return None

    # ------------------------------------------------------------------ plafonds
    def limit(self, kind: str) -> int:
        return int(self.cfg["limits"].get(kind, 0))

    def remaining(self, kind: str) -> int:
        return max(0, self.limit(kind) - self.db.count_actions(kind, self.dry_run))

    def require(self, kind: str) -> None:
        if self.remaining(kind) <= 0:
            raise LimitReached(f"Plafond quotidien atteint pour « {kind} » ({self.limit(kind)}/jour).")

    def count_read(self) -> None:
        key = f"reads:{'dry' if self.dry_run else 'live'}"
        n = self.db.incr(key, day=today())
        if n > self.limit("page_reads"):
            raise LimitReached(f"Plafond quotidien de lectures atteint ({self.limit('page_reads')}).")

    # ------------------------------------------------------------------ rythme humain
    def _draw_long(self) -> int:
        lo, hi = self.cfg["human"]["long_pause_every"]
        return self.rng.randint(int(lo), int(hi))

    def pace(self, label: str = "") -> float:
        """Attend un délai aléatoire (3-12 s par défaut) et parfois une pause longue."""
        self.ensure_running()
        h = self.cfg["human"]
        delay = self.rng.uniform(float(h["min_delay_s"]), float(h["max_delay_s"]))
        self._count += 1
        if self._count >= self._next_long:
            lo, hi = h["long_pause_s"]
            delay += self.rng.uniform(float(lo), float(hi))
            self._count = 0
            self._next_long = self._draw_long()
            log.info("☕ Pause longue de %.0f s", delay)
        else:
            log.debug("⏳ %.1f s %s", delay, label)
        if not self.fast:
            self._sleep(delay)
        return delay
