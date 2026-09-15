"""Cut the raw studio photos in assets/raw-product-photos/ into the
transparent-background PNGs in public/products/.

Re-run this whenever the raw Blanc photos are replaced, then re-run
scripts/recolor-products.py to regenerate the other colorways from the new
bases.

The backdrop is a flat, near-uniform studio gray (corner samples vary by
only a few RGB levels across a frame). Signed brightness difference from an
averaged background-corner sample separates it from the white garment
cleanly: the garment is always brighter than the backdrop, so thresholding
on "how much brighter than bg" isn't fooled by a dark fabric fold the way
plain color distance would be (a fold shadow and a shadowed backdrop patch
can be the same color, but only one of them is darker than the garment
around it). A first attempt fit a smooth gradient across the whole frame to
handle uneven corners, but the fit itself was inaccurate (pulled off by the
one genuinely uneven corner) and left a visible smudge — plain per-corner
sampling turned out to match the actual (near-flat) backdrop better.

Usage: python3 scripts/remove-background.py
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

RAW_DIR = Path(__file__).resolve().parent.parent / "assets" / "raw-product-photos"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "products"

LOW = 25   # brightness delta below this -> fully background
HIGH = 55  # brightness delta above this -> fully foreground
DILATE_PX = 2
CORNER = 15
FABRIC_BRIGHTNESS_MIN = 190  # garment white (~225+) vs backdrop gray (~110-150)

MAPPING = {
    "front.jpg": "arc-tee-front.png",
    "back.jpg": "arc-tee-back.png",
    "detail-logo.jpg": "arc-tee-detail-logo.png",
    "detail-collar.jpg": "arc-tee-detail-collar.png",
    "detail-shoulder.jpg": "arc-tee-detail-shoulder.png",
}


def _corner_blocks(rgb: np.ndarray):
    return {
        "tl": rgb[:CORNER, :CORNER],
        "tr": rgb[:CORNER, -CORNER:],
        "bl": rgb[-CORNER:, :CORNER],
        "br": rgb[-CORNER:, -CORNER:],
    }


def remove_background(src_path: Path, out_path: Path, low=LOW, high=HIGH):
    img = Image.open(src_path).convert("RGB")
    rgb = np.array(img).astype(np.float64)
    h, w, _ = rgb.shape

    # A tight close-up crop may only catch backdrop in one corner, or none
    # at all — pick reference corners adaptively per image rather than
    # assuming a full border strip is background.
    corner_brightness = {k: v.mean() for k, v in _corner_blocks(rgb).items()}
    bg_keys = [k for k, v in corner_brightness.items() if v < FABRIC_BRIGHTNESS_MIN]

    if not bg_keys:
        # Every corner is fabric-bright: nothing to remove.
        alpha_bytes = np.full((h, w), 255, dtype=np.uint8)
        Image.fromarray(np.dstack([np.array(img), alpha_bytes]), mode="RGBA").save(out_path)
        print(f"{src_path.name} -> {out_path.name}: no backdrop detected, kept opaque")
        return

    bg_blocks = [_corner_blocks(rgb)[k] for k in bg_keys]
    bg_brightness = np.concatenate([b.reshape(-1, 3) for b in bg_blocks]).mean()

    brightness = rgb.mean(axis=2)
    diff = brightness - bg_brightness
    alpha = np.clip((diff - low) / (high - low), 0.0, 1.0)

    # A deep fabric fold/seam crease can be as dark as the backdrop, so a
    # blanket brightness threshold alone still misclassifies it. Only trust
    # "background-like" pixels connected back to a confirmed background
    # corner — an isolated dark patch touching the frame edge (a crease,
    # not backdrop) stays foreground.
    background_like = alpha < 0.5
    labeled_bg, _ = ndimage.label(background_like)
    corner_slices = _corner_blocks(labeled_bg)
    seed_labels = set()
    for k in bg_keys:
        seed_labels.update(int(v) for v in np.unique(corner_slices[k]) if v != 0)
    confirmed_bg = np.isin(labeled_bg, list(seed_labels)) if seed_labels else np.zeros_like(background_like)
    alpha = np.where(confirmed_bg, alpha, np.maximum(alpha, 1.0))

    # Patch small dark pockets fully enclosed by garment (fold shadows, the
    # neck tag) so they don't get punched out as transparent holes.
    core = alpha > 0.5
    filled = ndimage.binary_fill_holes(core)

    labeled, n = ndimage.label(filled)
    if n > 1:
        sizes = ndimage.sum(filled, labeled, range(1, n + 1))
        filled = labeled == (np.argmax(sizes) + 1)

    keep = ndimage.binary_dilation(filled, iterations=DILATE_PX)
    # Patched holes go fully opaque; everywhere else keeps its soft
    # diff-based alpha for a natural anti-aliased edge, and anything outside
    # the kept blob (background, disconnected noise) goes fully transparent.
    alpha_final = np.where(filled, 1.0, alpha)
    alpha_final = np.where(keep, alpha_final, 0.0)
    alpha_bytes = np.clip(alpha_final * 255, 0, 255).astype(np.uint8)

    Image.fromarray(np.dstack([np.array(img), alpha_bytes]), mode="RGBA").save(out_path)
    bg_fraction = (alpha_bytes < 10).mean()
    print(f"{src_path.name} -> {out_path.name}: background fraction {bg_fraction:.2%}")


def main():
    for src_name, out_name in MAPPING.items():
        remove_background(RAW_DIR / src_name, OUT_DIR / out_name)


if __name__ == "__main__":
    main()
