"""Tests des modules avec le client factice (aucun accès réseau)."""
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import pytest

from vinted_assistant.clients.vinted_web import VintedWebClient
from vinted_assistant.modules import offers, replies, republish, runner, scout, sourcing
from vinted_assistant.safety import LimitReached, SafetyStop
from vinted_assistant.slots import best_slots


# ------------------------------------------------------------------ garde-fous
def test_dry_run_sends_nothing(make_app):
    app = make_app(dry_run=True)
    replies.run(app)
    offers.run(app)
    republish.run(app, now=True)
    assert [c for c in app.client.calls if c[0] != "read_external_page"] == []


def test_daily_cap(make_app):
    app = make_app(dry_run=False, overrides={"limits": {"replies": 1}})
    s = replies.run(app)
    assert s["réponses"] == 1
    assert sum(c[0] == "send_message" for c in app.client.calls) == 1
    with pytest.raises(LimitReached):
        app.guard.require("replies")


def test_halt_blocks_everything_until_resume(make_app):
    app = make_app(dry_run=False)
    with pytest.raises(SafetyStop):
        app.guard.halt("Captcha détecté")
    with pytest.raises(SafetyStop):
        replies.run(app)
    assert app.client.calls == []
    app.db.del_state("halt")
    replies.run(app)
    assert app.client.calls


@pytest.mark.parametrize("status", [429, 403])
def test_http_429_403_triggers_stop(make_app, status):
    app = make_app(dry_run=False)
    web = VintedWebClient(app.cfg, app.guard)
    with pytest.raises(SafetyStop):
        web._handle({"status": status, "text": ""}, "inbox", False)
    assert app.db.get_state("halt")["reason"].startswith(f"Réponse HTTP {status}")


def test_warning_text_detection(make_app):
    g = make_app().guard
    assert g.check_page_text("Nous avons détecté une activité inhabituelle sur ton compte")
    assert g.check_page_text("Ton compte a été suspendu")
    assert g.check_page_text("Pull oversize en très bon état, envoi rapide") is None


def test_human_delays_are_in_range(make_app):
    app = make_app(overrides={"human": {"long_pause_every": [1000, 1000]}})
    delays = [app.guard.pace() for _ in range(50)]
    assert all(3 <= d <= 12 for d in delays)


# ------------------------------------------------------------------ 1. réponses
def test_replies_live(make_app):
    app = make_app(dry_run=False)
    s = replies.run(app)
    sent = {c[1]: c[2] for c in app.client.calls if c[0] == "send_message"}
    assert set(sent) == {"7001", "7002", "7003"}            # dispo, envoi, taille/état
    for conv in ("7004", "7005", "7006", "7007", "7008", "7010"):  # prix, paypal, réservé, info manquante, lien, litige
        assert conv not in sent
    assert s["signalées"] == 6
    cats = {r["category"] for r in app.db.query("SELECT category FROM flags")}
    assert {"prix", "paiement_hors_vinted", "suspect", "litige"} <= cats
    # deuxième passage : rien n'est renvoyé ni re-signalé
    replies.run(app)
    assert sum(c[0] == "send_message" for c in app.client.calls) == 3
    assert app.db.one("SELECT COUNT(*) FROM flags")[0] == 6


def test_replies_ignore_conversations_where_i_am_buyer(make_app, demo_data):
    demo_data["conversations"] = [{"id": 1, "other_user": "x", "other_user_id": 5, "item_ids": [123],
                                   "messages": [{"id": "a", "author_id": 5, "body": "Toujours dispo ?"}]}]
    app = make_app(dry_run=False, data=demo_data)
    replies.run(app)
    assert app.client.calls == []


# ------------------------------------------------------------------ 2. republication
def test_republish_eligibility(make_app):
    app = make_app()
    ids = [i.id for i, _ in republish.eligible(app, app.client.list_my_items())]
    assert ids == ["4100000001", "4100000004", "4100000002"]   # > 14 j, réservée exclue, ordre ancienneté


def test_republish_live_backup_then_create_then_delete(make_app):
    app = make_app(dry_run=False)
    republish.run(app, now=True, max_n=1)
    names = [c[0] for c in app.client.calls]
    assert names == ["create_item_copy", "delete_item"]
    backup = Path(app.db.one("SELECT backup_path FROM republications")[0])
    assert (backup / "annonce.json").exists()
    assert len(list((backup / "photos").iterdir())) == 3


def test_republish_keeps_old_listing_if_creation_fails(make_app):
    app = make_app(dry_run=False)

    def boom(*a, **k):
        raise RuntimeError("upload refusé")
    app.client.create_item_copy = boom
    republish.run(app, now=True, max_n=1)
    assert not any(c[0] in ("delete_item", "hide_item") for c in app.client.calls)


