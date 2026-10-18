"""Crop the icon (mountains, sun, reflection) out of the full logo badge
(public/brand/la-rue-des-notres-logo.webp) for small-scale use — the nav,
footer and chat widget Mark (src/components/Mark.tsx), where the wordmark
text below the icon doesn't read at 20-48px.

Finds the icon's bounding box by locating rows/columns with dark (ink)
pixels above the wordmark, rather than a hardcoded crop box, so it still
works if the source logo is swapped for a differently-proportioned one.

Re-run this whenever public/brand/la-rue-des-notres-logo.webp changes.

Usage: python3 scripts/crop-logo-icon.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC = REPO_ROOT / "public" / "brand" / "la-rue-des-notres-logo.webp"
OUT = REPO_ROOT / "public" / "brand" / "la-rue-des-notres-icon.png"

DARK_THRESHOLD = 180
PAD_FRACTION = 0.08  # extra margin around the icon, as a fraction of its own size


def main():
    img = Image.open(SRC).convert("RGB")
    arr = np.array(img).astype(np.float64).mean(axis=2)
    dark = arr < DARK_THRESHOLD

    # The wordmark sits in its own band below the icon, separated by a gap
    # of rows with no ink — the icon is the first (tallest) such band.
    row_has_dark = dark.any(axis=1)
    bands = []
    in_band = False
    start = 0
    for y, has in enumerate(row_has_dark):
        if has and not in_band:
            in_band, start = True, y
        elif not has and in_band:
            in_band = False
            bands.append((start, y))
    if in_band:
        bands.append((start, len(row_has_dark)))
    icon_band = max(bands, key=lambda b: b[1] - b[0])

    icon_rows = dark[icon_band[0]:icon_band[1], :]
    xs = np.where(icon_rows.any(axis=0))[0]
    x0, x1 = xs.min(), xs.max()
    y0, y1 = icon_band

    # Square sized off the icon's HEIGHT, not its width: this icon is much
    # wider than tall (two mountain slopes spreading out), so a square sized
    # to fit the full width would be far taller than the icon itself,
    # running off the top of the image and pulling the wordmark in at the
    # bottom. Cropping tighter horizontally (losing the outer slopes) is the
    # right trade-off for a small circular nav badge anyway.
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = (y1 - y0) / 2 * (1 + PAD_FRACTION)
    left, top = int(cx - half), int(cy - half)
    size = int(half * 2)
    left = max(0, min(left, img.width - size))
    top = max(0, min(top, img.height - size))

    img.crop((left, top, left + size, top + size)).save(OUT)
    print(f"saved {OUT} ({size}x{size})")


if __name__ == "__main__":
    main()
