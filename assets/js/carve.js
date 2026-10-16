// carve.js — the statue plates, each cut from a rough block. The photo (a
// cut-out with alpha) is read onto a grid of square pixels and screened
// through a 4×4 Bayer matrix into three tones of ink, like the portrait.
// Cells off the figure are chipped away from the outside in, then the
// figure's surface resolves from flat stone to its real light and shade.
// data-carve="scroll" (the home page): the page's scroll drives it.
// data-carve="load": it carves itself once it's in view. Dragging across a
// plate carves by hand; chips fall as they come off. Finished, and still,
// under reduced motion.

(function carve() {
  var all = document.querySelectorAll(".carve__cells");
  for (var n = 0; n < all.length; n++) plate(all[n]);

  function plate(canvas) {
    if (!canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var fig = canvas.closest(".carve");
    // a scene (the home page's opening) holds its own readout, and hears --p
    var scene = canvas.closest("[data-scene]");
    var scope = scene || fig;
    var pctEl = scope.querySelector(".carve__pct");
    var steps = scope.querySelectorAll(".carve__steps li");
    // "scroll": carved as the page scrolls (home); "load": carves itself once in view
    var onLoad = canvas.getAttribute("data-carve") === "load";
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var COLS = +canvas.getAttribute("data-cols") || 132; // pixels across
    var TONES = [0, .22, .5, .92];        // ink alpha for levels 0..3
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    var STAGES = [0, .3, .62, .97];       // block, roughed, carved, finished
    var CHISEL = 3.2;                     // hand-carving radius, in cells
    var MAX_CHIPS = 700;

    var rows = 0, w = 0, h = 0, dpr = 1, pitch = 1;
    var inside, tone, rough, cut, finish; // per cell
    var level;                            // screened levels for the finished figure
    var p = 0, goal = 0;                  // carving progress 0..1, shown and wanted
    var chips = [];
    var ink = "#000", dark = false;
    var running = false, then = 0, dragging = false;

    function colours() {
      var cs = getComputedStyle(document.documentElement);
      ink = cs.getPropertyValue("--ink").trim() || ink;
      var theme = document.documentElement.getAttribute("data-theme");
      dark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

    function read(img) {
      rows = Math.round(COLS * img.height / img.width);
      var off = document.createElement("canvas");
      off.width = COLS; off.height = rows;
      var o = off.getContext("2d");
      o.drawImage(img, 0, 0, COLS, rows);
      var px = o.getImageData(0, 0, COLS, rows).data, n = COLS * rows;
      inside = new Uint8Array(n); tone = new Float32Array(n);
      rough = new Float32Array(n); cut = new Float32Array(n); finish = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        inside[i] = px[i * 4 + 3] > 127 ? 1 : 0;
        tone[i] = px[i * 4] / 255;      // the cut-out is greyscale: brightness
      }

      // distance from the figure, two-pass chamfer, for the outside-in order
      var d = new Float32Array(n), BIG = 1e6, r, c, k, dmax = 1;
      for (k = 0; k < n; k++) d[k] = inside[k] ? 0 : BIG;
      for (r = 0; r < rows; r++) for (c = 0; c < COLS; c++) {
        k = r * COLS + c;
        if (c) d[k] = Math.min(d[k], d[k - 1] + 1);
        if (r) d[k] = Math.min(d[k], d[k - COLS] + 1, c ? d[k - COLS - 1] + 1.41 : BIG, c < COLS - 1 ? d[k - COLS + 1] + 1.41 : BIG);
      }
      for (r = rows - 1; r >= 0; r--) for (c = COLS - 1; c >= 0; c--) {
        k = r * COLS + c;
        if (c < COLS - 1) d[k] = Math.min(d[k], d[k + 1] + 1);
        if (r < rows - 1) d[k] = Math.min(d[k], d[k + COLS] + 1, c < COLS - 1 ? d[k + COLS + 1] + 1.41 : BIG, c ? d[k + COLS - 1] + 1.41 : BIG);
      }
      for (k = 0; k < n; k++) if (d[k] > dmax && d[k] < BIG) dmax = d[k];

      for (r = 0; r < rows; r++) for (c = 0; c < COLS; c++) {
        k = r * COLS + c;
        var j = hash(k), j2 = hash(k + 7919);
        // the stone's own grain, and the moment each cell leaves or resolves
        // the figure shows faintly in the stone from the start
        rough[k] = .24 + .14 * j + .05 * Math.sin(r * .35 + c * .12) + (inside[k] ? .16 : 0);
        cut[k] = inside[k] ? 2 : .04 + .62 * Math.pow(1 - d[k] / dmax, 2.2) + (j2 - .5) * .12;
        finish[k] = inside[k] ? .42 + .36 * j2 + .18 * (r / rows) : 2;
        // the block comes from the quarry with rough edges, not a ruled square
        var edge = Math.min(r, c, rows - 1 - r, COLS - 1 - c);
        if (!inside[k] && edge < 1.5 + 5 * hash(k + 4241) * (.6 + .4 * Math.sin(r * .21 + c * .17))) cut[k] = .02;
      }
    }

    // the finished figure: on paper the marble's shadows take the ink; in
    // darkfield it's a positive and the lit marble does
    function screen() {
      level = new Uint8Array(COLS * rows);
      for (var r = 0; r < rows; r++) for (var c = 0; c < COLS; c++) {
        var k = r * COLS + c;
        if (!inside[k]) continue;
        var v = dark ? .08 + Math.pow(tone[k], 1.4) * .95 : Math.min(1, .1 + Math.pow(1 - tone[k], .85) * 1.15);
        level[k] = q(v, r, c);
      }
    }
    function q(v, r, c) {
      var t = (BAYER[(r & 3) * 4 + (c & 3)] + .5) / 16;
      var x = Math.min(2.999, Math.max(0, v) * 3), base = Math.floor(x);
      return base + (x - base > t ? 1 : 0);
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;
      var s = Math.max(1, pitch * .8);
      for (var lv = 1; lv <= 3; lv++) {
        ctx.globalAlpha = TONES[lv];
        for (var r = 0; r < rows; r++) {
          var y = r * pitch;
          for (var c = 0; c < COLS; c++) {
            var k = r * COLS + c, l;
            if (inside[k]) l = p >= finish[k] ? level[k] : q(rough[k] + .12 * (p - finish[k] + .4), r, c);
            else if (p < cut[k]) l = q(rough[k], r, c);
            else continue;
            if (l === lv) ctx.fillRect(c * pitch, y, s, s);
          }
        }
      }
      ctx.globalAlpha = .55;
      for (var i = 0; i < chips.length; i++) ctx.fillRect(chips[i].x, chips[i].y, s, s);
      ctx.globalAlpha = 1;
      readout();
    }

    function readout() {
      if (pctEl) pctEl.textContent = Math.round(p * 100);
      if (scene) scene.style.setProperty("--p", p.toFixed(3));
      for (var i = 0; i < steps.length; i++) {
        steps[i].classList.toggle("is-done", p >= STAGES[i + 1]);
        steps[i].classList.toggle("is-on", p >= STAGES[i] && !(p >= STAGES[i + 1]));
      }
    }

    function chip(c, r) {
      if (chips.length >= MAX_CHIPS) return;
      chips.push({ x: c * pitch, y: r * pitch, vx: (Math.random() - .5) * 60, vy: -Math.random() * 50, life: 1.4 + Math.random() });
    }

    // cells crossing their cut line between two progress values throw a chip
    function shed(from, to) {
      if (reduceMotion || to <= from) return;
      for (var k = 0, n = COLS * rows; k < n; k++) {
        if (!inside[k] && cut[k] > from && cut[k] <= to && hash(k + 101) < .4) chip(k % COLS, (k / COLS) | 0);
      }
    }

    // how far along the carving should be: through the scene while it's
    // pinned (finished a little before the scene lets go), else through the
    // plate's own pass across the screen
    function wanted() {
      if (onLoad) return 1;
      var raw;
      if (scene) {
        var s = scene.getBoundingClientRect();
        raw = -s.top / Math.max(1, s.height - innerHeight) / .85;
      } else {
        var rect = canvas.getBoundingClientRect();
        raw = (innerHeight - rect.top) / (innerHeight + rect.height) * 1.3;
      }
      return Math.max(.04, Math.min(1, raw));
    }

    function frame(now) {
      var dt = Math.min(.05, (now - then) / 1000 || 0);
      then = now;
      var before = p;
      p += (goal - p) * Math.min(1, dt * (onLoad ? 1.1 : 4));
      if (Math.abs(goal - p) < .003) p = goal;
      shed(before, p);
      for (var i = chips.length - 1; i >= 0; i--) {
        var o = chips[i];
        o.vy += 900 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt;
        if (o.life <= 0 || o.y > h) chips.splice(i, 1);
      }
      draw();
      if (p === goal && !chips.length && !dragging) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      then = performance.now();
      requestAnimationFrame(frame);
    }

    function resize() {
      var nw = Math.round(canvas.getBoundingClientRect().width);
      if (!nw || nw === w || !inside) return;
      w = nw; pitch = w / COLS; h = Math.round(pitch * rows);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.height = h + "px";
      chips = [];
      draw();
    }

    // dragging across the block takes the stone off by hand
    function carveAt(e) {
      var rect = canvas.getBoundingClientRect();
      var cx = (e.clientX - rect.left) / pitch, cy = (e.clientY - rect.top) / pitch;
      var R = CHISEL, r0 = Math.max(0, cy - R | 0), r1 = Math.min(rows - 1, cy + R | 0);
      var c0 = Math.max(0, cx - R | 0), c1 = Math.min(COLS - 1, cx + R | 0);
      for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
        var dx = c - cx, dy = r - cy;
        if (dx * dx + dy * dy > R * R) continue;
        var k = r * COLS + c;
        if (inside[k]) { if (finish[k] > p) finish[k] = p; }
        else if (cut[k] > p) { cut[k] = -1; chip(c, r); }
      }
      start();
    }

    var img = new Image();
    img.onload = function () {
      colours();
      read(img);
      screen();
      if (reduceMotion) p = goal = 1;
      resize();
      if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
      else window.addEventListener("resize", resize);
      function recolour() { colours(); screen(); draw(); }
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolour);
      document.addEventListener("themechange", recolour);
      if (reduceMotion) return;

      if (onLoad && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (e) {
          if (e[0].isIntersecting) { io.disconnect(); goal = 1; start(); }
        }, { threshold: .25 });
        io.observe(canvas);
      } else {
        goal = wanted();
        start();
        if (!onLoad) window.addEventListener("scroll", function () { goal = wanted(); start(); }, { passive: true });
      }
      canvas.addEventListener("pointerdown", function (e) { dragging = true; carveAt(e); });
      canvas.addEventListener("pointermove", function (e) { if (dragging) carveAt(e); });
      function stop() { dragging = false; }
      canvas.addEventListener("pointerup", stop);
      canvas.addEventListener("pointerleave", stop);
      canvas.addEventListener("pointercancel", stop);
    };
    img.src = canvas.getAttribute("data-src");
  }
})();
