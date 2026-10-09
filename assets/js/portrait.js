// portrait.js — fig. 0, the author as a dithered plate. The photo is read
// once onto a grid of square pixels and screened through a 4×4 Bayer
// matrix into three tones of ink (light, mid, dark), so edges fray into
// pixels the way openwm's figures do. On load the plate resolves from the
// top down; under the pointer a lens pushes every pixel one tone darker.
// Darkfield is a positive: there the light parts of the photo get the ink.
// One still frame under reduced motion; idle once settled.

(function portrait() {
  var canvas = document.querySelector(".portrait__cells");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLS = 64;                    // pixels across
  var TONES = [0, .2, .48, .92];    // ink alpha for levels 0..3
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var REVEAL = 1.1;                 // seconds to resolve top to bottom
  var LENS = 34;                    // pointer lens radius, css px

  var size = 0, dpr = 1, pitch = 1;
  var tone = null;                  // darkness per pixel, 0..1, from the photo
  var level = null;                 // dithered level per pixel, 0..3
  var ink = "#000", dark = false;
  var pointer = null, born = 0;

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue("--ink").trim() || ink;
    var theme = document.documentElement.getAttribute("data-theme");
    dark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function read(img) {
    var off = document.createElement("canvas");
    off.width = off.height = COLS;
    var o = off.getContext("2d");
    o.drawImage(img, 0, 0, COLS, COLS);
    var px = o.getImageData(0, 0, COLS, COLS).data;
    tone = new Float32Array(COLS * COLS);
    for (var i = 0; i < tone.length; i++) {
      tone[i] = 1 - (px[i * 4] * .299 + px[i * 4 + 1] * .587 + px[i * 4 + 2] * .114) / 255;
    }
  }

  // screen the photo into levels; a few stray pixels just off the
  // silhouette, so the figure dissolves at its edge rather than stopping
  function screen() {
    level = new Uint8Array(COLS * COLS);
    for (var r = 0; r < COLS; r++) for (var c = 0; c < COLS; c++) {
      var i = r * COLS + c, d = tone[i];
      var t = (BAYER[(r & 3) * 4 + (c & 3)] + .5) / 16;
      if (d < .07) {
        var near = (c && tone[i - 1] >= .07) || (c < COLS - 1 && tone[i + 1] >= .07) ||
                   (r && tone[i - COLS] >= .07) || (r < COLS - 1 && tone[i + COLS] >= .07);
        level[i] = near && t < .3 ? 1 : 0;
        continue;
      }
      if (dark) d = Math.max(.12, 1.02 - d);
      var q = Math.min(2.999, d * 3), base = Math.floor(q);
      level[i] = base + (q - base > t ? 1 : 0);
    }
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = ink;
    var s = Math.max(1, pitch * .78), front = t / REVEAL * (COLS + 8);
    for (var k = 1; k <= 3; k++) {
      // one pass per tone keeps a single alpha per pass
      ctx.globalAlpha = TONES[k];
      for (var r = 0; r < COLS; r++) {
        // the resolving front: rows below it are not drawn yet, rows at it
        // show only their lightest pixels
        var lag = front - r;
        if (lag < 0) break;
        var y = r * pitch;
        for (var c = 0; c < COLS; c++) {
          var i = r * COLS + c, lv = level[i];
          if (pointer) {
            var dx = c * pitch - pointer.x, dy = y - pointer.y;
            if (dx * dx + dy * dy < LENS * LENS && lv) lv = Math.min(3, lv + 1);
          }
          if (lag < 8) lv = Math.min(lv, 1 + (lag / 3 | 0));
          if (lv === k) ctx.fillRect(c * pitch, y, s, s);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function settled() { return (performance.now() - born) / 1000 > REVEAL + .2; }

  var running = false;
  function frame() {
    draw((performance.now() - born) / 1000);
    if (settled() && !pointer) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function resize() {
    var w = Math.round(canvas.getBoundingClientRect().width);
    if (!w || w === size || !tone) return;
    size = w;
    pitch = size / COLS;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.height = size * dpr;
    draw(reduceMotion || settled() ? 99 : 0);
    if (!reduceMotion) start();
  }

  var img = new Image();
  img.onload = function () {
    colours();
    read(img);
    screen();
    born = performance.now();
    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    function recolour() {
      colours();
      screen();
      draw(99);
    }
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolour);
    document.addEventListener("themechange", recolour);
    if (reduceMotion) return;
    function point(e) {
      var rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      start();
    }
    function leave() { pointer = null; draw(99); }
    canvas.addEventListener("pointermove", point);
    canvas.addEventListener("pointerdown", point);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("pointercancel", leave);
    canvas.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") leave(); });
  };
  img.src = canvas.getAttribute("data-src");
})();
