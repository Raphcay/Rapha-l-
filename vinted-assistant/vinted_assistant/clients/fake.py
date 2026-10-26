"""Client factice : données d'exemple en mémoire, pour le mode --demo et les tests.

Aucune connexion réseau. Les écritures sont seulement mémorisées dans `self.calls`.
"""
from __future__ import annotations

import copy
import json
import time
from pathlib import Path

from .base import Conversation, FeatureUnavailable, Item, Message

DAY = 86400


class FakeClient:
    def __init__(self, data: dict | None = None, fixture: str | Path | None = None):
        if data is None:
            data = json.loads(Path(fixture).read_text(encoding="utf-8")) if fixture else {}
        self.data = copy.deepcopy(data)
        self.user_id = str(self.data.get("user_id", "1000"))
        self.calls: list[tuple] = []
        self._next_id = 9_000_000_000
        now = time.time()
        self.items = [self._item(d, now) for d in self.data.get("my_items", [])]
        self.catalog = {k: [self._item(d, now) for d in v] for k, v in self.data.get("catalog", {}).items()}
        self.states = dict(self.data.get("item_states", {}))
        self.native_offer = set(map(str, self.data.get("native_offer_items", [])))
        self.likers = {str(k): list(map(str, v)) for k, v in self.data.get("likers", {}).items()}

    @staticmethod
    def _item(d: dict, now: float) -> Item:
        d = dict(d)
        days_ago = d.pop("created_days_ago", None)
        if days_ago is not None:
            d["created_ts"] = now - float(days_ago) * DAY
        d["id"] = str(d["id"])
        return Item(**d)

    # ------------------------------------------------------------------ lecture
    def current_user_id(self) -> str:
        return self.user_id

    def list_inbox(self, limit: int) -> list[Conversation]:
        return [self._conv(c, with_messages=False) for c in self.data.get("conversations", [])][:limit]

    def get_conversation(self, conversation_id: str) -> Conversation:
        for c in self.data.get("conversations", []):
            if str(c["id"]) == str(conversation_id):
                return self._conv(c, with_messages=True)
        raise KeyError(conversation_id)

    def _conv(self, c: dict, with_messages: bool) -> Conversation:
        msgs = [Message(id=str(m["id"]), body=m["body"], author_id=str(m["author_id"]),
                        ts=m.get("ts"), is_mine=str(m["author_id"]) == self.user_id)
                for m in c.get("messages", [])]
        return Conversation(
            id=str(c["id"]), other_user=c.get("other_user", ""), other_user_id=str(c.get("other_user_id", "")),
            item_ids=[str(i) for i in c.get("item_ids", [])], unread=bool(c.get("unread", True)),
            last_message_mine=bool(msgs and msgs[-1].is_mine),
            messages=msgs if with_messages else [], url=f"https://www.vinted.fr/inbox/{c['id']}",
        )

    def list_my_items(self) -> list[Item]:
        return [copy.copy(i) for i in self.items]

    def get_item_upload_data(self, item_id: str) -> dict:
        item = self._find(item_id)
        return {"id": item.id, "title": item.title, "description": item.description,
                "price": item.price, "size": item.size, "status": item.status, "brand": item.brand,
                "photos": list(item.photos)}

    def download_photos(self, item: Item, dest_dir: str) -> list[str]:
        Path(dest_dir).mkdir(parents=True, exist_ok=True)
        paths = []
        for n, _url in enumerate(item.photos, 1):
            p = Path(dest_dir) / f"photo_{n:02d}.jpg"
            p.write_bytes(b"demo")
            paths.append(str(p))
        return paths

    def search_catalog(self, keyword: str, page: int, per_page: int, order: str) -> list[Item]:
        items = self.catalog.get(keyword, [])
        start = (page - 1) * per_page
        return [copy.copy(i) for i in items[start:start + per_page]]

    def item_state(self, item_id: str) -> str:
        return self.states.get(str(item_id), "active")

    def list_item_likers(self, item_id: str) -> list[str]:
        if str(item_id) not in self.likers:
            raise FeatureUnavailable("liste des membres intéressés indisponible")
        return self.likers[str(item_id)]

    def _find(self, item_id: str) -> Item:
        for i in self.items:
            if i.id == str(item_id):
                return i
        raise KeyError(item_id)

    # ------------------------------------------------------------------ écriture
    def send_message(self, conversation_id: str, body: str) -> None:
        self.calls.append(("send_message", conversation_id, body))

    def create_item_copy(self, upload_data: dict, photo_paths: list[str]) -> str:
        self._next_id += 1
        new_id = str(self._next_id)
        self.calls.append(("create_item_copy", upload_data.get("id"), new_id, len(photo_paths)))
        src = self._find(upload_data["id"])
        clone = copy.copy(src)
        clone.id, clone.created_ts, clone.favourites, clone.views = new_id, time.time(), 0, 0
        self.items.append(clone)
        return new_id

    def delete_item(self, item_id: str) -> None:
        self.calls.append(("delete_item", item_id))
        self.items = [i for i in self.items if i.id != str(item_id)]

    def hide_item(self, item_id: str) -> None:
        self.calls.append(("hide_item", item_id))
        self._find(item_id).is_hidden = True

    def offer_to_likers(self, item_id: str, price: float) -> int:
        if str(item_id) not in self.native_offer:
            raise FeatureUnavailable("bouton « offre aux membres intéressés » absent")
        self.calls.append(("offer_to_likers", item_id, price))
        return self._find(item_id).favourites

    def send_individual_offer(self, item_id: str, user_id: str, price: float) -> None:
        self.calls.append(("send_individual_offer", item_id, user_id, price))

    def favourite_item(self, item_id: str) -> None:
        self.calls.append(("favourite_item", item_id))

    def read_external_page(self, url: str, script: str):
        from urllib.parse import parse_qs, urlparse

        query = (parse_qs(urlparse(url).query).get("searchkey") or [""])[0]
        self.calls.append(("read_external_page", query))
        return self.data.get("dhgate", {}).get(query, [])

    def close(self) -> None:
        pass
