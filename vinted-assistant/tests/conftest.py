import json
import random
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from vinted_assistant.app import App  # noqa: E402
from vinted_assistant.clients.fake import FakeClient  # noqa: E402
from vinted_assistant.config import load_config, load_templates  # noqa: E402
from vinted_assistant.db import DB  # noqa: E402
from vinted_assistant.notify import Notifier  # noqa: E402
from vinted_assistant.safety import Guard  # noqa: E402


@pytest.fixture
def demo_data():
    return json.loads((ROOT / "fixtures" / "demo.json").read_text(encoding="utf-8"))


@pytest.fixture
def make_app(tmp_path, demo_data):
    def _make(dry_run=True, data=None, overrides=None, seed=1):
        base = {"paths": {k: str(tmp_path / k) for k in ("logs", "backups", "reports", "drafts")},
                "notifications": {"desktop": False, "sound": False}}
        base["paths"]["db"] = ":memory:"
        if overrides:
            from vinted_assistant.config import deep_merge
            base = deep_merge(base, overrides)
        cfg = load_config(ROOT / "config.yaml", base)
        cfg["paths"]["db"] = ":memory:"
        db = DB(":memory:")
        notifier = Notifier(cfg, enabled=False)
        guard = Guard(cfg, db, notifier, dry_run=dry_run, fast=True, rng=random.Random(seed))
        client = FakeClient(data if data is not None else demo_data)
        return App(cfg=cfg, db=db, guard=guard, client=client, dry_run=dry_run, notifier=notifier,
                   templates=load_templates(ROOT / "templates.yaml"), demo=True, rng=random.Random(seed))
    return _make
