#!/usr/bin/env python3
"""Share images (1200x630, monochrome poster crops) and the favicon set.

  python3 tools/make-og.py

Each page gets a small poster: paper ground, the page's plate photo (the -a
variant for rotating plates) graded like the site, the headline in
Instrument Sans straddling the photo's left edge, kicker + index on top.
Writes assets/img/og/<page>.jpg, favicon.ico, favicon-32.png and
apple-touch-icon.png.
"""

import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import process_images as pi  # noqa: E402

PAPER = (233, 231, 226)
INK = (17, 17, 16)
INK_2 = (91, 90, 86)
FONTS = ROOT / "assets/fonts"

PAGES = {
    # page: (source image, crop centre x, crop centre y, kicker, index, headline)
    "home": ("plate-001-a.jpg", 0.62, 0.45, "ryan jaemin ahn", "001", "Build responsibly."),
    "built": ("plate-002-a.jpg", 0.5, 0.4, "probix labs", "002", "Reproducible."),
    "initiatives": ("plate-003-a.jpg", 0.5, 0.5, "stemise · hackathons", "003", "Reach."),
    "research": ("plate-005-a.jpg", 0.5, 0.5, "research", "005", "PDAC."),
    "cv": ("plate-006.jpg", 0.5, 0.35, "roles & projects", "006", "cv."),
    "contact": ("plate-008.jpg", 0.5, 0.5, "say hello", "008", "Reach out."),
    "diary": ("plate-009.jpg", 0.5, 0.5, "entries", "009", "Diary."),
}


def font(name, size, weight=None):
    f = ImageFont.truetype(str(FONTS / name), size)
    if weight:
        f.set_variation_by_axes([weight])
    return f


def css_grade(img):
    # what .grade-silver does on the page: contrast 1.22, brightness .95
    return img.point(lambda v: max(0, min(255, round(((v / 255 - .5) * 1.22 + .5) * .95 * 255))))


def poster(page, spec):
    src, cx, cy, kicker, index, headline = spec
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), PAPER)
    # photo inset: right side, like the plates
    box = (600, 70, 1150, 560)
    bw, bh = box[2] - box[0], box[3] - box[1]
    photo = Image.open(ROOT / "assets/img/src" / src).convert("RGB")
    photo = pi.crop(photo, cx, cy, 1.0, bw / bh)
    photo = css_grade(pi.grade(photo)).resize((bw, bh), Image.Resampling.LANCZOS).convert("RGB")
    # paper fade on the inset's left edge (the straddle scrim)
    fade = Image.linear_gradient("L").rotate(90).resize((bw, bh))
    fade = fade.point(lambda v: 255 if v > 255 * .30 else round(v / .30 * 0.8 + 255 * .2))
    im.paste(Image.composite(photo, Image.new("RGB", (bw, bh), PAPER), ImageOps.invert(ImageOps.invert(fade))), box[:2])

    d = ImageDraw.Draw(im)
    d.text((48, 40), kicker, font=font("instrument-sans.woff2", 30, 600), fill=INK)
    idx = font("instrument-sans.woff2", 30, 700)
    d.text((W - 48, 40), index, font=idx, fill=INK, anchor="ra")
    # headline, sized to fit, bottom-left, straddling the photo edge
    size = 132
    while size > 60:
        hf = font("instrument-sans.woff2", size, 700)
        if d.textlength(headline, font=hf) < W - 110:
            break
        size -= 4
    for dx, dy in ((-3, 0), (3, 0), (0, -3), (0, 3), (-2, -2), (2, 2), (-2, 2), (2, -2)):
        d.text((48 + dx, 470 + dy), headline, font=hf, fill=PAPER, anchor="ls")
    d.text((48, 470), headline, font=hf, fill=INK, anchor="ls")
    d.text((48, H - 44), "ryanjmahn.github.io", font=font("instrument-serif.woff2", 30), fill=INK_2, anchor="ls")
    out = ROOT / "assets/img/og" / f"{page}.jpg"
    out.parent.mkdir(exist_ok=True)
    im.save(out, "JPEG", quality=84, progressive=True, optimize=True)
    print(out.relative_to(ROOT), out.stat().st_size // 1024, "KB")


def favicons():
    def icon(size):
        im = Image.new("RGB", (size, size), PAPER)
        d = ImageDraw.Draw(im)
        f = font("pretendard-subset.woff2", round(size * .74), 700)
        d.text((size / 2, size / 2), "재", font=f, fill=INK, anchor="mm")
        return im
    icon(180).save(ROOT / "apple-touch-icon.png")
    icon(32).save(ROOT / "favicon-32.png")
    icon(64).save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("favicon.ico, favicon-32.png, apple-touch-icon.png")


if __name__ == "__main__":
    for page, spec in PAGES.items():
        poster(page, spec)
    favicons()
