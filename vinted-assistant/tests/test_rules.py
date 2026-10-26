"""Tests des règles pures : classement, modèles, prix, créneaux, marques."""
import random
from datetime import date, datetime, timedelta
from pathlib import Path

import pytest

from vinted_assistant.classifier import classify
from vinted_assistant.clients.base import Item
from vinted_assistant.config import load_templates
from vinted_assistant.modules.sourcing import parse_card, strip_brands
from vinted_assistant.pricing import margin, offer_price, suggested_price
from vinted_assistant.slots import Slot, in_slot, parse_slots, spread_times, windows_for_day
from vinted_assistant.templating import MissingInfo, render_reply

TPL = load_templates(Path(__file__).resolve().parents[1] / "templates.yaml")
KW = TPL["keywords"]


@pytest.mark.parametrize("text,category,escalate", [
    ("Bonjour, est-ce toujours dispo ?", "disponibilite", False),
    ("Il est toujours disponible ?", "disponibilite", False),
    ("Vous l'envoyez quand ? En Mondial Relay ?", "envoi", False),
    ("Elle taille grand ? Des défauts ?", "taille_etat", False),
    ("Vous la feriez à 20 € ?", "prix", True),
    ("Dernier prix ?", "prix", True),
    ("30e ça vous va ?", "prix", True),
    ("Je paie par virement, donnez-moi votre IBAN", "paiement_hors_vinted", True),
    ("Contacte-moi sur WhatsApp au 06 12 34 56 78", "paiement_hors_vinted", True),
    ("Appelez-moi au 06 12 34 56 78", "suspect", True),
    ("Vérifiez votre compte ici https://bit.ly/xyz", "suspect", True),
    ("Je n'ai jamais reçu mon colis, remboursez-moi", "litige", True),
    ("Super, merci beaucoup !", "autre", True),
    ("Dispo ? et vous feriez un prix ?", "prix", True),
])
def test_classify(text, category, escalate):
    c = classify(text, KW)
    assert c.category == category
    assert c.escalate is escalate


def test_no_false_positive_on_word_parts():
    # « rib » ne doit pas être reconnu dans « distribution », ni « mail » dans « maille »
    assert classify("La maille est-elle épaisse ? Taille ?", KW).category == "taille_etat"
    assert "paiement_hors_vinted" not in classify("distribution rapide ?", KW).categories


ITEM = Item(id="1", title="Pull", price=20.0, size="M", status="Très bon état")


def test_reply_matches_requested_tone():
    reply = render_reply(["disponibilite"], ITEM, TPL, rng=random.Random(0))
    assert reply == ("Bonjour, oui l'article est toujours disponible ☺️. "
                     "Je reste à votre disposition pour tout autre renseignement ou question !")


def test_reply_combines_parts_and_inserts_item_info():
    reply = render_reply(["disponibilite", "taille_etat", "envoi"], ITEM, TPL, rng=random.Random(0))
    assert "taille M" in reply and "Très bon état" in reply and "sous 2 jours" in reply
    assert reply.index("disponible") < reply.index("expédie") < reply.index("taille M")


def test_reply_refuses_to_guess_missing_info():
    with pytest.raises(MissingInfo):
        render_reply(["taille_etat"], Item(id="2", title="Jean", price=10, size=""), TPL)


OFFERS = {"discount_pct": [5, 10], "default_floor_pct": 90, "floors": {}}


def test_offer_never_below_floor():
    for seed in range(200):
        price, floor, _ = offer_price(Item(id="1", title="x", price=37.0), OFFERS, random.Random(seed))
        assert floor <= price < 37.0


def test_offer_explicit_floor_wins():
    cfg = {**OFFERS, "floors": {"1": 19.5}}
    price, floor, _ = offer_price(Item(id="1", title="x", price=20.0), cfg, random.Random(0))
    assert floor == 19.5 and price == 19.5


def test_offer_impossible_when_floor_equals_price():
    cfg = {**OFFERS, "floors": {"1": 20.0}}
    price, _, why = offer_price(Item(id="1", title="x", price=20.0), cfg)
    assert price is None and "plancher" in why


def test_margin():
    s = {"seller_fee_pct": 0, "seller_fee_fixed_eur": 0, "packaging_eur": 0.5,
         "buyer_protection_pct": 5, "buyer_protection_fixed_eur": 0.7}
    m = margin(30.0, 10.0, 4.0, s)
    assert m["margin"] == 15.5
    assert m["buyer_pays"] == 32.2


def test_suggested_price():
    assert suggested_price([20, 22, 30], 5) == 20.0
    assert suggested_price([], 5) is None


def test_strip_brands():
    q, found = strip_brands("Sneakers Nike Air Jordan blanches")
    assert "nike" not in q and "jordan" not in q and "sneakers" in q
    assert set(found) >= {"nike", "air jordan"}


def test_parse_dhgate_card():
    q = parse_card({"url": "u", "title": "t", "text": "Jacket US $20.00 Free Shipping 312 sold 4.6 (120) 12-20 days"}, 0.9)
    assert q["price_eur"] == 18.0 and q["shipping_eur"] == 0 and q["orders"] == 312
    assert q["rating"] == 4.6 and q["delivery_days"] == "12-20"


def test_slots_and_spread():
    slots = parse_slots([{"days": ["mon", "sun"], "start": "18:00", "end": "21:00"}])
    assert slots == [Slot(0, 1080, 1260), Slot(6, 1080, 1260)]
    monday = date(2026, 10, 26)
    assert in_slot(slots, datetime(2026, 10, 26, 19, 0))
    assert not in_slot(slots, datetime(2026, 10, 27, 19, 0))
    times = spread_times(windows_for_day(slots, monday), 5, 30, random.Random(3))
    assert len(times) == 5
    assert all(datetime(2026, 10, 26, 18) <= t < datetime(2026, 10, 26, 21) for t in times)
    assert all(b - a >= timedelta(minutes=30) for a, b in zip(times, times[1:]))
    # jamais plus que ce que la fenêtre permet avec l'écart minimal
    assert len(spread_times(windows_for_day(slots, monday), 50, 30)) <= 6
