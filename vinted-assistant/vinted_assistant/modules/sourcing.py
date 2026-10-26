"""Module 5 — aide au sourcing DHgate (lecture seule).

Ne passe AUCUNE commande et ne publie AUCUNE annonce : produit une shortlist classée par
marge estimée, que tu commandes toi-même si tu le souhaites.

Les marques sont retirées des recherches DHgate : un article « de marque » à bas prix sur
ce type de site est très souvent une contrefaçon, dont la revente est illégale et interdite
sur Vinted. Seuls des produits génériques (sans marque) doivent être revendus.
"""
from __future__ import annotations

import csv
import html
import logging
import re
from datetime import date
from pathlib import Path
from urllib.parse import parse_qs, quote_plus, urlparse

from ..app import App
from ..pricing import margin
from ..safety import LimitReached, normalize
from . import scout

log = logging.getLogger("vinted")
MODULE = "sourcing"

KNOWN_BRANDS = [
    "nike", "adidas", "jordan", "air jordan", "yeezy", "new balance", "asics", "puma", "reebok", "converse",
    "vans", "salomon", "the north face", "north face", "moncler", "canada goose", "arc'teryx", "arcteryx",
    "patagonia", "columbia", "stone island", "cp company", "carhartt", "ralph lauren", "polo ralph lauren",
    "lacoste", "tommy hilfiger", "hugo boss", "boss", "levi's", "levis", "calvin klein", "gucci", "louis vuitton",
    "lv", "prada", "dior", "chanel", "balenciaga", "burberry", "versace", "fendi", "hermes", "celine",
    "saint laurent", "ysl", "off-white", "supreme", "palm angels", "essentials", "fear of god", "stussy",
    "ugg", "dr martens", "timberland", "rolex", "cartier", "pandora", "ray-ban", "oakley", "zara", "rossignol",
    "quiksilver", "roxy", "napapijri", "ellesse", "fila", "kappa", "champion", "sezane", "jacquemus",
]

DHGATE_SCRIPT = r"""() => {
  const out = []; const seen = new Set();
  for (const a of document.querySelectorAll('a[href*="/product/"]')) {
    const href = a.href.split('?')[0];
    if (seen.has(href)) continue;
    let card = a; for (let k = 0; k < 6 && card.parentElement; k++) {
      card = card.parentElement; if ((card.innerText || '').length > 60) break; }
    const text = (card.innerText || '').replace(/\s+/g, ' ').trim();
    if (!/\d/.test(text)) continue;
    seen.add(href);
    out.push({url: href, title: (a.title || a.innerText || '').trim().slice(0, 140), text: text.slice(0, 600)});
    if (out.length >= 30) break;
  }
  return out;
}"""


def strip_brands(text: str, extra: list[str] | None = None) -> tuple[str, list[str]]:
    norm = normalize(text)
    found = []
    for brand in sorted(set(KNOWN_BRANDS + [normalize(b) for b in extra or []]), key=len, reverse=True):
        pattern = r"(?<!\w)" + re.escape(brand) + r"(?!\w)"
        if re.search(pattern, norm):
            found.append(brand)
            norm = re.sub(pattern, " ", norm)
    return re.sub(r"\s+", " ", norm).strip(), found


def dhgate_search_url(base: str, query: str) -> str:
    return f"{base.rstrip('/')}/wholesale/search.do?act=search&searchkey={quote_plus(query)}"


def parse_card(card: dict, usd_to_eur: float) -> dict | None:
    text = card.get("text", "")
    m = re.search(r"(US\s?\$|\$|€|EUR)\s?(\d+(?:[.,]\d{1,2})?)", text)
    if not m:
        return None
    price = float(m.group(2).replace(",", "."))
    price_eur = price if m.group(1) in ("€", "EUR") else price * usd_to_eur
    orders = re.search(r"(\d[\d,.]*)\s*\+?\s*(sold|orders?|vendus?|commandes?)", text, re.I)
    rating = re.search(r"\b([1-5][.,]\d)\b(?:\s*/\s*5)?", text)
    reviews = re.search(r"\((\d[\d,]*)\)|(\d[\d,]*)\s*(reviews?|avis)", text, re.I)
    delivery = re.search(r"(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(days|jours)", text, re.I)
    shipping = 0.0 if re.search(r"free shipping|livraison gratuite", text, re.I) else None
    ship_m = re.search(r"shipping[:\s]*(US\s?\$|\$|€)\s?(\d+(?:[.,]\d{1,2})?)", text, re.I)
    if ship_m:
        s = float(ship_m.group(2).replace(",", "."))
        shipping = s if ship_m.group(1) == "€" else s * usd_to_eur
    return {
        "title": card.get("title") or "", "url": card.get("url", ""), "price_eur": round(price_eur, 2),
        "shipping_eur": None if shipping is None else round(shipping, 2),
        "orders": int(re.sub(r"[^\d]", "", orders.group(1)) or 0) if orders else 0,
        "rating": float(rating.group(1).replace(",", ".")) if rating else None,
        "reviews": int(re.sub(r"[^\d]", "", reviews.group(1) or reviews.group(2)) or 0) if reviews else 0,
        "delivery_days": f"{delivery.group(1)}-{delivery.group(2)}" if delivery else "voir fiche",
    }


