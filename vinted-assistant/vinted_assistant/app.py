"""Contexte partagé par les modules et point de passage unique de toute action d'écriture."""
from __future__ import annotations

import logging
import random
from dataclasses import dataclass, field
from typing import Any, Callable

from .db import DB
from .notify import Notifier
from .safety import Guard, SafetyStop

log = logging.getLogger("vinted")


@dataclass
class App:
    cfg: dict
    db: DB
    guard: Guard
    client: Any
    dry_run: bool
    notifier: Notifier
    templates: dict = field(default_factory=dict)
    demo: bool = False
    rng: random.Random = field(default_factory=random.Random)

    @property
    def mode(self) -> str:
        return "SIMULATION" if self.dry_run else "RÉEL"

    def perform(self, module: str, kind: str | None, action: str, target: str,
                details: dict, fn: Callable[[], Any], describe: str) -> tuple[str, Any]:
        """Exécute (ou simule) une action d'écriture en respectant arrêt d'urgence et plafonds.

        Retourne (statut, résultat). Statut : simulated | done.
        Lève LimitReached si le plafond est atteint, SafetyStop en cas d'alerte.
        """
        self.guard.ensure_running()
        if kind:
            self.guard.require(kind)
        if self.dry_run:
            log.info("🧪 [SIMULATION] %s", describe)
            self.db.record_action(module, action, target, details, dry_run=True, status="simulated", kind=kind)
            return "simulated", None
        self.guard.pace(action)
        try:
            result = fn()
        except SafetyStop:
            raise
        except Exception as exc:
            self.db.record_action(module, action, target, {**details, "error": str(exc)},
                                  dry_run=False, status="error", kind=kind)
            raise
        log.info("✅ %s", describe)
        self.db.record_action(module, action, target, details, dry_run=False, status="done", kind=kind)
        return "done", result

    def note(self, module: str, action: str, target: str, details: dict, status: str = "skipped") -> None:
        self.db.record_action(module, action, target, details, dry_run=self.dry_run, status=status)
