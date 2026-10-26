"""Module 1 — réponses aux acheteurs.

Répond seul uniquement aux questions simples (disponibilité, envoi, taille/état).
Prix, litiges, paiement hors Vinted, messages suspects ou non reconnus : signalés, jamais traités.
"""
from __future__ import annotations

import logging
import time

from ..app import App
from ..classifier import Classification, classify
from ..clients.base import Conversation, Message
from ..safety import LimitReached
from ..templating import MissingInfo, render_reply

log = logging.getLogger("vinted")
MODULE = "replies"


def _pending_buyer_messages(conv: Conversation) -> list[Message]:
    pending: list[Message] = []
    for m in reversed(conv.messages):
        if m.is_mine:
            break
        pending.insert(0, m)
    return pending


def _handled(app: App, message_id: str) -> bool:
    return app.db.one("SELECT 1 FROM handled_messages WHERE message_id = ? AND dry_run = ?",
                      (message_id, int(app.dry_run))) is not None


def _mark(app: App, message_id: str, conv_id: str, outcome: str, category: str) -> None:
    app.db.execute(
        "INSERT OR IGNORE INTO handled_messages (message_id, dry_run, conversation_id, outcome, category, ts)"
        " VALUES (?, ?, ?, ?, ?, ?)", (message_id, int(app.dry_run), conv_id, outcome, category, time.time()))


def flag(app: App, conv: Conversation, msg: Message, category: str, reason: str) -> None:
    cur = app.db.execute(
        "INSERT OR IGNORE INTO flags (ts, conversation_id, message_id, category, reason, excerpt, url, dry_run)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (time.time(), conv.id, msg.id, category, reason, msg.body[:300], conv.url, int(app.dry_run)))
    _mark(app, msg.id, conv.id, "flagged", category)
    app.note(MODULE, "flag", conv.id, {"category": category, "reason": reason, "excerpt": msg.body[:120]},
             status="flagged")
    if cur.rowcount:
        log.info("🚩 À traiter toi-même — %s (%s) : « %s »", conv.other_user or conv.id, reason, msg.body[:80])
        app.notifier.alert("Message à traiter", f"{conv.other_user} — {reason} : {msg.body[:100]}")


def run(app: App) -> dict:
    cfg = app.cfg["replies"]
    client = app.client
    summary = {"lues": 0, "réponses": 0, "signalées": 0, "ignorées": 0}
    items_cache: dict | None = None

    app.guard.ensure_running()
    log.info("📨 Réponses — mode %s", app.mode)
    for conv_summary in client.list_inbox(int(cfg["max_conversations_per_run"])):
        if conv_summary.last_message_mine and not conv_summary.unread:
            continue
        conv = client.get_conversation(conv_summary.id)
        conv.other_user = conv.other_user or conv_summary.other_user
        summary["lues"] += 1
        pending = _pending_buyer_messages(conv)
        if not pending or _handled(app, pending[-1].id):
            summary["ignorées"] += 1
            continue
        last = pending[-1]
        text = "\n".join(m.body for m in pending)

        if items_cache is None:
            items_cache = {i.id: i for i in client.list_my_items()}
        mine = [items_cache[i] for i in conv.item_ids if i in items_cache]
        if conv.item_ids and not mine:
            # Conversation où je suis l'acheteur, ou annonce déjà vendue/supprimée.
            _mark(app, last.id, conv.id, "skipped", "hors annonces")
            summary["ignorées"] += 1
            continue

        cls: Classification = classify(text, app.templates.get("keywords") or {}, cfg["auto_categories"])
        if not cls.escalate and len(conv.item_ids) > 1:
            cls = Classification("lot", cls.categories, True, "plusieurs articles (lot)")
        item = mine[0] if mine else None
        if not cls.escalate and item is None:
            cls = Classification(cls.category, cls.categories, True, "annonce inconnue")
        if not cls.escalate and (item.is_closed or item.is_reserved):
            cls = Classification(cls.category, cls.categories, True, "article vendu ou réservé")
        if cls.escalate:
            flag(app, conv, last, cls.category, cls.reason)
            summary["signalées"] += 1
            continue

        try:
            reply = render_reply(cls.categories, item, app.templates, conv.other_user, app.rng)
        except MissingInfo as exc:
            flag(app, conv, last, cls.category, f"info manquante dans l'annonce : {exc}")
            summary["signalées"] += 1
            continue

        try:
            app.perform(
                MODULE, "replies", "send_message", conv.id,
                {"category": cls.category, "question": text[:200], "reply": reply, "item_id": item.id},
                lambda: client.send_message(conv.id, reply),
                f"Réponse à {conv.other_user} ({cls.category}) : « {reply} »",
            )
        except LimitReached as exc:
            log.warning("⛔ %s", exc)
            break
        _mark(app, last.id, conv.id, "replied", cls.category)
        summary["réponses"] += 1

    log.info("📨 Bilan réponses : %s", summary)
    return summary
