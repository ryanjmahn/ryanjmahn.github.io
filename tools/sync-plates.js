#!/usr/bin/env node
// Rewrites every rotating plate's inset from assets/js/plates.js, so the
// <noscript> fallback (variant a) never drifts from the manifest:
//
//   <div class="plate__inset" data-plate="001" data-sizes="…" data-load="high">
//     <script>plateInset()</script>
//     <noscript><picture>…variant a…</picture></noscript>
//   </div>
//
// Run after editing plates.js:  node tools/sync-plates.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ctx = {
  window: {}, navigator: {},
  document: { readyState: "complete", querySelectorAll: () => [] },
  sessionStorage: { getItem: () => null, setItem() {} },
  localStorage: { getItem: () => null, setItem() {} },
};
ctx.window.matchMedia = () => ({ matches: false });
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "assets/js/plates.js"), "utf8"), ctx);
ctx.matchMedia = ctx.window.matchMedia;
const { PLATES, plateHTML } = ctx.window;

const pages = ["index.html", "built/index.html", "initiatives/index.html", "research/index.html"];
const INSET = /(<div class="plate__inset" data-plate="(\d{3})" data-sizes="([^"]+)" data-load="(\w+)">)[\s\S]*?(\n(\s*)<\/div>)/g;
for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, "utf8");
  let n = 0;
  html = html.replace(INSET, (m, open, num, sizes, load, close, indent) => {
    if (!PLATES[num]) throw new Error(`${page}: no plate ${num} in plates.js`);
    n++;
    const pic = plateHTML(num, 0, { sizes, load });
    return `${open}\n${indent}  <script>plateInset()</script>\n${indent}  <noscript>${pic}</noscript>${close}`;
  });
  fs.writeFileSync(file, html);
  console.log(`${page}: ${n} plate(s)`);
}