def fetch_quotes(app: App, query: str) -> list[dict]:
    s = app.cfg["sourcing"]
    reader = getattr(app.client, "read_external_page", None)
    if not s.get("fetch_dhgate") or reader is None:
        return []
    url = dhgate_search_url(s["dhgate_base_url"], query)
    try:
        cards = reader(url, DHGATE_SCRIPT) or []
    except LimitReached:
        raise
    except Exception as exc:
        log.warning("   DHgate illisible pour « %s » : %s", query, exc)
        return []
    quotes = [q for q in (parse_card(c, float(s["usd_to_eur"])) for c in cards) if q]
    return quotes[: int(s["results_per_product"])]


def best_quote(quotes: list[dict]) -> dict | None:
    """Le moins cher parmi les offres ayant déjà des ventes (sinon le moins cher tout court)."""
    proven = [q for q in quotes if q.get("orders")]
    pool = proven or quotes
    return min(pool, key=lambda q: q["price_eur"] + (q["shipping_eur"] or 0)) if pool else None


def run(app: App) -> dict:
    s = app.cfg["sourcing"]
    app.guard.ensure_running()
    day = date.today().isoformat()
    rows = scout.ranking(app, day)[: int(s["max_products"])]
    if not rows:
        log.warning("Aucun classement : lance d'abord `python main.py scout`.")
        return {"produits": 0}
    log.info("🧭 Sourcing DHgate — %d produit(s), lecture seule, aucune commande", len(rows))
    results = []
    cache: dict[str, dict | None] = {}
    for r in rows:
        if s.get("block_brands"):
            generic, brands = strip_brands(r["mot_cle"])
            if r["marque"] != "sans marque":
                brands.append(r["marque"])
        else:
            generic, brands = r["mot_cle"], []
        manual = (s.get("manual_quotes") or {}).get(r["mot_cle"]) or (s.get("manual_quotes") or {}).get(r["article"])
        if manual:
            quote = {"title": "(saisie manuelle)", "url": manual.get("url", ""), "price_eur": float(manual["price_eur"]),
                     "shipping_eur": manual.get("shipping_eur"), "orders": manual.get("orders", 0),
                     "rating": manual.get("rating"), "reviews": manual.get("reviews", 0),
                     "delivery_days": manual.get("delivery_days", "?")}
        else:
            try:
                if generic not in cache:
                    cache[generic] = best_quote(fetch_quotes(app, generic))
                quote = cache[generic]
            except LimitReached as exc:
                log.warning("⛔ %s", exc)
                break
        link = dhgate_search_url(s["dhgate_base_url"], generic)
        row = {"article": r["article"], "recherche_dhgate": generic, "lien_dhgate": link,
               "prix_vinted_moyen": r["prix_moyen"], "taux_de_vente": r["taux_de_vente"],
               "favoris_moyens": r["favoris_moyens"], "score_vinted": r["score"],
               "alerte_marque": ", ".join(brands)}
        if quote:
            ship = quote["shipping_eur"] if quote["shipping_eur"] is not None else float(s["default_shipping_eur"])
            m = margin(r["prix_moyen"], quote["price_eur"], ship, s)
            row.update({"prix_dhgate": quote["price_eur"], "livraison": ship, "delai": quote["delivery_days"],
                        "ventes_dhgate": quote["orders"], "note": quote["rating"] or "", "avis": quote["reviews"],
                        "fiche_dhgate": quote["url"], "marge": m["margin"], "marge_pct": m["margin_pct"],
                        "roi_pct": m["roi_pct"], "prix_total_acheteur": m["buyer_pays"]})
        results.append(row)

    results.sort(key=lambda x: -(x.get("marge") if x.get("marge") is not None else -1e9))
    shortlist = [x for x in results if x.get("marge", -1) >= float(s["min_margin_eur"]) and not x["alerte_marque"]]
    csv_path, html_path = write_reports(app, results, shortlist, day)
    app.note(MODULE, "report", day, {"produits": len(results), "shortlist": len(shortlist)}, status="done")
    log.info("🧭 Shortlist (marge ≥ %s €, sans marque) : %d produit(s)", s["min_margin_eur"], len(shortlist))
    for x in shortlist[:10]:
        log.info("   • %s — DHgate %.2f € + %.2f € → Vinted %.2f € = marge %.2f € (%s %%)",
                 x["recherche_dhgate"], x["prix_dhgate"], x["livraison"], x["prix_vinted_moyen"], x["marge"], x["marge_pct"])
    log.info("📄 %s\n             %s", csv_path, html_path)
    log.info("ℹ️  Rien n'a été commandé. Commande toi-même ce que tu retiens, puis `python main.py new-listing` à réception.")
    return {"produits": len(results), "shortlist": len(shortlist)}


