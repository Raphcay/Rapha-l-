"""Modèles de données communs et interface des clients (réel ou factice)."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


class FeatureUnavailable(Exception):
    """La fonction demandée n'existe pas (ou plus) sur Vinted pour cette annonce."""


@dataclass
class Item:
    id: str
    title: str
    price: float
    size: str = ""
    status: str = ""            # état : « Très bon état »…
    brand: str = ""
    favourites: int = 0
    views: int = 0
    created_ts: float | None = None
    url: str = ""
    photos: list[str] = field(default_factory=list)
    description: str = ""
    is_closed: bool = False     # vendue
    is_reserved: bool = False
    is_hidden: bool = False
    raw: dict[str, Any] = field(default_factory=dict, repr=False)


@dataclass
class Message:
    id: str
    body: str
    author_id: str
    ts: float | None = None
    is_mine: bool = False


@dataclass
class Conversation:
    id: str
    other_user: str = ""
    other_user_id: str = ""
    item_ids: list[str] = field(default_factory=list)
    unread: bool = False
    last_message_mine: bool = False
    messages: list[Message] = field(default_factory=list)
    url: str = ""


class VintedClient(Protocol):
    # lecture
    def current_user_id(self) -> str: ...
    def list_inbox(self, limit: int) -> list[Conversation]: ...
    def get_conversation(self, conversation_id: str) -> Conversation: ...
    def list_my_items(self) -> list[Item]: ...
    def get_item_upload_data(self, item_id: str) -> dict: ...
    def download_photos(self, item: Item, dest_dir: str) -> list[str]: ...
    def search_catalog(self, keyword: str, page: int, per_page: int, order: str) -> list[Item]: ...
    def item_state(self, item_id: str) -> str: ...  # active | sold | gone
    def list_item_likers(self, item_id: str) -> list[str]: ...
    # écriture
    def send_message(self, conversation_id: str, body: str) -> None: ...
    def create_item_copy(self, upload_data: dict, photo_paths: list[str]) -> str: ...
    def delete_item(self, item_id: str) -> None: ...
    def hide_item(self, item_id: str) -> None: ...
    def offer_to_likers(self, item_id: str, price: float) -> int: ...
    def send_individual_offer(self, item_id: str, user_id: str, price: float) -> None: ...
    def favourite_item(self, item_id: str) -> None: ...
    def close(self) -> None: ...
