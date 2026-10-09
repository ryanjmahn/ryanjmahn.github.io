// worldmodel.js — fig. 1, a world model at the drafting table. A steel
// Warren truss is drawn as a blueprint. Each run proposes a design (depth,
// bays, where the load hangs). A cheap model guesses at once how it will
// bend; then a real simulation, a stiffness solve stepped one conjugate-
// gradient iteration at a time, works out what actually happens. The model
// is scored against the simulation and learns from the gap before the next
// design. Fixed meanings, shared with the rest of the page: round = the real
// thing (here, the simulator), square = what a model computes. Decorative
// canvas; the caption carries the meaning. A still frame under reduced motion.

(function worldmodel() {
  var canvas = document.querySelector(".world__field");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var errEl = document.querySelector(".world__err");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SPAN = 24;       // m
  var EA = 8e8;        // N, steel members of ~40 cm²
  var LOAD = 180e3;    // N, hung from one deck node
  var EXAG = 50;       // deflections are drawn this many times larger
  var ITER_DT = .045;  // seconds per solver iteration on screen
  var RATE = .35;      // how far the model moves toward each run's best fit
  var PRIOR = [.5, 0];  // the model starts out thinking the truss is stiffer than it is, and ignores shear
  var FONT = '11px "Departure Mono", ui-monospace, Menlo, monospace';

  var w = 0, h = 0, dpr = 1, scale = 1, x0 = 0, deckY = 0;
  var ink = "#000", ink2 = "#777", grid = "rgba(0,0,0,.05)";
  var coef = PRIOR.slice(), runNo = 0, errs = [], lastLoad = -1, shownErr = "";
  var run = null;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function ease(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue("--ink").trim() || ink;
    ink2 = cs.getPropertyValue("--ink-2").trim() || ink2;
    grid = cs.getPropertyValue("--grid").trim() || grid;
  }

  // ---------- the design: a Warren or a Pratt truss, pinned left, on a roller right ----------

  function truss(kind, bays, depth) {
    var p = SPAN / bays, nodes = [], bars = [], i;
    for (i = 0; i <= bays; i++) nodes.push({ x: i * p, y: 0 }); // deck, 0..bays
    var top = function (i) { return bays + 1 + i; };
    if (kind === "warren") {
      for (i = 0; i < bays; i++) nodes.push({ x: (i + .5) * p, y: depth });
      for (i = 0; i < bays; i++) {
        bars.push([i, i + 1], [i, top(i)], [top(i), i + 1]);
        if (i) bars.push([top(i - 1), top(i)]);
      }
    } else {
      // pratt: verticals, with diagonals running down toward midspan
      for (i = 1; i < bays; i++) nodes.push({ x: i * p, y: depth });
      top = function (i) { return bays + i; };
      for (i = 0; i < bays; i++) bars.push([i, i + 1]);
      for (i = 1; i < bays; i++) bars.push([i, top(i)]);
      for (i = 1; i < bays - 1; i++) bars.push([top(i), top(i + 1)]);
      bars.push([0, top(1)], [bays, top(bays - 1)]);
      for (i = 1; i < bays - 1; i++) bars.push(i < bays / 2 ? [top(i), i + 1] : [top(i + 1), i]);
    }
    return { kind: kind, bays: bays, depth: depth, nodes: nodes, bars: bars, fixed: [0, 1, bays * 2 + 1] };
  }

  // ---------- the simulation: K u = f, by preconditioned conjugate gradients ----------

  function stiffness(t) {
    var n = t.nodes.length * 2, K = [], i, j;
    for (i = 0; i < n; i++) { K.push(new Float64Array(n)); }
    t.bars.forEach(function (b) {
      var a = t.nodes[b[0]], c = t.nodes[b[1]];
      var dx = c.x - a.x, dy = c.y - a.y, l = Math.hypot(dx, dy);
      var cx = dx / l, cy = dy / l, k = EA / l;
      var m = [cx * cx, cx * cy, cx * cy, cy * cy], d = [b[0] * 2, b[1] * 2];
      for (var p = 0; p < 2; p++) for (var q = 0; q < 2; q++) {
        var s = (p === q ? 1 : -1) * k;
        for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) K[d[p] + i][d[q] + j] += s * m[i * 2 + j];
      }
    });
    t.fixed.forEach(function (f) {
      for (i = 0; i < n; i++) { K[f][i] = 0; K[i][f] = 0; }
      K[f][f] = 1;
    });
    return K;
  }

  function mul(K, v) {
    var n = v.length, out = new Float64Array(n);
    for (var i = 0; i < n; i++) { var s = 0, row = K[i]; for (var j = 0; j < n; j++) s += row[j] * v[j]; out[i] = s; }
    return out;
  }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  function solver(t, load) {
    var K = stiffness(t), n = K.length;
    var f = new Float64Array(n); f[load * 2 + 1] = -LOAD;
    var u = new Float64Array(n), r = f.slice(), z = new Float64Array(n);
    for (var i = 0; i < n; i++) z[i] = r[i] / K[i][i];
    var dir = z.slice(), rz = dot(r, z), f0 = Math.sqrt(dot(f, f));
    var s = { u: u, iter: 0, done: false };
    s.step = function () {
      if (s.done) return;
      var Kp = mul(K, dir), a = rz / dot(dir, Kp);
      for (var i = 0; i < n; i++) { u[i] += a * dir[i]; r[i] -= a * Kp[i]; }
      s.iter++;
      if (Math.sqrt(dot(r, r)) < 1e-9 * f0 || s.iter > n * 3) { s.done = true; return; }
      for (i = 0; i < n; i++) z[i] = r[i] / K[i][i];
      var rz2 = dot(r, z), beta = rz2 / rz;
      rz = rz2;
      for (i = 0; i < n; i++) dir[i] = z[i] + beta * dir[i];
    };
    return s;
  }

  // ---------- the model: beam theory with two learned compliances ----------
  // feature 1 bends the truss like a beam (chords as flanges, plane sections),
  // feature 2 shears it (the diagonals stretching). prediction = c1·f1 + c2·f2.
  // the shear term assumes Warren-style diagonals, so a Pratt never quite fits.

  function features(t, load) {
    var a = t.nodes[load].x, b = SPAN - a, L = SPAN, P = LOAD, H = t.depth;
    var EI = EA * H * H / 2;
    var th = Math.atan2(H, SPAN / t.bays / 2), GA = EA * Math.pow(Math.sin(th), 2) * Math.cos(th);
    function defl(x) {
      return x <= a ? P * b * x * (L * L - b * b - x * x) / (6 * L * EI)
                    : P * a * (L - x) * (L * L - a * a - (L - x) * (L - x)) / (6 * L * EI);
    }
    function slope(x) {
      return x <= a ? P * b * (L * L - b * b - 3 * x * x) / (6 * L * EI)
                    : -P * a * (L * L - a * a - 3 * (L - x) * (L - x)) / (6 * L * EI);
    }
    function shear(x) { return x <= a ? P * (b / L) * x / GA : P * (a / L) * (L - x) / GA; }
    var n = t.nodes.length * 2, f1 = new Float64Array(n), f2 = new Float64Array(n), s0 = slope(0);
    t.nodes.forEach(function (nd, i) {
      var z = nd.y - H / 2;
      f1[i * 2] = H / 2 * s0 + z * slope(nd.x);
      f1[i * 2 + 1] = -defl(nd.x);
      f2[i * 2 + 1] = -shear(nd.x);
    });
    return [f1, f2];
  }

  function predict(F, c) {
    var out = new Float64Array(F[0].length);
    for (var i = 0; i < out.length; i++) out[i] = c[0] * F[0][i] + c[1] * F[1][i];
    return out;
  }

  // least squares for (c1, c2) on this run, then a step toward it
  function learn(F, u) {
    var a = dot(F[0], F[0]), b = dot(F[0], F[1]), d = dot(F[1], F[1]);
    var p = dot(F[0], u), q = dot(F[1], u), det = a * d - b * b;
    if (Math.abs(det) < 1e-30) return;
    var fit = [(p * d - b * q) / det, (a * q - b * p) / det];
    coef[0] += RATE * (fit[0] - coef[0]);
    coef[1] += RATE * (fit[1] - coef[1]);
  }

  function worst(a, b) {
    var m = 0;
    for (var i = 0; i < a.length; i += 2) m = Math.max(m, Math.hypot(a[i] - b[i], a[i + 1] - b[i + 1]));
    return m;
  }

  // ---------- a run: guess, simulate, compare, learn ----------

  function newRun(kind, bays, depth, load) {
    if (kind == null) kind = Math.random() < .5 ? "warren" : "pratt";
    if (bays == null) bays = [6, 8, 8, 10][Math.floor(Math.random() * 4)];
    if (depth == null) depth = Math.round(rand(2.2, 4.2) * 10) / 10;
    var t = truss(kind, bays, depth);
    if (load == null) {
      do { load = 1 + Math.floor(Math.random() * (bays - 1)); } while (load === lastLoad && bays > 2);
    }
    lastLoad = load;
    var F = features(t, load), guess = predict(F, coef);
    runNo++;
    run = { no: runNo, t: t, load: load, F: F, guess: guess, from: guess, shown: guess,
            sim: solver(t, load), stage: "guess", clock: 0, tick: 0, err: null };
  }

  function finish() {
    run.err = worst(run.guess, run.sim.u) * 1000;
    errs.push(run.err);
    if (errs.length > 14) errs.shift();
    var e = run.err.toFixed(1);
    if (errEl && e !== shownErr) { errEl.textContent = e; shownErr = e; }
  }

  function advance(dt) {
    run.clock += dt;
    if (run.stage === "guess") {
      if (run.clock > .5) { run.stage = "sim"; run.clock = 0; }
    } else if (run.stage === "sim") {
      run.tick += dt;
      while (run.tick >= ITER_DT && !run.sim.done) { run.tick -= ITER_DT; run.sim.step(); }
      if (run.sim.done) { finish(); run.stage = "compare"; run.clock = 0; }
    } else if (run.stage === "compare") {
      if (run.clock > 1.1) {
        learn(run.F, run.sim.u);
        run.from = run.shown;
        run.next = predict(run.F, coef);
        run.stage = "learn"; run.clock = 0;
      }
    } else if (run.stage === "learn") {
      var k = ease(run.clock / .7), s = new Float64Array(run.next.length);
      for (var i = 0; i < s.length; i++) s[i] = run.from[i] + (run.next[i] - run.from[i]) * k;
      run.shown = s;
      if (run.clock > 2) newRun();
    }
  }

  function complete() {
    while (!run.sim.done) run.sim.step();
    finish();
    learn(run.F, run.sim.u);
  }

  // ---------- drawing ----------

  function px(nd, u, i) {
    return [x0 + (nd.x + (u ? u[i * 2] * EXAG : 0)) * scale,
            deckY - (nd.y + (u ? u[i * 2 + 1] * EXAG : 0)) * scale];
  }

  function line(a, b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }

  function frame(t, u) {
    ctx.beginPath();
    t.bars.forEach(function (b) { line(px(t.nodes[b[0]], u, b[0]), px(t.nodes[b[1]], u, b[1])); });
    ctx.stroke();
  }

  function arrowhead(x, y, dx, dy, s) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - dx * s - dy * s * .45, y - dy * s + dx * s * .45);
    ctx.lineTo(x - dx * s + dy * s * .45, y - dy * s - dx * s * .45);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    var t = run.t, u = run.sim.u, i;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = "round";

    // drafting paper: a fine grid, a heavier one every fifth line
    ctx.fillStyle = grid;
    for (i = 0; i * 10 < w; i++) ctx.fillRect(i * 10, 0, 1, h);
    for (i = 0; i * 10 < h; i++) ctx.fillRect(0, i * 10, w, 1);
    for (i = 0; i * 50 < w; i++) ctx.fillRect(i * 50, 0, 1, h);
    for (i = 0; i * 50 < h; i++) ctx.fillRect(0, i * 50, w, 1);

    // the design as drawn: dashed, undeformed
    ctx.strokeStyle = ink2;
    ctx.lineWidth = 1;
    ctx.globalAlpha = .55;
    ctx.setLineDash([3, 3]);
    frame(t);
    ctx.setLineDash([]);

    // supports: a pin on the left, a roller on the right, ground hatched under both
    var left = px(t.nodes[0]), right = px(t.nodes[t.bays]);
    ctx.globalAlpha = .9;
    [left, right].forEach(function (s, k) {
      ctx.beginPath();
      ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0] - 6, s[1] + 9); ctx.lineTo(s[0] + 6, s[1] + 9); ctx.closePath();
      ctx.stroke();
      var g = s[1] + (k ? 13 : 9);
      if (k) { ctx.beginPath(); ctx.arc(s[0] - 3, s[1] + 11, 2, 0, 7); ctx.moveTo(s[0] + 5, s[1] + 11); ctx.arc(s[0] + 3, s[1] + 11, 2, 0, 7); ctx.stroke(); }
      ctx.beginPath();
      line([s[0] - 10, g], [s[0] + 10, g]);
      for (var x = -9; x <= 9; x += 4) line([s[0] + x, g], [s[0] + x - 3, g + 3]);
      ctx.stroke();
    });

    // the span, dimensioned above the truss
    var dy = DIM_Y, mid = (left[0] + right[0]) / 2, label = SPAN.toFixed(1) + " m";
    ctx.font = FONT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    var gap = ctx.measureText(label).width / 2 + 6;
    ctx.beginPath();
    line([left[0], dy - 4], [left[0], deckY - 6]);
    line([right[0], dy - 4], [right[0], deckY - 6]);
    line([left[0], dy], [mid - gap, dy]);
    line([mid + gap, dy], [right[0], dy]);
    ctx.stroke();
    ctx.fillStyle = ink2;
    arrowhead(left[0], dy, -1, 0, 5);
    arrowhead(right[0], dy, 1, 0, 5);
    ctx.fillText(label, mid, dy + 1);

    // what the simulator has worked out so far: solid, with round joints
    var sim = run.stage === "guess" ? null : u;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.3;
    frame(t, sim);
    ctx.fillStyle = ink;
    t.nodes.forEach(function (nd, k) {
      var p = px(nd, sim, k);
      ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, 7); ctx.fill();
    });

    // the load, hung from its deck node
    var lp = px(t.nodes[run.load], sim, run.load);
    ctx.lineWidth = 1.3;
    ctx.beginPath(); line([lp[0], lp[1] + 4], [lp[0], lp[1] + 16]); ctx.stroke();
    arrowhead(lp[0], lp[1] + 18, 0, 1, 6);
    ctx.textAlign = "left";
    ctx.fillText(Math.round(LOAD / 1000) + " kN", lp[0] + 6, lp[1] + 14);

    // the gap between guess and simulation, once there is a verdict
    var done = run.stage === "compare" || run.stage === "learn";
    var guessIn = run.stage === "guess" ? ease(run.clock / .35) : 1;
    if (done) {
      ctx.strokeStyle = ink2;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      t.nodes.forEach(function (nd, k) {
        var a = px(nd, run.shown, k), b = px(nd, u, k);
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 2) line(a, b);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // the model's guess, made before the simulator ran: hollow squares
    ctx.globalAlpha = guessIn;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    t.nodes.forEach(function (nd, k) {
      var p = px(nd, run.shown, k);
      ctx.strokeRect(Math.round(p[0] - 3) + .5, Math.round(p[1] - 3) + .5, 6, 6);
    });
    ctx.globalAlpha = 1;

    // title block: top left, the design; top right, the model's record
    ctx.fillStyle = ink2;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    var no = (run.no < 10 ? "0" : "") + run.no;
    ctx.fillText("run " + no + " · " + t.kind + " · depth " + t.depth.toFixed(1) + " m", 10, 18);
    var status = run.stage === "guess" ? "model guessing" :
                 run.stage === "sim" ? "simulating · iter " + run.sim.iter :
                 "solved in " + run.sim.iter + " iter · " + run.err.toFixed(1) + " mm off";
    ctx.fillText(status, 10, 33);
    ctx.textAlign = "right";
    ctx.fillText("δ ×" + EXAG, w - 10, 33);

    // error per run, newest on the right
    var bw = 3, bg = 2, bh = 14, top = 9, n = errs.length, max = 0;
    for (i = 0; i < n; i++) max = Math.max(max, errs[i]);
    var bx = w - 10 - 14 * (bw + bg);
    ctx.fillText("err", bx - 6, 18);
    ctx.globalAlpha = .25;
    ctx.fillRect(bx, top + bh, 14 * (bw + bg) - bg, 1);
    ctx.globalAlpha = 1;
    for (i = 0; i < n; i++) {
      var hh = Math.max(1, Math.round(errs[i] / (max || 1) * bh));
      ctx.fillStyle = i === n - 1 ? ink : ink2;
      ctx.fillRect(bx + (14 - n + i) * (bw + bg), top + bh - hh, bw, hh);
    }
  }

  // ---------- layout & loop ----------

  // header on two lines, the span dimension under it, the truss, and room
  // below the deck for the supports and the hung load
  var DIM_Y = 52;
  function layout() {
    deckY = h - 46;
    scale = Math.min((w - 48) / SPAN, (deckY - DIM_Y - 14) / 4.4);
    x0 = (w - SPAN * scale) / 2;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var nw = Math.round(rect.width), nh = Math.round(rect.height);
    if (!nw || (nw === w && nh === h)) return;
    w = nw; h = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    layout();
    if (!run) {
      // open with one run already on the record, and the next under way
      newRun("warren", 8, 3.0, 3);
      complete();
      newRun("pratt", 8, 3.6, 5);
      if (reduceMotion) { complete(); run.stage = "compare"; }
    }
    draw();
  }

  function recolour() {
    colours();
    if (run) draw();
  }

  colours();
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolour);
  document.addEventListener("themechange", recolour);
  if (document.fonts && document.fonts.load) document.fonts.load(FONT).then(recolour, function () {});
  if (reduceMotion) return;

  // click to redesign: across picks where the load hangs, height picks the depth
  canvas.addEventListener("pointerdown", function (e) {
    var rect = canvas.getBoundingClientRect();
    var bays = run.t.bays, p = SPAN / bays;
    var load = Math.round(((e.clientX - rect.left) - x0) / scale / p);
    load = Math.min(bays - 1, Math.max(1, load));
    var depth = (deckY - (e.clientY - rect.top)) / scale;
    depth = Math.round(Math.min(4.4, Math.max(2, depth)) * 10) / 10;
    newRun(run.t.kind, bays, depth, load);
    draw();
  });

  var visible = true, running = false, then = 0;
  function tick(now) {
    if (!visible) { running = false; return; }
    var dt = Math.min(.05, (now - then) / 1000 || 0);
    then = now;
    advance(dt);
    draw();
    requestAnimationFrame(tick);
  }
  function start() {
    if (running) return;
    running = true;
    then = performance.now();
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
  start();
})();