def write_reports(app: App, results: list[dict], shortlist: list[dict], day: str) -> tuple[Path, Path]:
    out = Path(app.cfg["paths"]["reports"])
    out.mkdir(parents=True, exist_ok=True)
    csv_path, html_path = out / f"sourcing_{day}.csv", out / f"sourcing_{day}.html"
    fields = list(dict.fromkeys(k for r in results for k in r)) or ["article"]
    with csv_path.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, delimiter=";")
        w.writeheader()
        w.writerows(results)

    def a(url: str, text: str) -> str:
        return f'<a href="{html.escape(url)}" target="_blank" rel="noopener">{html.escape(text)}</a>' if url else "—"

    short_ids = {id(x) for x in shortlist}
    rows = "".join(
        f"<tr class='{'ok' if id(x) in short_ids else ''}'><td>{html.escape(x['recherche_dhgate'])}"
        + (f"<br><small class='warn'>⚠ marque retirée : {html.escape(x['alerte_marque'])} — ne revends que du sans-marque</small>"
           if x["alerte_marque"] else "")
        + f"</td><td>{x['prix_vinted_moyen']:.2f} €</td>"
        + (f"<td>{x['prix_dhgate']:.2f} €</td><td>{x['livraison']:.2f} €</td><td><strong>{x['marge']:.2f} €</strong>"
           f" ({x['marge_pct']} %)</td><td>{x['ventes_dhgate']}</td><td>{x['note']}</td><td>{html.escape(str(x['delai']))}</td>"
           if "marge" in x else "<td colspan='6'>prix DHgate non lu — ouvre le lien et saisis-le dans manual_quotes</td>")
        + f"<td>{a(x['lien_dhgate'], 'recherche')} {a(x.get('fiche_dhgate', ''), 'fiche')}</td></tr>"
        for x in results
    )
    html_path.write_text(f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Sourcing {day}</title>
<style>
:root {{ --bg:#f7f7f5; --fg:#1d1d1b; --muted:#6b6b66; --line:#e2e2dc; --accent:#09757a; --ok:#e3f3ea; --warn:#a14b00; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#141413; --fg:#ecece8; --muted:#9a9a93; --line:#2c2c29; --accent:#4fc1c6; --ok:#163024; --warn:#f0a35e; }} }}
body {{ font:15px/1.45 system-ui, sans-serif; background:var(--bg); color:var(--fg); margin:0; padding:24px 16px; }}
main {{ max-width:1200px; margin:0 auto; }} h1 {{ font-size:22px; margin:0 0 4px; }} p {{ color:var(--muted); }}
.wrap {{ overflow-x:auto; }} table {{ border-collapse:collapse; width:100%; }}
th, td {{ padding:8px 10px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }}
th {{ font-size:12px; text-transform:uppercase; color:var(--muted); }} tr.ok {{ background:var(--ok); }}
a {{ color:var(--accent); }} .warn {{ color:var(--warn); }}
</style></head><body><main><h1>Sourcing DHgate — {day}</h1>
<p>Marge = prix Vinted moyen − (prix DHgate + livraison + emballage + frais vendeur Vinted). Lignes en vert : shortlist.
Aucune commande n'est passée par l'outil. Vérifie toujours la fiche produit, les avis et le délai avant d'acheter.</p>
<div class="wrap"><table><thead><tr><th>Produit (recherche générique)</th><th>Vinted moy.</th><th>DHgate</th>
<th>Livraison</th><th>Marge</th><th>Ventes</th><th>Note</th><th>Délai (j)</th><th>Liens</th></tr></thead>
<tbody>{rows}</tbody></table></div></main></body></html>""", encoding="utf-8")
    return csv_path, html_path


def query_from_url(url: str) -> str:
    return (parse_qs(urlparse(url).query).get("searchkey") or [""])[0]
