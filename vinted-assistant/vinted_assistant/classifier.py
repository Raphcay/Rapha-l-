"""Classement des messages acheteurs par règles de mots-clés."""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .safety import normalize

# Ordre = priorité. Les quatre premières catégories ne reçoivent JAMAIS de réponse automatique.
PRIORITY = ["paiement_hors_vinted", "suspect", "litige", "prix", "envoi", "taille_etat", "disponibilite"]
ALWAYS_ESCALATE = {"paiement_hors_vinted", "suspect", "litige", "prix", "autre"}

SUSPECT_REGEXES = {
    "lien externe": r"https?://|www\.|\b[\w-]+\.(com|fr|net|org|ru|link|ly|xyz)\b",
    "numéro de téléphone": r"(?:\+33|0033|\b0)\s*[1-9](?:[\s.-]*\d{2}){4}\b",
    "adresse e-mail": r"[\w.+-]+@[\w-]+\.[\w.]+",
}
PRICE_REGEX = r"\b\d+(?:[.,]\d+)?\s*(?:€|eur\b|euros?\b|e\b)"


@dataclass
class Classification:
    category: str
    categories: list[str] = field(default_factory=list)
    escalate: bool = False
    reason: str = ""


def _match(text: str, keyword: str) -> bool:
    kw = normalize(keyword)
    return re.search(r"(?<![\w])" + re.escape(kw), text) is not None


def classify(text: str, keywords: dict[str, list[str]],
             auto_categories: list[str] | None = None) -> Classification:
    auto = set(auto_categories or ["disponibilite", "envoi", "taille_etat"])
    norm = normalize(text)
    found: dict[str, str] = {}

    for cat in PRIORITY:
        for kw in keywords.get(cat, []):
            if _match(norm, kw):
                found.setdefault(cat, kw)
                break
    for label, rx in SUSPECT_REGEXES.items():
        if re.search(rx, text, re.I):
            found.setdefault("suspect", label)
    if re.search(PRICE_REGEX, norm):
        found.setdefault("prix", "montant proposé")

    if not found:
        return Classification("autre", ["autre"], True, "aucune règle ne correspond")

    cats = [c for c in PRIORITY if c in found]
    primary = cats[0]
    blocking = [c for c in cats if c in ALWAYS_ESCALATE or c not in auto]
    if blocking:
        c = blocking[0]
        return Classification(c, cats, True, f"{c} (« {found[c]} »)")
    return Classification(primary, cats, False, ", ".join(f"{c}: {found[c]}" for c in cats))
