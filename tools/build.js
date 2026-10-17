#!/usr/bin/env node
// Renders the drawing set from tools/projects.json:
//   work/<slug>/index.html  — chrome regenerated; your writing between
//                             <!-- RYAN:BEGIN --> and <!-- RYAN:END --> is kept
//   index.html              — the log, between <!-- build:log --> markers
//   sitemap.xml
// then lists every RYAN-WRITES slot still on the site.
//
// Run after editing projects.json or a case study:  node tools/build.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const { projects } = JSON.parse(fs.readFileSync(path.join(__dirname, "projects.json"), "utf8"));
const SITE = "https://ryanjmahn.github.io";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const external = (url) => /^https?:/.test(url);
const link = (l) => `<a href="${esc(l.url)}"${external(l.url) ? ' target="_blank" rel="noreferrer"' : ""}>${esc(l.label)}${external(l.url) ? " ↗" : ""}</a>`;
const todo = (lines) => lines.map((t) => `<!-- TODO(ryan): ${t} -->`).join("\n");
const slot = (id, q) => `<!-- RYAN-WRITES: ${id} -->\n<p class="todo">[ryan writes: ${q}]</p>`;
const chip = (s) => (s ? `<span class="chip${s === "building" ? " chip--building" : ""}">${esc(s)}</span>` : "");
// impact figures: the number set large, its label small beneath
const metrics = (nums, attr = "") => nums.length
  ? `<dl class="metrics"${attr}>${nums.map(([fig, label]) => `<div><dt>${esc(label)}</dt><dd>${esc(fig)}</dd></div>`).join("")}</dl>`
  : "";
const stats = (nums) => metrics(nums, ' data-build="numbers"') || '<dl class="metrics" data-build="numbers"></dl>';

// log order: dated sheets newest first, then undated sheets by number, newest first
const log = [...projects].sort((a, b) =>
  a.start && b.start ? b.start.localeCompare(a.start) : a.start ? -1 : b.start ? 1 : b.sheet.localeCompare(a.sheet));

// ---------- shared chrome (keep in step with the hand-written pages) ----------

