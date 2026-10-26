"""Aide à la rédaction d'une annonce pour un article que tu as EN MAIN, avec TES photos.

Génère titre, description et prix conseillé (médiane des prix observés par la veille),
enregistre un brouillon, et peut pré-remplir le formulaire Vinted (--fill) :
la publication finale reste un clic de ta part.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from pathlib import Path

from ..app import App
from ..pricing import suggested_price
from ..safety import normalize
from .sourcing import KNOWN_BRANDS

log = logging.getLogger("vinted")
CONDITIONS = ["Neuf avec étiquette", "Neuf sans étiquette", "Très bon état", "Bon état", "Satisfaisant"]
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


def find_photos(folder: str) -> list[str]:
    p = Path(folder).expanduser()
    if not p.is_dir():
        return []
    return [str(f) for f in sorted(p.iterdir()) if f.suffix.lower() in PHOTO_EXT]


def market_prices(app: App, product: str) -> list[float]:
    words = [w for w in re.findall(r"\w+", normalize(product)) if len(w) > 2]
    if not words:
        return []
    rows = app.db.query("SELECT title, keyword, price FROM scout_snapshots WHERE day >= date('now', '-30 day')")
    out = []
    for r in rows:
        hay = normalize(f"{r['title']} {r['keyword']}")
        if all(w in hay for w in words) and r["price"]:
            out.append(float(r["price"]))
    return out


def build_draft(app: App, product: str, size: str, condition: str, photos: list[str],
                brand: str = "", color: str = "", details: str = "") -> dict:
    cfg = app.cfg["new_listing"]
    product = product.strip()
    head = " ".join(x for x in [product[:1].upper() + product[1:], brand.strip(), color.strip()] if x)
    title = f"{head} – taille {size}" if size else head
    lines = [f"{head}{', taille ' + size if size else ''}.", f"État : {condition.lower()}."]
    if details.strip():
        lines.append(details.strip())
    lines += ["", "Photos non retouchées, de l'article réel.",
              f"📦 Envoi soigné {cfg['shipping_delay']}.",
              "N'hésitez pas à me poser vos questions ☺️"]
    prices = market_prices(app, product)
    price = suggested_price(prices, float(cfg["price_discount_vs_median_pct"]))
    return {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "title": title[:100], "description": "\n".join(lines), "suggested_price": price,
        "market": {"observations": len(prices), "median": sorted(prices)[len(prices) // 2] if prices else None},
        "size": size, "condition": condition, "brand": brand, "color": color, "photos": photos,
    }


def save_draft(app: App, draft: dict) -> Path:
    folder = Path(app.cfg["paths"]["drafts"])
    folder.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", normalize(draft["title"]))[:50].strip("-")
    path = folder / f"{datetime.now():%Y%m%d-%H%M}_{slug}.json"
    path.write_text(json.dumps(draft, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def _ask(prompt: str, default: str = "") -> str:
    value = input(f"{prompt}{f' [{default}]' if default else ''} : ").strip()
    return value or default


def run(app: App, fill: bool = False, answers: dict | None = None) -> dict:
    a = answers or {}
    print("\n📝 Nouvelle annonce — uniquement pour un article que tu as reçu et photographié toi-même.")
    product = a.get("product") or _ask("Article (ex : veste de ski femme)")
    brand = a.get("brand", None)
    brand = _ask("Marque (vide si sans marque)") if brand is None else brand
    if brand and any(normalize(brand) == b for b in KNOWN_BRANDS):
        print("⚠️  Marque connue : ne publie que si tu es certain(e) de l'authenticité (facture, étiquettes).")
    size = a.get("size") or _ask("Taille", "M")
    print("   États : " + " | ".join(f"{n}. {c}" for n, c in enumerate(CONDITIONS, 1)))
    cond = a.get("condition") or _ask("État (numéro)", "1")
    condition = CONDITIONS[int(cond) - 1] if str(cond).isdigit() and 1 <= int(cond) <= 5 else str(cond)
    color = a.get("color", None)
    color = _ask("Couleur (optionnel)") if color is None else color
    details = a.get("details", None)
    details = _ask("Détails (matière, mesures… optionnel)") if details is None else details
    folder = a.get("photos") or _ask("Dossier de TES photos")
    photos = find_photos(folder)
    if not photos:
        print("❌ Aucune photo trouvée dans ce dossier : une annonce doit montrer l'article réel.")
        return {"draft": None}

    draft = build_draft(app, product, size, condition, photos, brand, color, details)
    path = save_draft(app, draft)
    price = draft["suggested_price"]
    print(f"\nTitre       : {draft['title']}")
    print(f"Prix conseillé : {f'{price:.2f} €' if price else 'pas assez de données (lance scout)'}"
          f"  ({draft['market']['observations']} annonces comparables)")
    print("Description :\n" + "\n".join("   " + line for line in draft["description"].splitlines()))
    print(f"\n💾 Brouillon : {path} ({len(photos)} photos)")
    app.note("new_listing", "draft", str(path), {"title": draft["title"], "price": price}, status="done")

    if fill:
        if app.demo:
            print("(démo : pas de navigateur, pré-remplissage ignoré)")
        else:
            app.client.prefill_new_listing(draft)
            print("🖊  Formulaire pré-rempli dans le navigateur. Complète catégorie/marque/taille puis publie TOI-MÊME.")
            input("   Appuie sur Entrée pour fermer le navigateur… ")
    return {"draft": str(path)}
