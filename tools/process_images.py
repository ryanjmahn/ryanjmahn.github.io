#!/usr/bin/env python3
"""Plate photo pipeline. Run via tools/process-images.sh (see CREDITS.md).

For every entry in tools/images.json:

  1. open the untouched original from assets/img/src/
  2. crop to the plate's 3:4 frame (crop centre + zoom from the manifest, so
     every variant of a plate is framed the same way)
  3. grayscale -> levels (clip 1% of shadows, 0.5% of highlights) ->
     optional per-photo "gamma" so the three variants of a plate carry the
     same tonal weight (<1 lightens, >1 darkens) -> a steep S-curve
     ("contrast", default 7): crushed blacks, clipped highlights, very
     little mid-grey. This is the final look; the CSS grade class only
     adds grayscale(1) as a safety net.
  4. resize to each long edge in SIZES and export AVIF + WebP + JPG

AVIF quality is stepped down until the file fits AVIF_BUDGET, which keeps
the random hero (plate 001, the LCP element) under ~180 KB whichever
variant is drawn.

Requires Pillow >= 11 with AVIF support (pip install pillow).
"""

import json
import math
import pathlib
import sys

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/img/src"
OUT = ROOT / "assets/img"
SIZES = (800, 1000, 1600, 2000)  # long edge, px; 800 serves phones
ASPECT = 3 / 4  # width / height of every plate photo
CONTRAST = 7  # S-curve steepness; higher = less mid-grey
AVIF_BUDGET = 180_000  # bytes


def grade(img, gamma=1.0, contrast=CONTRAST):
    img = ImageOps.grayscale(img)
    img = ImageOps.autocontrast(img, cutoff=(1.0, 0.5))
    if gamma != 1.0:
        img = img.point(lambda v: round(255 * (v / 255) ** gamma))
    lo = 1 / (1 + math.exp(contrast / 2))
    hi = 1 / (1 + math.exp(-contrast / 2))
    return img.point(lambda v: round(255 * ((1 / (1 + math.exp(-contrast * (v / 255 - .5)))) - lo) / (hi - lo)))


def crop(img, cx, cy, zoom, aspect):
    """Largest `aspect` box that fits, scaled by 1/zoom, centred on (cx, cy)
    as fractions of the image, clamped to stay inside it."""
    w, h = img.size
    if aspect is None:
        aspect = w / h
    if w / h > aspect:
        ch = h / zoom
        cw = ch * aspect
    else:
        cw = w / zoom
        ch = cw / aspect
    left = min(max(cx * w - cw / 2, 0), w - cw)
    top = min(max(cy * h - ch / 2, 0), h - ch)
    return img.crop((round(left), round(top), round(left + cw), round(top + ch)))


def save_avif(img, path):
    for q in (62, 55, 48, 42, 36, 30, 24):
        img.save(path, "AVIF", quality=q, speed=4)
        if path.stat().st_size <= AVIF_BUDGET:
            return q
    return q


def process(name, spec):
    src = Image.open(SRC / spec["src"])
    src = ImageOps.exif_transpose(src).convert("RGB")
    framed = crop(src, spec.get("cx", 0.5), spec.get("cy", 0.5), spec.get("zoom", 1.0),
                  spec.get("aspect", ASPECT))
    graded = grade(framed, spec.get("gamma", 1.0), spec.get("contrast", CONTRAST))
    report = []
    for long_edge in spec.get("sizes", SIZES):
        w, h = graded.size
        scale = long_edge / max(w, h)
        if scale > 1.02:
            print(f"  ! {name}: upscaling {scale:.2f}x for {long_edge}px — find a larger original", file=sys.stderr)
        out = graded.resize((round(w * scale), round(h * scale)), Image.Resampling.LANCZOS)
        stem = OUT / f"{name}-{long_edge}"
        q = save_avif(out, stem.with_suffix(".avif"))
        out.save(stem.with_suffix(".webp"), "WEBP", quality=74, method=6)
        out.save(stem.with_suffix(".jpg"), "JPEG", quality=78, progressive=True, optimize=True)
        report.append(f"{long_edge}: {out.size[0]}x{out.size[1]} avif q{q} {stem.with_suffix('.avif').stat().st_size // 1024}KB")
    print(f"{name}: " + " · ".join(report))


def main():
    manifest = json.loads((ROOT / "tools/images.json").read_text())
    only = set(sys.argv[1:])
    for name, spec in manifest.items():
        if name.startswith("_") or (only and name not in only):
            continue
        process(name, spec)


if __name__ == "__main__":
    main()
