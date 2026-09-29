#!/usr/bin/env python3
"""Watch for a second display being connected and start jarvis.py.

Meant to run continuously in the background (installed as a LaunchAgent via
install_watch.sh), not launched directly for normal use.
"""

from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
PYTHON = PROJECT_DIR / ".venv" / "bin" / "python"
JARVIS = PROJECT_DIR / "jarvis.py"
LOG_FILE = PROJECT_DIR / ".cache" / "jarvis_run.log"
POLL_S = 3

_SCREEN_COUNT_JS = 'ObjC.import("AppKit"); $.NSScreen.screens.length'


def screen_count() -> int:
    try:
        result = subprocess.run(
            ["osascript", "-l", "JavaScript", "-e", _SCREEN_COUNT_JS],
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        )
        return int(result.stdout.strip())
    except (OSError, subprocess.SubprocessError, ValueError):
        return 1


def jarvis_running() -> bool:
    result = subprocess.run(["pgrep", "-f", str(JARVIS)], capture_output=True, text=True)
    return bool(result.stdout.strip())


def main() -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    previous = screen_count()
    while True:
        time.sleep(POLL_S)
        current = screen_count()
        if current >= 2 and previous < 2 and not jarvis_running():
            with open(LOG_FILE, "a") as log:
                subprocess.Popen(
                    [str(PYTHON), str(JARVIS)],
                    stdout=log,
                    stderr=log,
                    cwd=str(PROJECT_DIR),
                    start_new_session=True,
                )
        previous = current


if __name__ == "__main__":
    main()
