"""Isolate an embroidered logo from a real product photo into a
transparent-background decal texture for the Hero3D placeholder garment
(src/components/hero3d/GarmentPlaceholder.tsx).

NOT CURRENTLY USED: the live decal (public/hero3d/notres-logo-decal.png) was
generated from the La Rue des Nôtres Mark component's SVG, not extracted
from a photo — the real product photos in public/products/ still show the
old "Arc" embroidery (see the GarmentPlaceholder.tsx TODO about re-shooting
product photography for the new brand). This script is kept for whenever
that re-shoot happens and the real embroidered logo needs isolating again;
point SRC at the new logo detail photo first.

public/products/tee-detail-logo.png is a plain opaque crop (real fabric
background, no alpha) — fine for the product cards, which composite it as a
full-frame image, but wrong for a 3D decal, which needs only the ink visible.
Classifies by brightness: the dark embroidery thread becomes opaque, the
white fabric weave around it becomes transparent.

Usage: python3 scripts/extract-logo-decal.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC = REPO_ROOT / "public" / "products" / "tee-detail-logo.png"
OUT = REPO_ROOT / "public" / "hero3d" / "notres-logo-decal.png"

PAD = 18
LOW, HIGH = 120, 190  # brightness range mapped to the alpha ramp


def main():
    src = Image.open(SRC).convert("RGB")
    gray = np.array(src).astype(np.float64).mean(axis=2)

    dark_mask = gray < 150
    ys, xs = np.where(dark_mask)
    y0, y1 = max(0, ys.min() - PAD), min(gray.shape[0], ys.max() + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(gray.shape[1], xs.max() + PAD)

    crop_gray = gray[y0:y1, x0:x1]
    h, w = crop_gray.shape

    alpha = np.clip((HIGH - crop_gray) / (HIGH - LOW), 0.0, 1.0) * 255.0
    rgb = np.full((h, w, 3), 20, dtype=np.uint8)  # dark thread color
    rgba = np.dstack([rgb, alpha.astype(np.uint8)])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, mode="RGBA").save(OUT)
    print(f"saved {OUT} ({w}x{h})")


if __name__ == "__main__":
    main()