def test_republish_hide_mode(make_app):
    app = make_app(dry_run=False, overrides={"republish": {"old_listing_action": "hide"}})
    republish.run(app, now=True, max_n=1)
    assert [c[0] for c in app.client.calls] == ["create_item_copy", "hide_item"]


def test_slots_from_my_stats(make_app):
    app = make_app()
    base = datetime(2026, 9, 1, 0, 0).timestamp()
    for day in range(20):
        for hour in range(24):
            ts = base + day * 86400 + hour * 3600
            views = day * 100 + sum(30 if h == 20 else 1 for h in range(hour))  # gros pic à 20h
            app.db.execute("INSERT INTO my_item_snapshots VALUES (?, '1', ?, 0, 10)", (ts, views))
    slots, source = best_slots(app.db, app.cfg)
    assert source == "tes statistiques"
    assert any(s.start <= 20 * 60 < s.end for s in slots)


# ------------------------------------------------------------------ 3. offres
def test_offers_native_floor_and_period(make_app):
    app = make_app(dry_run=False, overrides={"offers": {"floors": {"4100000001": 44.0}}})
    offers.run(app)
    native = [c for c in app.client.calls if c[0] == "offer_to_likers"]
    assert native == [("offer_to_likers", "4100000001", 44.0)]
    # pas de nouvelle offre dans les 7 jours
    app.client.calls.clear()
    offers.run(app)
    assert not any(c[0] == "offer_to_likers" for c in app.client.calls)


def test_offers_individual_fallback(make_app):
    app = make_app(dry_run=False)
    offers.run(app)
    indiv = [c for c in app.client.calls if c[0] == "send_individual_offer"]
    assert {c[2] for c in indiv} == {"2002", "2010"}           # likers de l'annonce 4100000002
    assert all(c[3] >= 16.2 for c in indiv)                     # plancher 90 % de 18 €


def test_offers_skip_reserved(make_app):
    app = make_app(dry_run=False)
    offers.run(app)
    assert not any(c[1] == "4100000005" for c in app.client.calls if len(c) > 1)


# ------------------------------------------------------------------ 4. veille
def test_scout_detects_sales_between_snapshots(make_app, demo_data):
    app = make_app(dry_run=True, overrides={"scout": {"keywords": ["veste de ski"]}})
    d1, d2 = "2026-10-25", "2026-10-26"
    scout.run(app, day=d1)
    sold_ids = [i["id"] for i in demo_data["catalog"]["veste de ski"][:3]]
    app.client.catalog["veste de ski"] = [i for i in app.client.catalog["veste de ski"] if int(i.id) not in sold_ids]
    app.client.states = {str(sold_ids[0]): "sold", str(sold_ids[1]): "gone"}
    s = scout.run(app, day=d2)
    assert s["nouvelles_disparitions"] == 3
    statuses = {r["item_id"]: r["status"] for r in app.db.query("SELECT * FROM scout_disappeared")}
    assert statuses[str(sold_ids[0])] == "sold" and statuses[str(sold_ids[1])] == "gone"
    rows = scout.ranking(app, d2)
    assert sum(r["ventes_verifiees"] for r in rows) == 1
    assert Path(app.cfg["paths"]["reports"], f"classement_{d2}.html").exists()


def test_scout_favourites_only_approved_and_capped(make_app):
    approved = [f"https://www.vinted.fr/items/{n}-x" for n in range(100, 115)]
    app = make_app(dry_run=False, overrides={"scout": {"keywords": [], "favourite_approved": approved}})
    n = scout.favourite_approved(app)
    assert n == 10                                              # plafond likes = 10/jour
    assert [c[1] for c in app.client.calls] == [str(x) for x in range(100, 110)]


# ------------------------------------------------------------------ 5. sourcing
def test_sourcing_shortlist_excludes_brands_and_orders_nothing(make_app):
    app = make_app(dry_run=False)
    scout.run(app)
    s = sourcing.run(app)
    assert s["shortlist"] >= 1
    assert all(c[0] == "read_external_page" for c in app.client.calls)   # lecture seule
    assert all("nike" not in c[1] for c in app.client.calls)
    csv = Path(app.cfg["paths"]["reports"], f"sourcing_{date.today()}.csv").read_text(encoding="utf-8-sig")
    assert "marge" in csv


# ------------------------------------------------------------------ run
def test_run_plan_respects_hours_and_slots(make_app):
    app = make_app()
    day = date(2026, 10, 26)
    plan = runner.plan_day(app, day, datetime(2026, 10, 26, 6, 0))
    assert plan
    assert all(datetime(2026, 10, 26, 7, 30) <= t < datetime(2026, 10, 26, 22, 0) for t, _ in plan)
    rep = [t for t, n in plan if n == "republish"]
    assert all((7 * 60 + 30 <= t.hour * 60 + t.minute < 9 * 60) or (18 <= t.hour < 21) for t in rep)
    assert all(b - a >= timedelta(minutes=2) for (a, _), (b, _) in zip(plan, plan[1:]))
