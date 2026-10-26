#!/usr/bin/env python3
"""Vinted Assistant — point d'entrée.

    python main.py login                  # se connecter soi-même à Vinted (une fois)
    python main.py replies                # réponses aux acheteurs
    python main.py republish [--now]      # republication aux meilleures heures
    python main.py offers                 # offres aux membres qui ont liké
    python main.py scout [--favourite]    # veille best-sellers
    python main.py sourcing               # shortlist DHgate (aucune commande)
    python main.py new-listing [--fill]   # rédiger une annonce pour un article reçu
    python main.py status                 # résumé
    python main.py run [--plan|--once]    # planification automatique de la journée
    python main.py flags [--close ID|all] # messages signalés
    python main.py resume                 # relancer après un arrêt d'urgence

Simulation (dry-run) par défaut. Ajoute --live pour agir réellement. --demo : données d'exemple, sans navigateur.
"""
from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

from vinted_assistant.app import App
from vinted_assistant.config import load_config, load_templates
from vinted_assistant.db import DB
from vinted_assistant.journal import setup_logging
from vinted_assistant.notify import Notifier
from vinted_assistant.safety import Guard, LimitReached, SafetyStop

HERE = Path(__file__).resolve().parent
COMMANDS_NEEDING_BROWSER = {"login", "replies", "republish", "offers", "scout", "sourcing", "run"}


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="main.py", description="Assistant local pour ton compte Vinted.")
    p.add_argument("--config", default=str(HERE / "config.yaml"))
    p.add_argument("--templates", default=str(HERE / "templates.yaml"))
    p.add_argument("--live", action="store_true", help="actions réelles (sinon simulation)")
    p.add_argument("--yes", action="store_true", help="ne pas demander de confirmation en mode réel")
    p.add_argument("--demo", action="store_true", help="données d'exemple, aucun accès à Vinted")
    p.add_argument("-v", "--verbose", action="store_true")
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("login", help="ouvrir le navigateur pour te connecter toi-même")
    sub.add_parser("replies", help="répondre aux messages simples, signaler les autres")
    r = sub.add_parser("republish", help="republier les annonces anciennes")
    r.add_argument("--now", action="store_true", help="ignorer le créneau horaire")
    r.add_argument("--max", type=int, default=None)
    r.add_argument("--item", default=None, help="ne traiter que cette annonce (id)")
    o = sub.add_parser("offers", help="offres aux membres qui ont ajouté en favori")
    o.add_argument("--max", type=int, default=None)
    s = sub.add_parser("scout", help="veille best-sellers")
    s.add_argument("--favourite", action="store_true", help="mettre en favori la liste approuvée")
    sub.add_parser("sourcing", help="shortlist DHgate classée par marge")
    n = sub.add_parser("new-listing", help="rédiger une annonce pour un article reçu")
    n.add_argument("--fill", action="store_true", help="pré-remplir le formulaire Vinted (sans publier)")
    sub.add_parser("status", help="résumé")
    run = sub.add_parser("run", help="planifier toute la journée")
    run.add_argument("--plan", action="store_true", help="afficher le plan sans rien exécuter")
    run.add_argument("--once", action="store_true", help="exécuter chaque tâche une fois, tout de suite")
    f = sub.add_parser("flags", help="messages signalés à traiter")
    f.add_argument("--close", default=None, help="id du signalement à clore, ou « all »")
    sub.add_parser("resume", help="lever l'arrêt d'urgence")
    return p.parse_args(argv)


