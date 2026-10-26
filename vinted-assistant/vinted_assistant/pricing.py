"""Calculs de prix : offres (avec plancher) et marges de sourcing."""
from __future__ import annotations

import math
import random
import statistics

from .clients.base import Item


def floor_for(item: Item, offers_cfg: dict) -> float:
    explicit = (offers_cfg.get("floors") or {}).get(str(item.id))
    if explicit is not None:
        return float(explicit)
    return round(item.price * float(offers_cfg["default_floor_pct"]) / 100, 2)


def offer_price(item: Item, offers_cfg: dict, rng: random.Random | None = None) -> tuple[float | None, float, str]:
    """Retourne (prix de l'offre ou None, plancher, explication)."""
    rng = rng or random.Random()
    floor = floor_for(item, offers_cfg)
    lo, hi = offers_cfg["discount_pct"]
    pct = rng.uniform(float(lo), float(hi))
    # Arrondi « humain » à 0,50 € inférieur, puis jamais sous le plancher.
    price = math.floor(item.price * (1 - pct / 100) * 2) / 2
    if price < floor:
        price = math.ceil(floor * 100) / 100
    price = round(price, 2)
    if price >= item.price:
        return None, floor, f"plancher {floor:.2f} € ≥ prix {item.price:.2f} € : pas de remise possible"
    if price < 1:
        return None, floor, "prix trop bas (minimum Vinted 1 €)"
    return price, floor, f"-{(1 - price / item.price) * 100:.1f} % (plancher {floor:.2f} €)"


def vinted_seller_fees(price: float, s: dict) -> float:
    return round(price * float(s["seller_fee_pct"]) / 100 + float(s["seller_fee_fixed_eur"]), 2)


def buyer_total(price: float, s: dict) -> float:
    return round(price + price * float(s["buyer_protection_pct"]) / 100 + float(s["buyer_protection_fixed_eur"]), 2)


def margin(sell_price: float, cost_eur: float, shipping_eur: float, s: dict) -> dict:
    fees = vinted_seller_fees(sell_price, s)
    costs = cost_eur + shipping_eur + float(s["packaging_eur"]) + fees
    m = round(sell_price - costs, 2)
    return {
        "sell_price": round(sell_price, 2), "cost": round(cost_eur, 2), "shipping": round(shipping_eur, 2),
        "packaging": float(s["packaging_eur"]), "vinted_fees": fees, "margin": m,
        "margin_pct": round(m / sell_price * 100, 1) if sell_price else 0.0,
        "roi_pct": round(m / costs * 100, 1) if costs else 0.0,
        "buyer_pays": buyer_total(sell_price, s),
    }


def suggested_price(prices: list[float], discount_pct: float) -> float | None:
    prices = [p for p in prices if p > 0]
    if not prices:
        return None
    med = statistics.median(prices)
    return max(1.0, math.floor(med * (1 - discount_pct / 100)) + 0.0)
