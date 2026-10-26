"""Notifications locales et gratuites : bureau (si possible), terminal, fichier d'alertes."""
from __future__ import annotations

import logging
import platform
import shutil
import subprocess
import time
from pathlib import Path

log = logging.getLogger("vinted")


class Notifier:
    def __init__(self, cfg: dict, enabled: bool = True):
        self.desktop = cfg["notifications"].get("desktop", True) and enabled
        self.sound = cfg["notifications"].get("sound", True) and enabled
        self.alerts_file = Path(cfg["paths"]["logs"]) / "alertes.log"
        self.sent: list[tuple[str, str]] = []

    def alert(self, title: str, message: str) -> None:
        self.sent.append((title, message))
        log.warning("🔔 %s — %s", title, message)
        try:
            self.alerts_file.parent.mkdir(parents=True, exist_ok=True)
            with self.alerts_file.open("a", encoding="utf-8") as fh:
                fh.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')}  {title} — {message}\n")
        except OSError:
            pass
        if self.sound:
            print("\a", end="", flush=True)
        if self.desktop:
            self._desktop(title, message)

    @staticmethod
    def _desktop(title: str, message: str) -> None:
        try:
            from plyer import notification  # optionnel

            notification.notify(title=title, message=message[:250], app_name="Vinted Assistant")
            return
        except Exception:
            pass
        try:
            system = platform.system()
            if system == "Darwin":
                safe = message.replace('"', "'")[:250]
                subprocess.run(["osascript", "-e", f'display notification "{safe}" with title "{title}"'],
                               check=False, timeout=5)
            elif system == "Linux" and shutil.which("notify-send"):
                subprocess.run(["notify-send", title, message[:250]], check=False, timeout=5)
        except Exception:
            pass