def build_app(args: argparse.Namespace) -> App:
    overrides = {"paths": {"db": "./data/demo.sqlite", "reports": "./reports/demo",
                           "backups": "./backups/demo", "drafts": "./data/demo-drafts"}} if args.demo else None
    cfg = load_config(args.config, overrides)
    setup_logging(cfg["paths"]["logs"], args.verbose)
    dry_run = not args.live and bool(cfg["dry_run"])
    if args.demo:
        dry_run = True
    db = DB(cfg["paths"]["db"])
    notifier = Notifier(cfg, enabled=not args.demo)
    guard = Guard(cfg, db, notifier, dry_run=dry_run, fast=args.demo)
    templates = load_templates(args.templates)
    if args.demo:
        from vinted_assistant.clients.fake import FakeClient

        client = FakeClient(fixture=HERE / "fixtures" / "demo.json")
    elif args.command in COMMANDS_NEEDING_BROWSER or getattr(args, "fill", False):
        from vinted_assistant.clients.vinted_web import VintedWebClient

        client = VintedWebClient(cfg, guard)
    else:
        client = None
    return App(cfg=cfg, db=db, guard=guard, client=client, dry_run=dry_run, notifier=notifier,
               templates=templates, demo=args.demo, rng=random.Random())


def confirm_live(args: argparse.Namespace, app: App) -> bool:
    if app.dry_run or args.yes or args.command in ("status", "flags", "resume", "login", "new-listing"):
        return True
    print("⚠️  MODE RÉEL : les actions seront réellement effectuées sur ton compte Vinted.")
    return input("   Tape OUI pour continuer : ").strip() == "OUI"


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    app = build_app(args)
    if not confirm_live(args, app):
        print("Annulé.")
        return 1
    cmd = args.command
    try:
        if cmd == "resume":
            halt = app.db.get_state("halt")
            app.db.del_state("halt")
            app.db.record_action("safety", "resume", None, {"was": halt}, dry_run=app.dry_run, status="done")
            print("✅ Arrêt levé." if halt else "Rien à relancer : l'outil n'était pas arrêté.")
            return 0
        if cmd == "status":
            from vinted_assistant.modules import status

            status.run(app)
            return 0
        if cmd == "flags":
            return show_flags(app, args.close)
        if cmd == "login":
            uid = app.client.wait_for_manual_login()
            print(f"✅ Connecté (membre {uid}). La session est conservée dans le profil du navigateur."
                  if uid else "⚠️  Connexion non détectée. Réessaie, ou renseigne vinted.user_id dans config.yaml.")
            return 0

        app.guard.ensure_running()
        if cmd == "replies":
            from vinted_assistant.modules import replies

            replies.run(app)
        elif cmd == "republish":
            from vinted_assistant.modules import republish

            republish.run(app, now=args.now, max_n=args.max, item_id=args.item)
        elif cmd == "offers":
            from vinted_assistant.modules import offers

            offers.run(app, max_n=args.max)
        elif cmd == "scout":
            from vinted_assistant.modules import scout

            scout.run(app, favourite=args.favourite)
        elif cmd == "sourcing":
            from vinted_assistant.modules import sourcing

            sourcing.run(app)
        elif cmd == "new-listing":
            from vinted_assistant.modules import new_listing

            new_listing.run(app, fill=args.fill)
        elif cmd == "run":
            from vinted_assistant.modules import runner

            runner.run(app, plan_only=args.plan, once=args.once or args.demo)
        return 0
    except SafetyStop as exc:
        print(f"\n⛔ ARRÊT D'URGENCE : {exc}")
        return 2
    except LimitReached as exc:
        print(f"\n⛔ {exc}")
        return 3
    except KeyboardInterrupt:
        print("\nInterrompu.")
        return 130
    finally:
        if app.client is not None and hasattr(app.client, "close"):
            app.client.close()


def show_flags(app: App, close: str | None) -> int:
    if close:
        if close == "all":
            app.db.execute("UPDATE flags SET status = 'closed' WHERE status = 'open'")
        else:
            app.db.execute("UPDATE flags SET status = 'closed' WHERE id = ?", (int(close),))
        print("✅ Signalement(s) clos.")
        return 0
    rows = app.db.query("SELECT * FROM flags WHERE status = 'open' ORDER BY ts")
    if not rows:
        print("Aucun message en attente 🎉")
    for f in rows:
        sim = " (simulation)" if f["dry_run"] else ""
        print(f"#{f['id']}  [{f['category']}] {f['reason']}{sim}\n     « {f['excerpt']} »\n     {f['url'] or ''}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
