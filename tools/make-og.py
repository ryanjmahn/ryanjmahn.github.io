#!/usr/bin/env python3
"""Share images (1200x630, monochrome poster crops) and the favicon set.

  python3 tools/make-og.py

Each page gets a small poster: the page's plate photo (the -a variant for
rotating plates) graded like the site, on cool paper or on the blue field
to match the plate, the headline in Instrument Sans straddling the photo's left
edge, kicker + index on top.
Writes assets/img/og/<page>.jpg, favicon.ico, favicon-32.png and
apple-touch-icon.png.
"""

import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import process_images as pi  # noqa: E402

import numpy as np  # noqa: E402

# tokens (keep in sync with :root in assets/css/site.css)
PAPER = (0xE9, 0xEE, 0xF4)
INK = (0x0A, 0x10, 0x20)
INK_2 = (0x49, 0x56, 0x6B)
ABYSS = (0x00, 0x05, 0x0F)
NAVY = (0x00, 0x12, 0x33)
BLUE = {700: (0x01, 0x2C, 0x86), 500: (0x0A, 0x5B, 0xD3), 300: (0x2B, 0xA6, 0xF0), 100: (0x9E, 0xDC, 0xFF)}
ON_DARK = (0xF2, 0xF6, 0xFB)
FONTS = ROOT / "assets/fonts"

PAGES = {
    # page: (source image, crop centre x, crop centre y, kicker, index, headline, dark plate[, zoom])
    "home": ("plate-001-a.jpg", 0.15, 0.8, "ryan jaemin ahn", "001", "Build responsibly.", True, 1.4),
    "built": ("plate-002-a.jpg", 0.5, 0.5, "probix labs", "002", "Reproducible.", True),
    "initiatives": ("plate-003-a.jpg", 0.5, 0.6, "stemise · hackathons", "003", "Reach.", True),
    "research": ("plate-005-a.jpg", 0.5, 0.5, "research", "005", "Trust, measured.", True),
    "contact": ("plate-008.jpg", 0.5, 0.5, "say hello", "008", "Reach out.", True),
    "diary": ("plate-009.jpg", 0.5, 0.5, "entries", "009", "Diary.", True),
}


def font(name, size, weight=None):
    f = ImageFont.truetype(str(FONTS / name), size)
    if weight:
        f.set_variation_by_axes([weight])
    return f


