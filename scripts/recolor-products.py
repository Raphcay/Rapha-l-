"""Regenerate the Noir/Gris/Beige product photos from the real Blanc photos.

Re-run this whenever arc-tee-front.png / arc-tee-back.png / arc-tee-detail-*.png
(the real Blanc photos) are replaced. It anchors each colorway's median
lightness on the target color and keeps the photo's own shading around it, so
dark colorways (Noir) keep visible fabric detail instead of crushing to a flat
block the way a plain CSS multiply blend does.

Usage: python3 scripts/recolor-products.py
"""

import colorsys
from pathlib import Path

import numpy as np
from PIL import Image

SRC_DIR = Path(__file__).resolve().parent.parent / "public" / "products"
OUT_DIR = SRC_DIR

BASE_IMAGES = [
    "arc-tee-front.png",
    "arc-tee-back.png",
    "arc-tee-detail-logo.png",
    "arc-tee-detail-collar.png",
    "arc-tee-detail-shoulder.png",
]

COLORWAYS = {
    "noir": "#151515",
    "gris": "#9d9d9d",
    "beige": "#cebdab",
}


def hex_to_rgb01(hex_color: str):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) / 255 for i in (0, 2, 4))


def _hue_to_rgb(p: np.ndarray, q: np.ndarray, t: np.ndarray) -> np.ndarray:
    t = t % 1.0
    out = np.where(t < 1 / 6, p + (q - p) * 6 * t, p)
    out = np.where((t >= 1 / 6) & (t < 1 / 2), q, out)
    out = np.where((t >= 1 / 2) & (t < 2 / 3), p + (q - p) * (2 / 3 - t) * 6, out)
    return out


def hls_to_rgb_vectorized(h: float, l: np.ndarray, s: float) -> np.ndarray:
    if s == 0:
        return np.stack([l, l, l], axis=-1)
    q = np.where(l < 0.5, l * (1 + s), l + s - l * s)
    p = 2 * l - q
    r = _hue_to_rgb(p, q, np.full_like(l, h + 1 / 3))
    g = _hue_to_rgb(p, q, np.full_like(l, h))
    b = _hue_to_rgb(p, q, np.full_like(l, h - 1 / 3))
    return np.stack([r, g, b], axis=-1)


def recolor(src_path: Path, out_path: Path, target_hex: str):
    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img).astype(np.float64)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]

    mask = alpha > 5
    if not mask.any():
        img.save(out_path)
        return

    gray = rgb.mean(axis=2) / 255.0
    visible_gray = gray[mask]
    median = np.median(visible_gray)

    target_r, target_g, target_b = hex_to_rgb01(target_hex)
    h, l, s = colorsys.rgb_to_hls(target_r, target_g, target_b)

    deviation = gray - median
    final_l = np.clip(l + deviation, 0.0, 1.0)

    out_rgb = hls_to_rgb_vectorized(h, final_l, s) * 255.0
    out_rgb = np.clip(out_rgb, 0, 255)

    result = arr.copy()
    result[:, :, :3] = out_rgb
    result[:, :, 3] = alpha
    result = result.astype(np.uint8)

    Image.fromarray(result, mode="RGBA").save(out_path)


def main():
    for base_name in BASE_IMAGES:
        src_path = SRC_DIR / base_name
        stem = src_path.stem  # e.g. arc-tee-front
        for color_slug, hex_color in COLORWAYS.items():
            out_path = OUT_DIR / f"{stem}-{color_slug}.png"
            recolor(src_path, out_path, hex_color)
            print(f"wrote {out_path.name}")


if __name__ == "__main__":
    main()
