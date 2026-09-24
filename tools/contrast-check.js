// Pixel-based contrast check (build prompt v3, A6). Serve the site on
// :8765 (python3 -m http.server 8765), then:
//   npm i puppeteer-core && node tools/contrast-check.js /tmp/cc && python3 tools/contrast-check.py /tmp/cc
// axe/Lighthouse skip text over gradients and images ("needs review");
// this measures every text box against the pixels actually behind it.
//
// For every visible text element: record its box, colour and size, then
// hide all text and screenshot, so the pixels behind each box can be measured.
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const out = process.argv[2];
const pages = ["/", "/built/", "/initiatives/", "/research/", "/contact/", "/diary.html", "/404.html"];
(async () => {
  const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
  const results = [];
  for (const w of [1440, 390]) for (const v of "abc") for (const path of pages) {
    if (v !== "a" && !["/", "/built/", "/initiatives/", "/research/"].includes(path)) continue;
    const p = await b.newPage(); await p.setViewport({ width: w, height: w < 600 ? 844 : 900 });
    await p.evaluateOnNewDocument(s => sessionStorage.setItem("plates", s), JSON.stringify({ "001": v, "002": v, "003": v, "004": v, "005": v }));
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await p.goto("http://localhost:8765" + path, { waitUntil: "networkidle0" });
    await p.evaluate(() => document.querySelectorAll(".reveal").forEach(e => e.classList.add("is-visible")));
    await new Promise(r => setTimeout(r, 400));
    const items = await p.evaluate(() => {
      const res = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const t = walker.currentNode; const el = t.parentElement;
        if (!t.textContent.trim() || seen.has(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || el.closest(".sr-only,.skip-link,[aria-hidden=true],noscript,script,style,svg")) continue;
        if (el.closest(".site-nav__links") && getComputedStyle(el.closest(".site-nav__links")).display === "none") continue;
        const range = document.createRange(); range.selectNodeContents(t);
        const r = range.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
        seen.add(el);
        res.push({ text: t.textContent.trim().slice(0, 40), sel: el.tagName.toLowerCase() + "." + [...el.classList].join(".") + (el.closest(".plate") ? " @" + [...el.closest(".plate").classList].filter(c => /paper|dark/.test(c)).join("") : ""),
          x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, color: cs.color, size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight), shadow: cs.textShadow !== "none" });
      }
      return res;
    });
    await p.addStyleTag({ content: "*,*::before,*::after{color:transparent!important;-webkit-text-stroke:0!important} .grain-global,.local-grain{display:none!important}" });
    await new Promise(r => setTimeout(r, 200));
    const name = `${out}/${path.replace(/\W/g, "_")}-${w}-${v}.png`;
    await p.screenshot({ path: name, fullPage: true });
    results.push({ path, w, v, shot: name, items });
    await p.close();
  }
  fs.writeFileSync(out + "/items.json", JSON.stringify(results));
  await b.close();
})();
