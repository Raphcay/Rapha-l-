"""Generate Beige / Gris / Noir colorway photos for the Basique and Spécial
product lines from the real Blanc photos.

The source photos (public/products/tee-{basique,special}-{front,back,
detail-logo,detail-collar,detail-shoulder}.png) are flat RGB crops with an
opaque studio-grey background baked in (no alpha channel) — unlike the
older recolor-products.py, which assumed transparent PNGs. This script
first segments the garment from that background with a border flood-fill
(background is whatever region of near-uniform color touches the image
edge; shadow folds inside the garment stay part of the garment even
though their color can be close to the background's, because they aren't
connected to the edge), then recolors only the garment fabric, leaving the
background untouched.

Within the garment, ink (the LRDN embroidery / the Spécial back print) is
recolored separately from the fabric so it keeps reading cleanly: it stays
dark navy on the light Beige/Gris colorways, and flips to the site's light
"ink" cream (matching --ink in globals.css / the logo mark) on Noir, where
dark-on-dark would be illegible.

Usage: python3 scripts/recolor-catalog.py
"""

import colorsys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC_DIR = Path(__file__).resolve().parent.parent / "public" / "products"

VIEWS = ["front", "back", "detail-logo", "detail-collar", "detail-shoulder"]
PRODUCTS = ["basique", "special"]

COLORWAYS = {
    "beige": "#c9b995",
    "gris": "#9d9d9d",
    "noir": "#151515",
}
LIGHT_INK = "#f3f1ea"  # matches --ink in globals.css

INK_LUMINANCE_THRESHOLD = 120
# How close a pixel needs to be to the background reference color to be
# flood-filled as part of it. The garment's drop shadow on the backdrop
# fades gradually rather than stopping sharply, so this needs to be loose
# enough to absorb that whole gradient as background (tried at 18 — too
# tight, left a tinted halo around the shirt where the shadow sat just
# outside that tolerance) while still relying on border-connectivity,
# not just color distance, to keep it from eating into real fabric.
BG_TOLERANCE = 35
MASK_FEATHER_PX = 2.5


def hex_to_rgb01(hex_color: str):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) / 255 for i in (0, 2, 4))


def _hue_to_rgb(p, q, t):
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


def garment_mask(arr: np.ndarray) -> np.ndarray:
    """Soft (0..1) mask: 1 = garment (fabric or ink), 0 = studio background."""
    h, w, _ = arr.shape
    border = np.concatenate(
        [
            arr[0:3, :].reshape(-1, 3),
            arr[-3:, :].reshape(-1, 3),
            arr[:, 0:3].reshape(-1, 3),
            arr[:, -3:].reshape(-1, 3),
        ]
    )
    bg_ref = np.median(border, axis=0)
    dist = np.sqrt(((arr.astype(float) - bg_ref) ** 2).sum(axis=2))
    bg_like = dist < BG_TOLERANCE

    labeled, _ = ndimage.label(bg_like)
    border_labels = set(labeled[0, :]) | set(labeled[-1, :])
    border_labels |= set(labeled[:, 0]) | set(labeled[:, -1])
    border_labels.discard(0)
    true_bg = np.isin(labeled, list(border_labels))
    mask = (~true_bg).astype(np.float64)

    mask_img = Image.fromarray((mask * 255).astype(np.uint8))
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(MASK_FEATHER_PX))
    return np.array(mask_img).astype(np.float64) / 255.0


def recolor_region(arr: np.ndarray, region_mask: np.ndarray, target_hex: str) -> np.ndarray:
    """Hue/lightness-shift pixels where region_mask > 0 toward target_hex,
    anchoring the region's median lightness on the target so natural
    shading (folds, shadow) is preserved around the new base tone."""
    rgb = arr[:, :, :3].astype(np.float64)
    gray = rgb.mean(axis=2) / 255.0

    weighted = region_mask > 0.05
    if not weighted.any():
        return arr
    median = np.median(gray[weighted])

    target_r, target_g, target_b = hex_to_rgb01(target_hex)
    h, l, s = colorsys.rgb_to_hls(target_r, target_g, target_b)

    deviation = gray - median
    final_l = np.clip(l + deviation, 0.0, 1.0)
    out_rgb = hls_to_rgb_vectorized(h, final_l, s) * 255.0
    out_rgb = np.clip(out_rgb, 0, 255)

    blend = region_mask[:, :, None]
    return arr * (1 - blend) + out_rgb * blend


def recolor_image(src_path: Path, out_path: Path, colorway_hex: str, colorway_slug: str):
    img = Image.open(src_path).convert("RGB")
    arr = np.array(img).astype(np.float64)

    g_mask = garment_mask(np.array(img))
    gray = arr.mean(axis=2) / 255.0
    ink_mask = g_mask * (gray < (INK_LUMINANCE_THRESHOLD / 255.0))
    fabric_mask = g_mask - ink_mask

    result = recolor_region(arr, fabric_mask, colorway_hex)
    if colorway_slug == "noir":
        result = recolor_region(result, ink_mask, LIGHT_INK)
    # else: ink stays as-is (dark navy reads fine on Beige/Gris)

    Image.fromarray(np.clip(result, 0, 255).astype(np.uint8)).save(out_path)


def main():
    for product in PRODUCTS:
        for view in VIEWS:
            src = SRC_DIR / f"tee-{product}-{view}.png"
            if not src.exists():
                print(f"skip (missing): {src.name}")
                continue
            for slug, hex_color in COLORWAYS.items():
                out = SRC_DIR / f"tee-{product}-{view}-{slug}.png"
                recolor_image(src, out, hex_color, slug)
                print(f"wrote {out.name}")


if __name__ == "__main__":
    main()
