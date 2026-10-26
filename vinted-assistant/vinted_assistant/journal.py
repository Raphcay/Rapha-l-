"""Configuration des logs (console + fichier tournant)."""
from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path


def setup_logging(logs_dir: str, verbose: bool = False) -> logging.Logger:
    Path(logs_dir).mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("vinted")
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()

    file_handler = RotatingFileHandler(Path(logs_dir) / "vinted-assistant.log",
                                       maxBytes=2_000_000, backupCount=5, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)-7s %(message)s"))

    console = logging.StreamHandler()
    console.setLevel(logging.DEBUG if verbose else logging.INFO)
    console.setFormatter(logging.Formatter("%(asctime)s  %(message)s", "%H:%M:%S"))

    logger.addHandler(file_handler)
    logger.addHandler(console)
    return logger
