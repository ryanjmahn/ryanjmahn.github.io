"""Site checks: crawl from index.html and fail loudly on
broken internal links / missing assets, h1 count != 1, img without alt,
missing <title> or meta description, banned words or lorem, horizontal
overflow at 375px (both themes), and Lighthouse scores below 95.

    python3 scripts/check.py            # everything
    LIGHTHOUSE=0 python3 scripts/check.py

Needs: playwright (pip), and npx lighthouse for the last check.
"""
import functools, http.server, json, os, re, socketserver, subprocess, sys, threading
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen
from urllib.error import HTTPError

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANNED = ["passionate", "leveraging", "innovative", "spearheaded", "lorem"]
errors = []

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Quiet, directory=ROOT)
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{httpd.server_address[1]}"

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.h1, self.noalt, self.text = [], 0, 0, []
        self.title = self.desc = self.redirect = False
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style"): self.skip += 1
        if tag == "h1": self.h1 += 1
        if tag == "img" and "alt" not in a: self.noalt += 1
        if tag == "title": self.title = True
        if tag == "meta" and a.get("name") == "description" and a.get("content"): self.desc = True
        if tag == "meta" and a.get("http-equiv") == "refresh": self.redirect = True
        for k in ("href", "src"):
            if a.get(k): self.refs.append(a[k])
    def handle_endtag(self, tag):
        if tag in ("script", "style"): self.skip -= 1
    def handle_data(self, d):
        if not self.skip: self.text.append(d)

def crawl(base):
    seen, queue, pages = set(), ["/"], []
    while queue:
        path = queue.pop()
        if path in seen: continue
        seen.add(path)
        try:
            r = urlopen(base + path)
        except HTTPError as e:
            errors.append(f"broken: {path} ({e.code})"); continue
        if "text/html" not in r.headers.get("Content-Type", ""): continue
        p = Page(); p.feed(r.read().decode())
        pages.append((path, p))
        for ref in p.refs:
            u = urlparse(urljoin(base + path, ref))
            if u.netloc != urlparse(base).netloc or u.scheme not in ("http", "https"): continue
            queue.append(u.path)
    return pages

def static_checks(pages):
    for path, p in pages:
        if p.redirect: continue
        if p.h1 != 1: errors.append(f"{path}: {p.h1} h1s")
        if p.noalt: errors.append(f"{path}: {p.noalt} img without alt")
        if not p.title: errors.append(f"{path}: no <title>")
        if not p.desc: errors.append(f"{path}: no meta description")
        text = " ".join(p.text).lower()
        for w in BANNED:
            if re.search(r"\b" + w, text): errors.append(f"{path}: banned word '{w}'")

def overflow(base, paths):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for scheme in ("light", "dark"):
            ctx = b.new_context(viewport={"width": 375, "height": 800}, color_scheme=scheme)
            pg = ctx.new_page()
            for path in paths:
                pg.goto(base + path)
                sw, iw = pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")
                if sw > iw: errors.append(f"{path}: overflows at 375px {scheme} ({sw} > {iw})")
                small = pg.evaluate("""[...document.querySelectorAll('a,button,input,textarea')].filter(e => {
                    const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).display === 'inline' || e.closest('dialog')) return false;
                    return r.height < 44 && r.width < 44 }).map(e => e.outerHTML.slice(0, 60))""")
                for s in small: errors.append(f"{path}: tap target < 44px: {s}")
            ctx.close()
        b.close()

def lighthouse(base, paths):
    for path in paths:
        out = subprocess.run(["npx", "-y", "lighthouse@12.2.1", base + path, "--quiet", "--output=json", "--output-path=stdout",
                              "--only-categories=performance,accessibility,best-practices,seo",
                              "--chrome-flags=--headless=new"], capture_output=True, text=True)
        try:
            cats = json.loads(out.stdout)["categories"]
        except Exception:
            errors.append(f"{path}: lighthouse did not run ({out.stderr.strip()[-200:]})"); continue
        scores = {k: round(v["score"] * 100) for k, v in cats.items()}
        print(f"  lighthouse {path}: {scores}")
        for k, v in scores.items():
            # seo flags noindex pages by design
            if v < 95 and not (k == "seo" and path in NOINDEX): errors.append(f"{path}: lighthouse {k} {v}")

NOINDEX = {"/404.html"}

if __name__ == "__main__":
    base = serve()
    pages = crawl(base)
    real = [path for path, p in pages if not p.redirect]
    real += [p for p in NOINDEX if p not in real]
    for extra in NOINDEX:
        pg = Page(); pg.feed(open(os.path.join(ROOT, extra.lstrip("/"))).read()); pages.append((extra, pg))
        for ref in pg.refs:
            u = urlparse(urljoin(base + extra, ref))
            if u.netloc == urlparse(base).netloc:
                try: urlopen(base + u.path)
                except HTTPError as e: errors.append(f"broken: {u.path} from {extra} ({e.code})")
    print(f"crawled {len(pages)} pages: {', '.join(sorted(set(real)))}")
    static_checks(pages)
    overflow(base, sorted(set(real)))
    if os.environ.get("LIGHTHOUSE") != "0": lighthouse(base, sorted(set(real)))
    for e in errors: print("FAIL", e)
    print("check: green" if not errors else f"check: {len(errors)} failures")
    sys.exit(1 if errors else 0)
