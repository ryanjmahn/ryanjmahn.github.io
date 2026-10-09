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
  // the drawing sheet: an HTML card over the canvas that follows the run
  var sheet = document.querySelector(".sheet");
  function part(c) { return sheet && sheet.querySelector(c); }
  var sheetEls = {
    no: part(".sheet__no"), kind: part(".sheet__kind"), bays: part(".sheet__bays"),
    depth: part(".sheet__depth"), sag: part(".sheet__sag"), miss: part(".sheet__miss"),
    steps: sheet ? sheet.querySelectorAll(".sheet__steps li") : []
  };
  var shown = {};
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
  var ink = "#000", ink2 = "#777", grid = "rgba(0,0,0,.05)", paper = "#fff";
  var coef = PRIOR.slice(), runNo = 0, errs = [], lastLoad = -1, shownErr = "";
  var run = null;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function ease(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue("--ink").trim() || ink;
    ink2 = cs.getPropertyValue("--ink-2").trim() || ink2;
    grid = cs.getPropertyValue("--grid").trim() || grid;
    paper = cs.getPropertyValue("--card").trim() || paper;
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

  function put(key, el, text) {
    if (el && shown[key] !== text) { el.textContent = text; shown[key] = text; }
  }

  function syncSheet() {
    if (!sheet) return;
    var t = run.t, u = run.sim.u, sag = 0;
    for (var i = 1; i < u.length; i += 2) sag = Math.max(sag, -u[i]);
    var no = String(run.no);
    put("no", sheetEls.no, "000".slice(no.length) + no);
    put("kind", sheetEls.kind, t.kind);
    put("bays", sheetEls.bays, String(t.bays));
    put("depth", sheetEls.depth, t.depth.toFixed(1) + " m");
    put("sag", sheetEls.sag, run.stage === "guess" ? "—" : (sag * 1000).toFixed(1) + " mm");
    put("miss", sheetEls.miss, run.err == null ? "—" : run.err.toFixed(1) + " mm");
    // draft → model (the guess) → simulate (the solve) → next (learn, move on)
    var step = run.stage === "guess" ? (run.clock < .2 ? 0 : 1) : run.stage === "sim" ? 2 : 3;
    if (shown.step === step) return;
    shown.step = step;
    for (i = 0; i < sheetEls.steps.length; i++) {
      sheetEls.steps[i].classList.toggle("is-on", i === step);
      sheetEls.steps[i].classList.toggle("is-done", i < step);
    }
  }

  // openwm's figure language, in grey: square pixels screened through a
  // 4×4 Bayer matrix into three tones, so forms fray at their edges
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var TONES = [0, .2, .45, .88];
  var CELL = 3;
  function dither(v, x, y) {
    var q = Math.min(2.999, Math.max(0, v) * 3), base = Math.floor(q);
    return base + (q - base > (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16 ? 1 : 0);
  }

  // faded blocks behind the drawing, like ghosts of earlier sheets; drawn
  // once per size or theme into their own canvas
  var ghosts = null;
  function buildGhosts() {
    ghosts = document.createElement("canvas");
    ghosts.width = w * dpr; ghosts.height = h * dpr;
    var g = ghosts.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = ink;
    [[.56, .2, .26, .26, .7], [.03, .7, .22, .26, .55], [.74, .66, .23, .3, .65], [.34, .86, .2, .14, .45]].forEach(function (b) {
      var x0b = b[0] * w, y0b = b[1] * h, bw = b[2] * w, bh = b[3] * h;
      for (var y = 0; y < bh; y += CELL) for (var x = 0; x < bw; x += CELL) {
        // densest in the middle of each block, thinning to its edges
        var ex = Math.min(x, bw - x) / bw, ey = Math.min(y, bh - y) / bh;
        var v = b[4] * Math.min(1, Math.min(ex, ey) * 5);
        var cx = (x0b + x) / CELL | 0, cy = (y0b + y) / CELL | 0;
        if (v > (BAYER[(cy & 3) * 4 + (cx & 3)] + .5) / 16) g.fillRect(cx * CELL, cy * CELL, CELL - .7, CELL - .7);
      }
    });
  }

  // each member as a dithered band: the harder the bar works in the
  // simulation, the darker its core. Before the solve, every bar is the
  // same light grey, the draft
  function bands(t, u) {
    var segs = [], minX = w, maxX = 0, minY = h, maxY = 0, R = 11;
    t.bars.forEach(function (b) {
      var a = px(t.nodes[b[0]], u, b[0]), c = px(t.nodes[b[1]], u, b[1]), force = 0;
      if (u) {
        var A = t.nodes[b[0]], B = t.nodes[b[1]], dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy);
        var stretch = ((u[b[1] * 2] - u[b[0] * 2]) * dx + (u[b[1] * 2 + 1] - u[b[0] * 2 + 1]) * dy) / l;
        force = Math.abs(EA * stretch / l);
      }
      segs.push({ ax: a[0], ay: a[1], dx: c[0] - a[0], dy: c[1] - a[1], v: .4 + .6 * Math.min(1, force / (LOAD * 1.1)) });
      minX = Math.min(minX, a[0], c[0]); maxX = Math.max(maxX, a[0], c[0]);
      minY = Math.min(minY, a[1], c[1]); maxY = Math.max(maxY, a[1], c[1]);
    });
    var gx0 = Math.max(0, (minX - R) / CELL | 0), gx1 = Math.min(w, maxX + R) / CELL | 0;
    var gy0 = Math.max(0, (minY - R) / CELL | 0), gy1 = Math.min(h, maxY + R) / CELL | 0;
    var lv = [], k;
    for (var gy = gy0; gy <= gy1; gy++) for (var gx = gx0; gx <= gx1; gx++) {
      var x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2, v = 0;
      for (k = 0; k < segs.length; k++) {
        var sg = segs[k], len2 = sg.dx * sg.dx + sg.dy * sg.dy;
        var tt = Math.max(0, Math.min(1, ((x - sg.ax) * sg.dx + (y - sg.ay) * sg.dy) / len2));
        var d = Math.hypot(x - sg.ax - tt * sg.dx, y - sg.ay - tt * sg.dy);
        if (d > R) continue;
        var f = d < 3.5 ? 1 : Math.pow(1 - (d - 3.5) / (R - 3.5), 1.4);
        v = Math.max(v, sg.v * f);
      }
      if (v > 0) lv.push(gx, gy, dither(v, gx, gy));
    }
    ctx.fillStyle = ink;
    for (var tone = 1; tone <= 3; tone++) {
      ctx.globalAlpha = TONES[tone];
      for (k = 0; k < lv.length; k += 3) if (lv[k + 2] === tone) ctx.fillRect(lv[k] * CELL, lv[k + 1] * CELL, CELL - .7, CELL - .7);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    var t = run.t, u = run.sim.u, i;
    syncSheet();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = "round";

    // drafting paper: a coarse grid, kept quiet under the dither
    ctx.fillStyle = grid;
    for (i = 0; i * 50 < w; i++) ctx.fillRect(i * 50, 0, 1, h);
    for (i = 0; i * 50 < h; i++) ctx.fillRect(0, i * 50, w, 1);
    if (!ghosts) buildGhosts();
    ctx.globalAlpha = .09;
    ctx.drawImage(ghosts, 0, 0, w, h);
    ctx.globalAlpha = 1;

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
    var dy = Math.round(deckY - t.depth * scale - 18), mid = (left[0] + right[0]) / 2, label = SPAN.toFixed(1) + " m";
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

    // what the simulator has worked out so far: dithered bands, each with a
    // thin paper line down its middle, and round joints
    var sim = run.stage === "guess" ? null : u;
    bands(t, sim);
    ctx.globalAlpha = .9;
    ctx.strokeStyle = paper;
    ctx.lineWidth = 1;
    frame(t, sim);
    ctx.globalAlpha = 1;
    t.nodes.forEach(function (nd, k) {
      var p = px(nd, sim, k);
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = paper;
      ctx.beginPath(); ctx.arc(p[0], p[1], 1, 0, 7); ctx.fill();
    });
    ctx.fillStyle = ink;

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

    // top right: the exaggeration, and the model's record
    ctx.fillStyle = ink2;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "right";
    ctx.fillText("δ ×" + EXAG, w - 12, 39);

    // error per run, newest on the right
    var bw = 3, bg = 2, bh = 14, top = 12, n = errs.length, max = 0;
    for (i = 0; i < n; i++) max = Math.max(max, errs[i]);
    var bx = w - 12 - 14 * (bw + bg);
    ctx.fillText("miss", bx - 6, 24);
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

  // the sheet card on top, then the span dimension, the truss, and room
  // below the deck for the supports and the hung load
  function layout() {
    var top = sheet ? sheet.offsetTop + sheet.offsetHeight + 28 : 52;
    deckY = h - 46;
    scale = Math.min((w - 48) / SPAN, (deckY - top) / 4.4);
    x0 = (w - SPAN * scale) / 2;
    ghosts = null;
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
    ghosts = null;
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
