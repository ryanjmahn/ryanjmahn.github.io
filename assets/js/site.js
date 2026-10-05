// site.js — the letterhead's automaton. Shared, byte-identical include on
// every page. Runs rule 110, an elementary cellular automaton, in
// .vitals__trace: each row is one generation of a ring of cells, the
// newest at the bottom, older ones scrolling up and fading out. Decorative
// (aria-hidden in the markup); a single still frame under reduced motion.
// Also runs the light/dark toggle.

// light / dark: follows the system until the toggle is used, then the
// choice is kept in localStorage (read back by the inline script in
// <head>). Canvases redraw on the "themechange" event.
(function theme() {
  var root = document.documentElement;
  var button = document.querySelector(".theme-toggle");
  var label = button && button.querySelector(".theme-toggle__label");
  var meta = document.querySelector('meta[name="theme-color"]');
  var system = window.matchMedia("(prefers-color-scheme: dark)");

  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : system.matches;
  }
  function sync() {
    var dark = isDark();
    if (label) label.textContent = dark ? "light" : "dark";
    if (button) button.setAttribute("aria-label", "Switch to " + (dark ? "light" : "dark") + " mode");
    if (meta) meta.setAttribute("content", dark ? "#0A0A0A" : "#FFFFFF");
  }

  sync();
  system.addEventListener("change", sync);
  if (!button) return;
  button.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    sync();
    document.dispatchEvent(new Event("themechange"));
  });
})();

(function vitals() {
  var canvas = document.querySelector(".vitals__trace");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var genEl = document.querySelector(".vitals__gen");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var RULE = 110;
  var CELL = 4;       // css px per cell, gap included
  var REST = 7;       // generations per second
  var QUICK = 22;     // ... while a link is under the pointer or focus

  var w = 0, h = 0, dpr = 1, cols = 0, rowsN = 0;
  var rows = [];      // oldest first; each an array of 0/1
  var gen = 0, carry = 0;   // carry: 0..1 progress toward the next row
  var rate = REST, target = REST;
  var ink = "#000";

  function colours() {
    ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || ink;
  }

  function next(row) {
    var out = new Array(cols);
    for (var i = 0; i < cols; i++) {
      var l = row[(i - 1 + cols) % cols], c = row[i], r = row[(i + 1) % cols];
      out[i] = (RULE >> (l << 2 | c << 1 | r)) & 1;
    }
    return out;
  }

  function push() {
    rows.push(next(rows[rows.length - 1]));
    if (rows.length > rowsN + 1) rows.shift();
    gen++;
    if (genEl) genEl.textContent = gen.toLocaleString("en-US");
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ink;
    var n = rows.length, size = CELL - 1;
    // the newest row sits on the bottom edge; the rest scroll up smoothly
    var shift = reduceMotion ? 0 : (1 - carry) * CELL;
    for (var k = 0; k < n; k++) {
      var y = h - (n - k) * CELL + shift;
      if (y + size <= 0) continue;
      // older generations fade toward the paper
      ctx.globalAlpha = .06 + .5 * Math.pow((k + 1) / n, 1.8);
      var row = rows[k];
      for (var i = 0; i < cols; i++) {
        if (row[i]) ctx.fillRect(i * CELL, y, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  function seed() {
    var row = new Array(cols);
    for (var i = 0; i < cols; i++) row[i] = Math.random() < .5 ? 1 : 0;
    rows = [row];
    gen = 0;
    // run past the noise of the random start, so the page opens on structure
    for (var g = 0; g < 60; g++) push();
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var nw = Math.max(CELL, Math.round(rect.width)), nh = Math.round(rect.height);
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    cols = Math.floor(w / CELL);
    rowsN = Math.ceil(h / CELL);
    seed();
    draw();
  }

  function recolour() {
    colours();
    draw();
  }

  colours();
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolour);
  document.addEventListener("themechange", recolour);
  if (reduceMotion) return;

  // a link under the pointer or focus quickens the run
  function excite(e) { if (e.target.closest && e.target.closest("a")) target = QUICK; }
  function settle(e) { if (e.target.closest && e.target.closest("a")) target = REST; }
  document.addEventListener("pointerover", excite);
  document.addEventListener("pointerout", settle);
  document.addEventListener("focusin", excite);
  document.addEventListener("focusout", settle);

  var then = 0;
  function frame(now) {
    var dt = Math.min(.05, (now - then) / 1000 || 0);
    then = now;
    rate += (target - rate) * Math.min(1, dt * 3);
    carry += dt * rate;
    while (carry >= 1) { carry -= 1; push(); }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