function head({ title, url, description }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<script>document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}" />` : "<!-- TODO(ryan): meta description -->"}
<link rel="canonical" href="${SITE}${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="ryan ahn" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:url" content="${SITE}${url}" />
<meta property="og:image" content="${SITE}/assets/img/og/home.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:image" content="${SITE}/assets/img/og/home.jpg" />
<meta name="theme-color" content="#F2EFE9" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="preload" href="/assets/fonts/instrument-serif.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/assets/css/site.css" />
</head>`;
}

const NAV = [["work", "/#log"], ["research", "/research/"], ["writing", "/writing/"], ["diary", "/diary/"], ["contact", "/contact/"]];
function topbar(current) {
  const items = NAV.map(([label, href]) => `<a href="${href}"${label === current ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="wrap topbar">
  <a class="topbar__name" href="/">ryan ahn</a>
  <nav class="pills" aria-label="Site">${items}</nav>
  <button class="theme-toggle mono" type="button" aria-label="Switch to dark mode">dark</button>
</header>`;
}

const FOOTER = `<footer class="wrap colophon mono">
  <span>end of entry.</span>
  <span>seoul · last revised oct 2026</span>
</footer>`;

// ---------- case studies ----------

function defaultBlock(p) {
  const fig = p.slug === "openwm" ? truss() : `<figure class="plate row">
  <div class="full plate__frame plate__frame--empty"><span class="mono">FIG-${p.sheet}1 · image pending</span></div>
  <figcaption class="full">${slot("fig-caption", "what's in this figure? (swap the empty frame above for your image)")}</figcaption>
</figure>`;
  const sec = (n, id, h, body) => `<section class="row case__sec" aria-labelledby="${id}">
  <div class="gutter"><p class="mono">§ ${n}</p><h2 class="mix" id="${id}">${h}</h2></div>
  <div class="main">
${body}
  </div>
</section>`;
  return `${fig}
${sec("1", "built", "what i <em>built</em>", slot("what-i-built", "what did you personally build or do? separate your part from the team's."))}
${sec("2", "contribution", "contribution", slot("contribution", "one line: what was yours, what was shared, what was someone else's."))}
${sec("3", "challenges", "challenges", slot("challenges", "what was hard — technically or otherwise — and what did you try?"))}
${sec("4", "learned", "what i <em>learned</em>", slot("what-i-learned", "what do you know now that you didn't before?"))}
${sec("5", "results", "results", `${stats(p.numbers)}\n${slot("results", "numbers, outcomes, traction, acceptances, what happened next.")}`)}
${sec("6", "again", "if i did it <em>again</em>", `${slot("if-i-did-it-again", "(optional — delete this section if you skip it) what would you change?")}`)}`;
}

// fig. 1, as on the home page; worldmodel.js runs it
function truss() {
  return `<!-- fig. 1: run by assets/js/worldmodel.js -->
<figure class="world plate row" id="fig-1"><div class="full">
  <div class="world__stage">
    <canvas class="world__field" aria-hidden="true"></canvas>
    <div class="sheet" aria-hidden="true">
      <div class="sheet__id">DWG-<span class="sheet__no">002</span></div>
      <div class="sheet__title"><span class="sheet__kind">pratt</span> truss · <span class="sheet__bays">8</span> bays</div>
      <ol class="sheet__steps">
        <li data-step="draft">draft</li><li data-step="model">model</li><li data-step="simulate">simulate</li><li data-step="next">next</li>
      </ol>
      <dl class="sheet__read">
        <dt>depth</dt><dd class="sheet__depth">—</dd>
        <dt>sag</dt><dd class="sheet__sag">—</dd>
        <dt>miss</dt><dd class="sheet__miss">—</dd>
      </dl>
    </div>
  </div>
  <figcaption>fig. 1 — a world model at the drafting table. it guesses how each truss bends (squares) before the simulator solves it (line), then learns from the miss. last miss <span class="world__err">0</span> mm<span class="world__hint"> · click to redesign</span></figcaption>
</div></figure>`;
}

function titleblock(p) {
  const cells = [
    ["sheet", esc(p.sheet)],
    ["dates", p.dates && esc(p.dates)],
    ["role", p.role && esc(p.role)],
    ["team", p.team.length ? esc(p.team.join(", ")) : null],
    ["mentor", p.mentor && esc(p.mentor)],
    ["status", p.status && chip(p.status)],
    ["category", esc(p.category)],
    ["stack", p.stack.length ? esc(p.stack.join(" · ")) : null],
    ...p.facts.map((f) => [f.label, f.value]), // values are trusted HTML from projects.json
  ].filter(([, v]) => v);
  return `<dl class="titleblock">\n${cells.map(([k, v]) => `  <div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("\n")}\n</dl>`;
}

function casePage(p, i, block) {
  const prev = log[i + 1], next = log[i - 1]; // the log runs newest first
  const pager = `<nav class="pager mono" aria-label="Sheets">
  ${prev ? `<a href="/work/${prev.slug}/">← previous sheet<span>${esc(prev.title)}</span></a>` : ""}
  ${next ? `<a class="pager__next" href="/work/${next.slug}/">next sheet →<span>${esc(next.title)}</span></a>` : ""}
</nav>`;
  const receipts = p.links.length
    ? `<ul class="receipts">${p.links.map((l) => `<li>${link(l)}</li>`).join("")}</ul>`
    : `<p class="mono">none yet</p>`;
  return `${head({ title: `${p.title} — ryan ahn`, url: `/work/${p.slug}/` })}
<body data-page="work">
${topbar("work")}

<main id="main" class="wrap">
${todo(p.todo)}
<header class="case__head">
  <p class="mono">sheet ${esc(p.sheet)} ${chip(p.status)}</p>
  <h1 class="case__title">${esc(p.title)}</h1>
  ${titleblock(p)}
</header>

<div class="case__body">
<!-- RYAN:BEGIN — everything from here to RYAN:END is yours; tools/build.js never rewrites it -->
${block}
<!-- RYAN:END -->

<section class="row case__sec" aria-labelledby="receipts">
  <div class="gutter"><p class="mono">§ 7</p><h2 class="mix" id="receipts">receipts</h2></div>
  <div class="main">${receipts}</div>
</section>
</div>

${pager}
</main>

${FOOTER}

<script src="/assets/js/site.js" defer></script>
${p.slug === "openwm" ? '<script src="/assets/js/worldmodel.js" defer></script>\n' : ""}</body>
</html>
`;
}

log.forEach((p, i) => {
  const file = path.join(root, "work", p.slug, "index.html");
  const old = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const kept = old.match(/<!-- RYAN:BEGIN[^>]*-->\n([\s\S]*?)\n<!-- RYAN:END -->/);
  // the stat row inside your block follows numbers in projects.json
  const block = (kept ? kept[1] : defaultBlock(p)).replace(/<(ul|dl) class="(?:stats|metrics)" data-build="numbers">[\s\S]*?<\/\1>/, stats(p.numbers));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, casePage(p, i, block));
});

// ---------- the home log ----------

// a catalogue: roman numerals for sheets and years, the way a museum numbers its holdings
const roman = (n) => [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]]
  .reduce((out, [v, r]) => { while (n >= v) { out += r; n -= v; } return out; }, "");

