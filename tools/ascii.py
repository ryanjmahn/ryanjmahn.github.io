#!/usr/bin/env python3
"""Convert an image into static ASCII <pre> markup for the site.

Three modes, all sharing the same character ramp and cell proportions as the
original portrait renderer:

  photo  - full per-character color (the portrait itself)
  figure - plain text + <span class="hit"> on red-dominant cells (margin figures)
  strip  - procedural 3-row density texture, no source image needed

Output is meant to be pasted into index.html as static markup. Nothing here
runs on the page.
"""

import argparse
import random

from PIL import Image

RAMP = "@%#*+=-:. "  # dense -> sparse; last char is a space
CHAR_ASPECT = 0.55  # matches the portrait's row-count formula
NEAR_WHITE = 245


def luminance(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b


def is_red_dominant(r, g, b):
    return r > 150 and r > 1.6 * g and r > 1.6 * b


def crop_top(img, fraction):
    w, h = img.size
    return img.crop((0, 0, w, round(h * fraction)))


def sample_grid(img, cols):
    img = img.convert("RGBA")
    rows = max(1, round(cols * (img.height / img.width) * CHAR_ASPECT))
    small = img.resize((cols, rows), Image.Resampling.BOX)
    grid = []
    for y in range(rows):
        row = []
        for x in range(cols):
            r, g, b, a = small.getpixel((x, y))
            if a < 10:
                r = g = b = 255
            row.append((r, g, b))
        grid.append(row)
    return grid


def char_for(r, g, b):
    if max(r, g, b) >= NEAR_WHITE and abs(r - g) < 8 and abs(g - b) < 8:
        return " "
    idx = min(len(RAMP) - 1, int((luminance(r, g, b) / 255) * len(RAMP)))
    return RAMP[idx]


def render_photo(path, cols, crop_bottom):
    img = Image.open(path)
    if crop_bottom < 1.0:
        img = crop_top(img, crop_bottom)
    grid = sample_grid(img, cols)
    lines = []
    for row in grid:
        parts = []
        for (r, g, b) in row:
            ch = char_for(r, g, b)
            parts.append(" " if ch == " " else f'<span style="color:rgb({r},{g},{b})">{ch}</span>')
        lines.append("".join(parts))
    body = "\n".join(lines)
    return f'<pre class="ascii-portrait" role="img" aria-label="ASCII portrait of Ryan Jaemin Ahn">\n{body}\n</pre>'


def render_figure(path, cols):
    img = Image.open(path)
    grid = sample_grid(img, cols)
    lines = []
    for row in grid:
        parts = []
        for (r, g, b) in row:
            ch = char_for(r, g, b)
            if ch == " ":
                parts.append(" ")
            elif is_red_dominant(r, g, b):
                parts.append(f'<span class="hit">{ch}</span>')
            else:
                parts.append(ch)
        lines.append("".join(parts))
    body = "\n".join(lines)
    return f'<pre class="fig" aria-hidden="true">\n{body}\n</pre>'


def render_strip(cols):
    random.seed(42)
    bands = ["%#*", "+=-", ":. "]
    lines = ["".join(random.choice(band) for _ in range(cols)) for band in bands]
    body = "\n".join(lines)
    return f'<pre class="strip" aria-hidden="true">\n{body}\n</pre>'


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="mode", required=True)

    photo = sub.add_parser("photo", help="full-color per-character conversion")
    photo.add_argument("input")
    photo.add_argument("--cols", type=int, default=84)
    photo.add_argument("--crop-bottom", type=float, default=1.0, help="fraction of height to keep, from the top")

    figure = sub.add_parser("figure", help="muted + red-hit conversion")
    figure.add_argument("input")
    figure.add_argument("--cols", type=int, default=40)

    strip = sub.add_parser("strip", help="procedural density strip")
    strip.add_argument("--cols", type=int, default=600)

    args = p.parse_args()

    if args.mode == "photo":
        print(render_photo(args.input, args.cols, args.crop_bottom))
    elif args.mode == "figure":
        print(render_figure(args.input, args.cols))
    elif args.mode == "strip":
        print(render_strip(args.cols))


if __name__ == "__main__":
    main()
