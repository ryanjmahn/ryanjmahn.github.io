"""Screenshot every page at 375 / 768 / 1440 in light and dark.

    python3 scripts/shoot.py 1     # -> .loop/shots/loop-1/<page>-<width>-<theme>.png
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from check import serve
from playwright.sync_api import sync_playwright

PAGES = ["/", "/404.html"]
WIDTHS = [375, 768, 1440]

def name(path):
    return path.strip("/").replace(".html", "").replace("/", "") or "home"

if __name__ == "__main__":
    loop = sys.argv[1] if len(sys.argv) > 1 else "0"
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".loop", "shots", f"loop-{loop}")
    os.makedirs(out, exist_ok=True)
    base = serve()
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for theme in ("light", "dark"):
            for w in WIDTHS:
                ctx = b.new_context(viewport={"width": w, "height": 900}, color_scheme=theme, reduced_motion="reduce")
                pg = ctx.new_page()
                for path in PAGES:
                    pg.goto(base + path, wait_until="networkidle")
                    pg.evaluate("document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'))")
                    pg.screenshot(path=os.path.join(out, f"{name(path)}-{w}-{theme}.png"), full_page=True)
                ctx.close()
        b.close()
    print(f"shots -> {out}")