// what i've built: concise rows grouped as current, startups, communities,
// research, newest first in each; real logos where there are any, a plain
// paper mark where there aren't, the impact figures inline and in ink
const GROUPS = [
  ["current", (p) => p.now],
  ["startups", (p) => !p.now && p.category === "company"],
  ["communities", (p) => p.category === "community"],
  ["research", (p) => p.category === "research"],
];
const PAPER = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 2.75h8.5L19 7.25v14H6z M14.5 2.75v4.5H19 M9 11.5h7 M9 14.5h7 M9 17.5h4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
// the impact figures in a line (5k+, 130, $200k, 10%…) set in ink; only
// text between tags is touched, never the wording or the links' markup
const boldFigures = (html) => html.replace(/>[^<]*</g, (t) =>
  t.replace(/(\$?\d[\d.,]*(?:k\+?|\+|%)|(?<![\w-])\d{2,3}(?![\w%+k]))/g, "<b>$1</b>"));
const item = (p) => {
  const marks = p.logos && p.logos.length
    ? p.logos.map(([name, src]) => `<img src="${src}" alt="" width="28" height="28" loading="lazy" title="${esc(name)}" />`).join("")
    : `<span class="item__mark">${PAPER}</span>`;
  const line = p.oneliner
    ? boldFigures(`>${p.oneliner}<`).slice(1, -1)
    : null;
  return `<li class="item${p.now ? " item--now" : ""}">
  <span class="item__logos">${marks}</span>
  <p class="item__line">${line ?? (p.now ? slot("now", "one line — what are you building at openwm right now?") : slot("one-liner", `one line on ${esc(p.title)}.`))} <a class="item__go" href="/work/${p.slug}/" aria-label="${esc(p.title)}: the full sheet">→</a></p>
</li>`;
};
const rows = GROUPS.map(([label, has]) => {
  const items = log.filter(has);
  return items.length ? `<section class="built__group" aria-label="${label}">
  <h3 class="built__label">${label}</h3>
  <ul class="built__list">
${items.map(item).join("\n")}
  </ul>
</section>` : "";
}).filter(Boolean);
const home = path.join(root, "index.html");
const html = fs.readFileSync(home, "utf8");
const LOG = /(<!-- build:log -->)[\s\S]*?(\n[ \t]*<!-- \/build:log -->)/;
if (!LOG.test(html)) throw new Error("index.html is missing the <!-- build:log --> markers");
fs.writeFileSync(home, html.replace(LOG, (_, a, b) => a + "\n" + rows.join("\n") + b));

// ---------- sitemap ----------

const pages = ["/", ...log.map((p) => `/work/${p.slug}/`), "/research/", "/writing/", "/diary/", "/contact/"];
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);

// ---------- cache-busting ----------
// every page asks for /assets/css|js/<file>?v=<hash of its contents>, so a
// browser never pairs new HTML with a stale stylesheet or script
const crypto = require("crypto");
const version = (rel) => crypto.createHash("sha1").update(fs.readFileSync(path.join(root, rel))).digest("hex").slice(0, 8);
(function stamp(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (!/^(\.git|tools|assets|screenshots|node_modules)$/.test(f.name)) stamp(p); }
    else if (f.name.endsWith(".html")) {
      const html = fs.readFileSync(p, "utf8");
      const out = html.replace(/(["'])\/(assets\/(?:css|js)\/[\w.-]+\.(?:css|js))(?:\?v=\w+)?\1/g, (_, q, rel) => `${q}/${rel}?v=${version(rel)}${q}`);
      if (out !== html) fs.writeFileSync(p, out);
    }
  }
})(root);

// ---------- what's left for you to write ----------

const slots = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (!/^(\.git|tools|assets|screenshots|node_modules)$/.test(f.name)) walk(p); }
    else if (f.name.endsWith(".html")) {
      for (const m of fs.readFileSync(p, "utf8").matchAll(/<!-- RYAN-WRITES: ([\w-]+) -->/g)) slots.push(`${path.relative(root, p)}: ${m[1]}`);
    }
  }
})(root);
if (slots.length) console.warn(`${slots.length} RYAN-WRITES slots left:\n  ` + slots.join("\n  "));
else console.log("no RYAN-WRITES slots left");