def field(w, h):
    """The --field-base + --field-light geometry from site.css, rendered."""
    y, x = np.mgrid[0:h, 0:w].astype(float)
    u, v = x / w, y / h
    # base: linear 160deg abyss -> navy -> abyss
    t = np.clip((u * np.sin(np.radians(160)) - v * np.cos(np.radians(160)) + 1) / 2, 0, 1)
    img = np.empty((h, w, 3))
    for c in range(3):
        img[..., c] = np.interp(t, [0, .55, 1], [ABYSS[c], NAVY[c], ABYSS[c]])

    def radial(color, rx, ry, cx, cy, stop):
        d = np.sqrt(((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2)
        a = np.clip(1 - d / stop, 0, 1)[..., None]
        return a * np.array(color) + (1 - a) * img

    img = radial(BLUE[700], 1.4 / 2, 1.2 / 2, .52, .58, .72)
    img = radial(BLUE[500], 1.1 / 2, .9 / 2, .62, .76, .70)
    img = radial(BLUE[300], .85 / 2, .7 / 2, .72, .92, .58)
    img = radial(BLUE[100], .9 / 2, .7 / 2, .92, 1.12, .45)
    # navy shade over the type column (as .plate--dark::after)
    a = np.interp(u, [0, .3, .52], [.88, .70, 0])[..., None]
    img = a * np.array(NAVY) + (1 - a) * img
    return Image.fromarray(img.clip(0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(20))


def luminosity(backdrop, gray):
    """CSS mix-blend-mode: luminosity (W3C compositing spec SetLum/ClipColor):
    the backdrop's hue and saturation with the source's luminance."""
    cb = backdrop.astype(float) / 255
    lum = lambda c: .3 * c[..., 0] + .59 * c[..., 1] + .11 * c[..., 2]
    d = gray.astype(float) / 255 - lum(cb)
    c = cb + d[..., None]
    l = lum(c)[..., None]
    n, x = c.min(axis=-1, keepdims=True), c.max(axis=-1, keepdims=True)
    with np.errstate(divide="ignore", invalid="ignore"):
        c = np.where(n < 0, l + (c - l) * l / (l - n), c)
        c = np.where(x > 1, l + (c - l) * (1 - l) / (x - l), c)
    return Image.fromarray((np.nan_to_num(c).clip(0, 1) * 255).astype("uint8"))


def poster(page, spec):
    src, cx, cy, kicker, index, headline, dark, *rest = spec
    zoom = rest[0] if rest else 1.0
    ground, fg, halo, meta = (NAVY, ON_DARK, ABYSS, ON_DARK) if dark else (PAPER, INK, PAPER, INK_2)
    W, H = 1200, 630
    im = field(W, H) if dark else Image.new("RGB", (W, H), ground)
    # photo inset: right side, like the plates
    box = (600, 70, 1150, 560)
    bw, bh = box[2] - box[0], box[3] - box[1]
    photo = Image.open(ROOT / "assets/img/src" / src).convert("RGB")
    photo = pi.crop(photo, cx, cy, zoom, bw / bh)
    gray = pi.grade(photo).resize((bw, bh), Image.Resampling.LANCZOS)
    behind = im.crop(box)
    if dark:
        photo = luminosity(np.asarray(behind), np.asarray(gray))
    else:
        photo = gray.convert("RGB")
    # the inset's left edge fades into the ground (the CSS mask)
    fade = Image.linear_gradient("L").rotate(90).resize((bw, bh))
    fade = fade.point(lambda v: 255 if v > 255 * .22 else round(v / .22 * 255))
    im.paste(Image.composite(photo, behind, fade), box[:2])

    d = ImageDraw.Draw(im)
    d.text((48, 40), kicker, font=font("instrument-sans.woff2", 30, 600), fill=fg)
    idx = font("instrument-sans.woff2", 30, 700)
    d.text((W - 48, 40), index, font=idx, fill=fg, anchor="ra")
    # headline, sized to fit, bottom-left, straddling the photo edge
    size = 132
    while size > 60:
        hf = font("instrument-sans.woff2", size, 700)
        if d.textlength(headline, font=hf) < W - 110:
            break
        size -= 4
    for dx, dy in ((-3, 0), (3, 0), (0, -3), (0, 3), (-2, -2), (2, 2), (-2, 2), (2, -2)):
        d.text((48 + dx, 470 + dy), headline, font=hf, fill=halo, anchor="ls")
    d.text((48, 470), headline, font=hf, fill=fg, anchor="ls")
    d.text((48, H - 44), "ryanjmahn.github.io", font=font("instrument-serif.woff2", 30), fill=meta, anchor="ls")
    out = ROOT / "assets/img/og" / f"{page}.jpg"
    out.parent.mkdir(exist_ok=True)
    im.save(out, "JPEG", quality=84, progressive=True, optimize=True)
    print(out.relative_to(ROOT), out.stat().st_size // 1024, "KB")


def favicons():
    def icon(size):
        im = Image.new("RGB", (size, size), ABYSS)
        d = ImageDraw.Draw(im)
        f = font("instrument-sans.woff2", round(size * .74), 700)
        d.text((size / 2, size / 2), "j", font=f, fill=ON_DARK, anchor="mm")
        return im
    icon(180).save(ROOT / "apple-touch-icon.png")
    icon(32).save(ROOT / "favicon-32.png")
    icon(64).save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("favicon.ico, favicon-32.png, apple-touch-icon.png")


if __name__ == "__main__":
    for page, spec in PAGES.items():
        poster(page, spec)
    favicons()
