"""Stockage SQLite : journal des actions, mémoire des offres, snapshots de veille…"""
from __future__ import annotations

import json
import sqlite3
import time
from datetime import date
from pathlib import Path
from typing import Any, Iterable

SCHEMA = """
CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    day TEXT NOT NULL,
    module TEXT NOT NULL,
    kind TEXT,                 -- clé de plafond (replies, offers, republish, likes) ou NULL
    action TEXT NOT NULL,
    target TEXT,
    details TEXT,
    dry_run INTEGER NOT NULL,
    status TEXT NOT NULL        -- done | simulated | skipped | flagged | error | stopped
);
CREATE INDEX IF NOT EXISTS idx_actions_day ON actions(day, kind, dry_run, status);

CREATE TABLE IF NOT EXISTS counters (
    day TEXT NOT NULL, key TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, key)
);

CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS handled_messages (
    message_id TEXT NOT NULL,
    dry_run INTEGER NOT NULL,
    conversation_id TEXT,
    outcome TEXT,              -- replied | flagged
    category TEXT,
    ts REAL,
    PRIMARY KEY (message_id, dry_run)
);

CREATE TABLE IF NOT EXISTS flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    conversation_id TEXT,
    message_id TEXT,
    category TEXT,
    reason TEXT,
    excerpt TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    dry_run INTEGER NOT NULL DEFAULT 1,
    UNIQUE (message_id, dry_run)
);

CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    item_id TEXT NOT NULL,
    original_price REAL,
    offer_price REAL,
    floor REAL,
    mode TEXT,                 -- native | individual
    recipients INTEGER,
    dry_run INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_offers_item ON offers(item_id, ts);

CREATE TABLE IF NOT EXISTS republications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    old_item_id TEXT NOT NULL,
    new_item_id TEXT,
    title TEXT,
    backup_path TEXT,
    old_action TEXT,
    dry_run INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS my_item_snapshots (
    ts REAL NOT NULL,
    item_id TEXT NOT NULL,
    views INTEGER,
    favourites INTEGER,
    price REAL,
    PRIMARY KEY (ts, item_id)
);

CREATE TABLE IF NOT EXISTS scout_snapshots (
    day TEXT NOT NULL,
    keyword TEXT NOT NULL,
    item_id TEXT NOT NULL,
    title TEXT,
    brand TEXT,
    size TEXT,
    price REAL,
    favourites INTEGER,
    created_ts REAL,
    url TEXT,
    PRIMARY KEY (day, keyword, item_id)
);

CREATE TABLE IF NOT EXISTS scout_disappeared (
    item_id TEXT PRIMARY KEY,
    keyword TEXT,
    title TEXT,
    brand TEXT,
    price REAL,
    favourites INTEGER,
    created_ts REAL,
    last_seen_day TEXT,
    detected_day TEXT,
    status TEXT                -- sold (vérifié) | gone (supprimée) | disappeared (non vérifiée) | active
);

CREATE TABLE IF NOT EXISTS scout_favourited (
    item_id TEXT NOT NULL, ts REAL NOT NULL, dry_run INTEGER NOT NULL,
    PRIMARY KEY (item_id, dry_run)
);
"""


def today() -> str:
    return date.today().isoformat()


class DB:
    def __init__(self, path: str | Path):
        path = Path(path)
        if str(path) != ":memory:":
            path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(path))
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        self.conn.commit()

    # ------------------------------------------------------------------ bas niveau
    def execute(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Cursor:
        cur = self.conn.execute(sql, tuple(params))
        self.conn.commit()
        return cur

    def query(self, sql: str, params: Iterable[Any] = ()) -> list[sqlite3.Row]:
        return self.conn.execute(sql, tuple(params)).fetchall()

    def one(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Row | None:
        return self.conn.execute(sql, tuple(params)).fetchone()

    # ------------------------------------------------------------------ journal
    def record_action(self, module: str, action: str, target: str | None = None,
                      details: dict | None = None, dry_run: bool = True,
                      status: str = "done", kind: str | None = None) -> int:
        cur = self.execute(
            "INSERT INTO actions (ts, day, module, kind, action, target, details, dry_run, status)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (time.time(), today(), module, kind, action, target,
             json.dumps(details or {}, ensure_ascii=False), int(dry_run), status),
        )
        return cur.lastrowid

    def count_actions(self, kind: str, dry_run: bool, day: str | None = None) -> int:
        status = "simulated" if dry_run else "done"
        row = self.one(
            "SELECT COUNT(*) FROM actions WHERE day = ? AND kind = ? AND dry_run = ? AND status = ?",
            (day or today(), kind, int(dry_run), status),
        )
        return int(row[0])

    # ------------------------------------------------------------------ compteurs / état
    def incr(self, key: str, n: int = 1, day: str | None = None) -> int:
        day = day or today()
        self.execute(
            "INSERT INTO counters (day, key, value) VALUES (?, ?, ?)"
            " ON CONFLICT(day, key) DO UPDATE SET value = value + excluded.value",
            (day, key, n),
        )
        return self.counter(key, day)

    def counter(self, key: str, day: str | None = None) -> int:
        row = self.one("SELECT value FROM counters WHERE day = ? AND key = ?", (day or today(), key))
        return int(row[0]) if row else 0

    def get_state(self, key: str, default: Any = None) -> Any:
        row = self.one("SELECT value FROM state WHERE key = ?", (key,))
        return json.loads(row[0]) if row else default

    def set_state(self, key: str, value: Any) -> None:
        self.execute(
            "INSERT INTO state (key, value) VALUES (?, ?)"
            " ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, json.dumps(value, ensure_ascii=False)),
        )

    def del_state(self, key: str) -> None:
        self.execute("DELETE FROM state WHERE key = ?", (key,))
