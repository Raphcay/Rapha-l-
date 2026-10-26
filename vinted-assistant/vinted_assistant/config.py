"""Chargement de config.yaml / templates.yaml avec valeurs par défaut."""
from __future__ import annotations

import copy
from pathlib import Path
from typing import Any

import yaml

DEFAULTS: dict[str, Any] = {
    "dry_run": True,
    "vinted": {
        "base_url": "https://www.vinted.fr",
        "user_id": None,
        "profile_dir": "./data/browser-profile",
        "headless": False,
        "executable_path": None,
        "locale": "fr-FR",
        "timezone": "Europe/Paris",
        "endpoints": {},
    },
    "human": {
        "min_delay_s": 3,
        "max_delay_s": 12,
        "long_pause_every": [5, 9],
        "long_pause_s": [60, 240],
        "active_hours": ["07:30", "22:00"],
    },
    "limits": {"replies": 40, "offers": 30, "republish": 15, "likes": 10, "page_reads": 400},
    "replies": {
        "max_conversations_per_run": 20,
        "poll_minutes": [20, 45],
        "auto_categories": ["disponibilite", "envoi", "taille_etat"],
    },
    "republish": {
        "min_days_without_sale": 14,
        "old_listing_action": "delete",
        "max_per_run": 1,
        "min_gap_minutes": 30,
        "default_slots": [
            {"days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], "start": "07:30", "end": "09:00"},
            {"days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], "start": "18:00", "end": "21:00"},
        ],
        "use_my_stats": True,
        "min_stats_days": 14,
        "hours_per_day": 3,
        "snapshot_every_minutes": 120,
        "exclude_item_ids": [],
    },
    "offers": {
        "discount_pct": [5, 10],
        "default_floor_pct": 90,
        "floors": {},
        "period_days": 7,
        "min_favourites": 1,
        "fallback_individual": True,
    },
    "scout": {
        "keywords": [],
        "order": "relevance",
        "pages_per_keyword": 1,
        "per_page": 48,
        "young_days": 21,
        "verify_disappeared_max": 10,
        "window_days": 30,
        "report_top": 30,
        "favourite_approved": [],
    },
    "sourcing": {
        "dhgate_base_url": "https://www.dhgate.com",
        "fetch_dhgate": True,
        "max_products": 10,
        "results_per_product": 5,
        "usd_to_eur": 0.92,
        "default_shipping_eur": 4.0,
        "packaging_eur": 0.5,
        "seller_fee_pct": 0,
        "seller_fee_fixed_eur": 0,
        "buyer_protection_pct": 5,
        "buyer_protection_fixed_eur": 0.70,
        "min_margin_eur": 5,
        "block_brands": True,
        "manual_quotes": {},
    },
    "new_listing": {"price_discount_vs_median_pct": 5, "shipping_delay": "sous 2 jours"},
    "notifications": {"desktop": True, "sound": True},
    "paths": {
        "db": "./data/vinted.sqlite",
        "logs": "./logs",
        "backups": "./backups",
        "reports": "./reports",
        "drafts": "./data/drafts",
    },
}

PATH_KEYS = [("paths", k) for k in DEFAULTS["paths"]] + [("vinted", "profile_dir")]


def deep_merge(base: dict, override: dict) -> dict:
    out = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out


def load_config(path: str | Path = "config.yaml", overrides: dict | None = None) -> dict:
    path = Path(path).resolve()
    data: dict = {}
    if path.exists():
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    cfg = deep_merge(DEFAULTS, data)
    if overrides:
        cfg = deep_merge(cfg, overrides)
    base_dir = path.parent
    for section, key in PATH_KEYS:
        p = Path(cfg[section][key]).expanduser()
        cfg[section][key] = str(p if p.is_absolute() else (base_dir / p).resolve())
    # Les planchers peuvent être saisis avec des clés numériques dans le YAML.
    cfg["offers"]["floors"] = {str(k): float(v) for k, v in (cfg["offers"]["floors"] or {}).items()}
    cfg["_base_dir"] = str(base_dir)
    return cfg


def load_templates(path: str | Path) -> dict:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Fichier de modèles introuvable : {path}")
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
