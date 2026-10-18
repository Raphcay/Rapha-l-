"""Isolate the ink from the full La Rue des Nôtres logo badge
(public/brand/la-rue-des-notres-logo.webp) into a transparent-background
decal texture for the Hero3D placeholder garment
(src/components/hero3d/GarmentPlaceholder.tsx).

The badge is a navy illustration on a solid cream circle, no alpha channel —
fine as a standalone image (see /a-propos) but wrong for a 3D decal, which
needs only the ink visible. Classifies by brightness, same technique as
extract-logo-decal.py: the dark line art becomes opaque (keeping its navy
color), the cream background becomes transparent.

Re-run this whenever public/brand/la-rue-des-notres-logo.webp changes.

Usage: python3 scripts/extract-logo-from-badge.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC = REPO_ROOT / "public" / "brand" / "la-rue-des-notres-logo.webp"
OUT = REPO_ROOT / "public" / "hero3d" / "notres-logo-decal.png"

PAD = 24
DARK_THRESHOLD = 180  # pixels darker than this are considered part of the ink, for finding crop bounds
LOW, HIGH = 140, 210  # brightness range mapped to the alpha ramp


def main():
    src = Image.open(SRC).convert("RGB")
    arr = np.array(src)
    gray = arr.astype(np.float64).mean(axis=2)

    dark_mask = gray < DARK_THRESHOLD
    ys, xs = np.where(dark_mask)
    y0, y1 = max(0, ys.min() - PAD), min(gray.shape[0], ys.max() + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(gray.shape[1], xs.max() + PAD)

    crop_gray = gray[y0:y1, x0:x1]
    crop_rgb = arr[y0:y1, x0:x1]
    h, w = crop_gray.shape

    alpha = np.clip((HIGH - crop_gray) / (HIGH - LOW), 0.0, 1.0) * 255.0
    rgba = np.dstack([crop_rgb, alpha.astype(np.uint8)])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, mode="RGBA").save(OUT)
    print(f"saved {OUT} ({w}x{h})")


if __name__ == "__main__":
    main()
