"""Produce the light-colored, transparent-background logo variants used
across the dark site UI (nav, footer, chat widget, favicon, Open Graph
image, /a-propos) — never the opaque badge itself, which carries a cream
background that would show as a visible box/circle on a dark page.

Reads public/hero3d/notres-logo-decal.png (the navy, transparent-background
ink already isolated from the real logo by extract-logo-from-badge.py — run
that script first if the source logo changed) and produces two outputs,
both recolored from navy to the site's light "ink" tone (#f3f1ea):

- public/brand/la-rue-des-notres-logo-light.png: the full logo (icon +
  wordmark), used wherever there's room to show the brand name
  (opengraph-image.tsx, /a-propos).
- public/brand/la-rue-des-notres-icon-light.png: just the icon (mountains,
  sun, reflection), cropped out of the above — the wordmark text doesn't
  read at nav/favicon size. Used by Mark.tsx and icon.tsx.

Usage: python3 scripts/make-logo-light-variants.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
DECAL = REPO_ROOT / "public" / "hero3d" / "notres-logo-decal.png"
OUT_LOGO = REPO_ROOT / "public" / "brand" / "la-rue-des-notres-logo-light.png"
OUT_ICON = REPO_ROOT / "public" / "brand" / "la-rue-des-notres-icon-light.png"

LIGHT_INK = (0xF3, 0xF1, 0xEA)  # matches --ink in globals.css
ICON_PAD_FRACTION = 0.08


def recolor(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    arr[:, :, 0] = LIGHT_INK[0]
    arr[:, :, 1] = LIGHT_INK[1]
    arr[:, :, 2] = LIGHT_INK[2]
    return Image.fromarray(arr, mode="RGBA")


def crop_icon(img: Image.Image) -> Image.Image:
    alpha = np.array(img)[:, :, 3]
    has_ink = alpha > 20

    # Find every run of rows that has ink, separated by fully-empty rows.
    row_has = has_ink.any(axis=1)
    bands, in_band, start = [], False, 0
    for y, has in enumerate(row_has):
        if has and not in_band:
            in_band, start = True, y
        elif not has and in_band:
            in_band = False
            bands.append((start, y))
    if in_band:
        bands.append((start, len(row_has)))

    # The reflection's wavy lines are themselves separated by small gaps,
    # so the mountain + reflection is actually several close bands, not
    # one. Merge bands that are close together; only the real gap before
    # the wordmark (much larger) should stay a separator.
    gap_merge = max(15, int(img.height * 0.03))
    merged = [bands[0]]
    for b0, b1 in bands[1:]:
        if b0 - merged[-1][1] <= gap_merge:
            merged[-1] = (merged[-1][0], b1)
        else:
            merged.append((b0, b1))

    # The icon (mountains + sun + full reflection) is the first merged
    # band — the wordmark starts after the real gap further down.
    y0, y1 = merged[0]

    xs = np.where(has_ink[y0:y1, :].any(axis=0))[0]
    x0, x1 = xs.min(), xs.max()

    # Crop to the icon's own bounding box (mountains + sun + full reflection),
    # padded a little on every side — not forced to a square, so the outer
    # mountain slopes never get cut off. Callers (Mark.tsx, icon.tsx) use
    # object-contain inside a square box, so a wider-than-tall result just
    # letterboxes instead of losing content.
    w, h = x1 - x0, y1 - y0
    pad_x, pad_y = int(w * ICON_PAD_FRACTION), int(h * ICON_PAD_FRACTION)
    left = max(0, x0 - pad_x)
    top = max(0, y0 - pad_y)
    right = min(img.width, x1 + pad_x)
    bottom = min(img.height, y1 + pad_y)
    return img.crop((left, top, right, bottom))


def main():
    decal = Image.open(DECAL)
    light_logo = recolor(decal)
    light_logo.save(OUT_LOGO)
    print(f"saved {OUT_LOGO} ({light_logo.size[0]}x{light_logo.size[1]})")

    light_icon = crop_icon(light_logo)
    light_icon.save(OUT_ICON)
    print(f"saved {OUT_ICON} ({light_icon.size[0]}x{light_icon.size[1]})")


if __name__ == "__main__":
    main()
