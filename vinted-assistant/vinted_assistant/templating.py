"""Génération des réponses à partir de templates.yaml."""
from __future__ import annotations

import random
import string

from .clients.base import Item

ORDER = ["disponibilite", "envoi", "taille_etat"]


class MissingInfo(Exception):
    """Une variable du modèle est inconnue (ex : taille vide) : on préfère signaler que deviner."""


def item_variables(item: Item | None, templates: dict, buyer: str = "") -> dict:
    variables = dict(templates.get("variables") or {})
    if item is not None:
        variables.update({
            "titre": item.title, "taille": item.size, "etat": item.status, "marque": item.brand,
            "prix": f"{item.price:.2f}".replace(".", ",") + " €" if item.price else "",
        })
    variables["prenom"] = buyer
    return variables


def _fill(text: str, variables: dict) -> str:
    needed = [f for _, f, _, _ in string.Formatter().parse(text) if f]
    missing = [f for f in needed if not str(variables.get(f) or "").strip()]
    if missing:
        raise MissingInfo(", ".join(missing))
    return text.format(**variables)


def render_reply(categories: list[str], item: Item | None, templates: dict,
                 buyer: str = "", rng: random.Random | None = None) -> str:
    rng = rng or random.Random()
    parts_cfg = templates.get("parts") or {}
    variables = item_variables(item, templates, buyer)
    sentences = []
    for cat in ORDER:
        if cat in categories and parts_cfg.get(cat):
            variants = parts_cfg[cat]
            variants = [variants] if isinstance(variants, str) else variants
            sentences.append(_fill(rng.choice(variants), variables).strip())
    if not sentences:
        raise MissingInfo("aucun modèle pour ces catégories")
    sentences = [sentences[0]] + [s[:1].upper() + s[1:] for s in sentences[1:]]
    greeting = _fill(templates.get("greeting", "Bonjour,"), variables)
    closing = _fill(templates.get("closing", ""), variables)
    return " ".join(x for x in [greeting, " ".join(sentences), closing] if x).strip()
