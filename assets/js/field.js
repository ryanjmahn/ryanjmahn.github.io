// field.js — the dither field behind the page, after openwm, in grey.
// Big tilted slabs sit behind the cards (the portrait, fig. 1, the diary),
// their edges fraying into square pixels in three tones through a 4×4
// Bayer matrix; faded blocks and loose dot clusters fill the margins. The
// fraying edge shimmers slowly. Forms are anchored to the elements they sit
// behind, so the field follows the layout. Decorative: aria-hidden, no
// pointer events, a still frame under reduced motion, paused off screen.

(function field() {
  var canvas = document.querySelector(".field");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CELL = 4;                         // css px per pixel, gap included
  var TONES = [0, .07, .15, .3];        // ink alpha for levels 0..3
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var FPS = 10;

  var w = 0, h = 0, dpr = 1, forms = [];
  var ink = "#000", paper = "#fff";

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue("--ink").trim() || ink;
    paper = cs.getPropertyValue("--paper").trim() || paper;
  }

  function level(v, gx, gy) {
    var q = Math.min(2.999, Math.max(0, v) * 3), base = Math.floor(q);
    return base + (q - base > (BAYER[(gy & 3) * 4 + (gx & 3)] + .5) / 16 ? 1 : 0);
  }

  // where an element sits on the page, in css px from the document's corner
  function box(sel) {
    var el = document.querySelector(sel);
    if (!el) return null;
    var r = el.getBoundingClientRect(), top = r.top + window.scrollY, left = r.left + window.scrollX;
    return { l: left, t: top, r: left + r.width, b: top + r.height, w: r.width, h: r.height };
  }

  // slabs peek out from behind the cards into the right margin; blocks and
  // dots only go where the margin has room, so no text sits on the field
  function layout() {
    forms = [];
    var p = box(".portrait__stage"), f = box(".world__stage"), d = box(".posts");
    var ref = f || d || p, margin = ref ? w - ref.r : 0, wide = margin > 140;
    if (p) {
      forms.push({ kind: "slab", cx: p.r + (wide ? p.w * .2 : -p.w * .2), cy: p.t + p.h * .3, W: p.w * (wide ? 1.45 : 1.05), H: p.w * (wide ? .9 : .6), a: -.5, edge: wide ? 34 : 20 });
      forms.push({ kind: "dots", x: p.l + p.w * .45, y: p.b + 52, W: 90, H: 26 });
    }
    if (f) {
      forms.push({ kind: "slab", cx: f.r + (wide ? 34 : -40), cy: f.t + f.h * .32, W: f.w * (wide ? .42 : .3), H: f.h * .78, a: -.5, edge: 28 });
      if (wide) forms.push({ kind: "block", x: f.l - 130, y: f.t + f.h * .25, W: 100, H: f.h * .55, v: .45 });
    }
    if (d && wide) {
      forms.push({ kind: "block", x: d.r + 26, y: d.t - 10, W: Math.min(130, margin - 50), H: d.h + 30, v: .5 });
      forms.push({ kind: "dots", x: d.r + 30, y: d.b + 34, W: 90, H: 30 });
    }
    if (p && wide) forms.push({ kind: "block", x: p.r + 30, y: p.b + 150, W: Math.min(140, margin - 50), H: 150, v: .45 });
  }

  // a slow, smooth wobble for the fraying edge
  function wobble(x, y, t) {
    return Math.sin(x * .045 + t * .7) * Math.sin(y * .06 - t * .5) + Math.sin((x + y) * .021 + t * .3) * .5;
  }

  function slab(s, t) {
    var cos = Math.cos(s.a), sin = Math.sin(s.a), hw = s.W / 2, hh = s.H / 2, E = s.edge;
    var inset = 10;
    // the solid body: one polygon, inset so the dithered band covers its rim
    ctx.save();
    ctx.translate(s.cx, s.cy);
    ctx.rotate(s.a);
    ctx.globalAlpha = TONES[3];
    ctx.fillStyle = ink;
    ctx.fillRect(-hw + inset, -hh + inset, s.W - inset * 2, s.H - inset * 2);
    // a faint diagonal ruling across the body, and one long feature line
    ctx.beginPath();
    ctx.rect(-hw + inset, -hh + inset, s.W - inset * 2, s.H - inset * 2);
    ctx.clip();
    ctx.globalAlpha = .1;
    ctx.strokeStyle = paper;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var k = -s.W - s.H; k < s.W + s.H; k += 22) { ctx.moveTo(k - hh, -hh); ctx.lineTo(k + hh, hh); }
    ctx.stroke();
    ctx.globalAlpha = .55;
    ctx.beginPath();
    ctx.moveTo(-hw * .35, hh * .45); ctx.lineTo(hw * .25, hh * .05);
    ctx.stroke();
    ctx.restore();

    // the rim, cell by cell: rotate each cell into the slab's frame, take
    // its distance outside the rectangle, and fade with a wobble
    var R = Math.hypot(hw, hh) + E;
    var gx0 = Math.max(0, (s.cx - R) / CELL | 0), gx1 = Math.min(w, s.cx + R) / CELL | 0;
    var gy0 = Math.max(0, (s.cy - R) / CELL | 0), gy1 = Math.min(h, s.cy + R) / CELL | 0;
    var cells = [[], [], [], []];
    for (var gy = gy0; gy <= gy1; gy++) for (var gx = gx0; gx <= gx1; gx++) {
      var x = gx * CELL + CELL / 2 - s.cx, y = gy * CELL + CELL / 2 - s.cy;
      var u = x * cos + y * sin, v = -x * sin + y * cos;
      var sd = Math.max(Math.abs(u) - hw, Math.abs(v) - hh);
      if (sd < -inset || sd > E) continue;
      var val = 1 - (sd + inset) / (E + inset) + wobble(gx * CELL, gy * CELL, t) * .22;
      var lv = level(val, gx, gy);
      if (lv) cells[lv].push(gx, gy);
    }
    paint(cells);
  }

  // a faded block: thin dither, densest in the middle, thinning at its edges
  function block(b) {
    var cells = [[], [], [], []];
    for (var y = 0; y < b.H; y += CELL) for (var x = 0; x < b.W; x += CELL) {
      var ex = Math.min(x, b.W - x) / b.W, ey = Math.min(y, b.H - y) / b.H;
      var gx = (b.x + x) / CELL | 0, gy = (b.y + y) / CELL | 0;
      var lv = level(b.v * Math.min(1, Math.min(ex, ey) * 5), gx, gy);
      if (lv) cells[lv].push(gx, gy);
    }
    paint(cells);
  }

  // a loose cluster: every other cell, some of them
  function dots(c) {
    var cells = [[], [], [], []];
    for (var y = 0; y < c.H; y += CELL * 2) for (var x = 0; x < c.W; x += CELL * 2) {
      var gx = (c.x + x) / CELL | 0, gy = (c.y + y) / CELL | 0;
      if (BAYER[(gy & 3) * 4 + (gx & 3)] < 7) cells[(gx + gy) % 3 ? 1 : 2].push(gx, gy);
    }
    paint(cells);
  }

  function paint(cells) {
    ctx.fillStyle = ink;
    for (var lv = 1; lv <= 3; lv++) {
      ctx.globalAlpha = TONES[lv];
      var c = cells[lv];
      for (var i = 0; i < c.length; i += 2) ctx.fillRect(c[i] * CELL, c[i + 1] * CELL, CELL - 1, CELL - 1);
    }
    ctx.globalAlpha = 1;
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      if (f.kind === "slab") slab(f, t);
      else if (f.kind === "block") block(f);
      else dots(f);
    }
  }

  function resize() {
    // collapse first, so the canvas never props the page open
    canvas.style.height = "0px";
    var nw = document.documentElement.clientWidth, nh = document.documentElement.scrollHeight;
    w = nw; h = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    layout();
    draw(performance.now() / 1000);
  }

  function recolour() { colours(); draw(performance.now() / 1000); }

  colours();
  resize();
  // fonts and images settle the layout after first paint
  window.addEventListener("load", resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(document.body);
  else window.addEventListener("resize", resize);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolour);
  document.addEventListener("themechange", recolour);
  if (reduceMotion) return;

  var last = 0;
  function frame(now) {
    if (!document.hidden && now - last > 1000 / FPS) { last = now; draw(now / 1000); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
