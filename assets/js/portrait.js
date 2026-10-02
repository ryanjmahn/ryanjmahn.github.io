// portrait.js — fig. 0, the author as a tissue section. The photo is read
// once into a hex grid of cells: the darker the photo, the bigger the
// cell. Cells drift in and settle on load, breathe at rest, and move out
// of the pointer's way. One still frame under reduced motion; paused
// while off screen.

(function portrait() {
  var canvas = document.querySelector(".portrait__cells");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLS = 50;       // cells across
  var size = 0, dpr = 1, pitch = 1;
  var cells = [];
  var tone = null;     // darkness per grid point, 0..1, read from the photo
  var rowsN = 0;
  var pointer = null;
  var eosin = "#f00", nucleus = "#00f", karyon = "#000", dark = false;
  var born = 0;

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    eosin = cs.getPropertyValue("--eosin").trim() || eosin;
    nucleus = cs.getPropertyValue("--nucleus").trim() || nucleus;
    karyon = cs.getPropertyValue("--karyon").trim() || karyon;
    dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // sample the photo on the same hex grid the cells sit on
  function read(img) {
    rowsN = Math.round(COLS / .866);
    var off = document.createElement("canvas");
    off.width = COLS * 2; off.height = rowsN;
    var o = off.getContext("2d");
    o.drawImage(img, 0, 0, off.width, off.height);
    var px = o.getImageData(0, 0, off.width, off.height).data;
    tone = [];
    for (var r = 0; r < rowsN; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = Math.min(off.width - 1, c * 2 + (r % 2));
        var i = (r * off.width + x) * 4;
        tone.push(1 - (px[i] * .299 + px[i + 1] * .587 + px[i + 2] * .114) / 255);
      }
    }
  }

  function build() {
    cells = [];
    pitch = size / COLS;
    for (var r = 0; r < rowsN; r++) {
      for (var c = 0; c < COLS; c++) {
        var d = tone[r * COLS + c];
        if (d < .07) continue; // the white backdrop stays paper
        // darkfield is a positive too: there the light parts of the
        // photo get the big, bright cells
        if (dark) d = Math.max(.1, 1.02 - d);
        var hx = (c + (r % 2 ? .75 : .25)) * pitch, hy = (r + .5) * pitch * .866;
        var a = Math.random() * Math.PI * 2, far = size * (.25 + Math.random() * .6);
        cells.push({
          hx: hx, hy: hy,
          x: reduceMotion ? hx : hx + Math.cos(a) * far,
          y: reduceMotion ? hy : hy + Math.sin(a) * far,
          vx: 0, vy: 0,
          r: pitch * (.2 + .46 * Math.pow(d, .75)),
          d: d,
          ph: Math.random() * Math.PI * 2,
          // settle from the top of the head down
          delay: reduceMotion ? 0 : hy / size * .9 + Math.random() * .35
        });
      }
    }
  }

  function step(dt, t) {
    var reach = pitch * 5.5;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (t < c.delay) continue;
      // home, plus a slow breath so the tissue is never quite still
      var tx = c.hx + Math.cos(t * .7 + c.ph) * pitch * .07;
      var ty = c.hy + Math.sin(t * .9 + c.ph) * pitch * .07;
      var ax = (tx - c.x) * 26, ay = (ty - c.y) * 26;
      if (pointer) {
        var dx = c.x - pointer.x, dy = c.y - pointer.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < reach * reach) {
          var d = Math.sqrt(d2) || .01, f = (1 - d / reach) * 900;
          ax += dx / d * f; ay += dy / d * f;
        }
      }
      c.vx = (c.vx + ax * dt) * .86;
      c.vy = (c.vy + ay * dt) * .86;
      c.x += c.vx * dt * 6;
      c.y += c.vy * dt * 6;
    }
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    var i, c, a;
    // cytoplasm, then nuclei, so each pass keeps one fill style
    ctx.fillStyle = eosin;
    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      a = Math.min(1, Math.max(0, (t - c.delay) * 2.2));
      if (!a) continue;
      ctx.globalAlpha = (.2 + .5 * c.d) * a;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      a = Math.min(1, Math.max(0, (t - c.delay) * 2.2));
      if (!a) continue;
      // dense tissue gets the dark tumor-style nucleus on paper; in
      // darkfield every nucleus glows instead
      ctx.fillStyle = c.d > .6 && !dark ? karyon : nucleus;
      ctx.globalAlpha = (.35 + .6 * c.d) * a;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * (.34 + .3 * c.d), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    var w = Math.round(canvas.getBoundingClientRect().width);
    if (!w || w === size || !tone) return;
    size = w;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.height = size * dpr;
    build();
    born = performance.now();
    draw(reduceMotion ? 99 : 0);
  }

  var visible = true, running = false, then = 0;
  function frame(now) {
    if (!visible) { running = false; return; }
    var dt = Math.min(1 / 30, (now - then) / 1000 || 0);
    then = now;
    var t = (now - born) / 1000;
    step(dt, t);
    draw(t);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduceMotion || !tone) return;
    running = true;
    then = performance.now();
    requestAnimationFrame(frame);
  }

  var img = new Image();
  img.onload = function () {
    colours();
    read(img);
    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      colours();
      build();
      born = performance.now();
      draw(reduceMotion ? 99 : 0);
    });
    if (reduceMotion) return;
    function point(e) {
      var rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    canvas.addEventListener("pointermove", point);
    canvas.addEventListener("pointerdown", point);
    canvas.addEventListener("pointerleave", function () { pointer = null; });
    canvas.addEventListener("pointercancel", function () { pointer = null; });
    canvas.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") pointer = null; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(canvas);
    }
    start();
  };
  img.src = canvas.getAttribute("data-src");
})();
