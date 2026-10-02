// specimen.js — fig. 1, the microscope field at the foot of the home page.
// A toy model, drawn in H&E: a sheet of normal cells that stop dividing
// when they touch (contact inhibition), a mutant colony that doesn't,
// and an inhibitor that clears it. The pointer is a pipette: tumor cells
// under it are dosed. Decorative (aria-hidden); one still frame under
// reduced motion; paused while off screen.

(function specimen() {
  var canvas = document.querySelector(".specimen__field");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var countEl = document.querySelector(".specimen__count");
  var stateEl = document.querySelector(".specimen__state");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var K = 14; // membrane vertices per cell
  var DIRX = [], DIRY = [];
  for (var k = 0; k < K; k++) {
    DIRX.push(Math.cos(k / K * Math.PI * 2));
    DIRY.push(Math.sin(k / K * Math.PI * 2));
  }

  var W = 0, H = 0, dpr = 1;
  var R = 16;          // typical cell radius
  var pad = 0;         // the sheet runs this far past every edge
  var cells = [];
  var N0 = 0;          // cells the sheet holds at rest
  var cols = 0, rows = 0, cellSize = 1, buckets = [];
  var phase = "growth"; // growth -> dose -> recovery -> rest -> growth
  var phaseT = 0, scanX = 0, tick = 0;
  var pointer = null;
  var ink = "#000", eosin = "#f00", nucleus = "#00f", karyon = "#000", paper = "#fff", dark = false;
  var shownCount = -1, shownState = "";

  function rand(a, b) { return a + Math.random() * (b - a); }

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue("--ink").trim() || ink;
    eosin = cs.getPropertyValue("--eosin").trim() || eosin;
    nucleus = cs.getPropertyValue("--nucleus").trim() || nucleus;
    karyon = cs.getPropertyValue("--karyon").trim() || ink;
    paper = cs.getPropertyValue("--paper").trim() || paper;
    dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function makeCell(x, y, r) {
    return {
      x: x, y: y, r: r, rt: r,
      tumor: false,
      cycle: 0,        // tumor: seconds until the next division
      mit: 0,          // > 0 while in mitosis (seconds left)
      axis: rand(0, Math.PI),
      dying: 0,        // > 0 once apoptosis has begun, 1 = gone
      p: 0,            // crowding, summed overlap with neighbours
      nb: [],
      i: 0,
      tone: rand(.7, 1.15),
      nx: rand(-.16, .16), ny: rand(-.16, .16),
      tilt: rand(0, Math.PI),
      v: new Float32Array(K)
    };
  }

  function seed() {
    cells = [];
    R = Math.max(11, Math.min(19, W / 72));
    pad = R * 2;
    var s = R * 1.86;
    var row = 0;
    for (var y = -pad; y < H + pad; y += s * .866, row++) {
      for (var x = -pad + (row % 2 ? s / 2 : 0); x < W + pad; x += s) {
        cells.push(makeCell(x + rand(-.18, .18) * s, y + rand(-.18, .18) * s, R * rand(.86, 1.14)));
      }
    }
    N0 = cells.length;
    cellSize = R * 3;
    cols = Math.ceil((W + pad * 2) / cellSize) + 1;
    rows = Math.ceil((H + pad * 2) / cellSize) + 1;
    buckets = [];
    for (var b = 0; b < cols * rows; b++) buckets.push([]);
    for (var n = 0; n < 40; n++) relax();
    phase = "growth";
    transform(W * rand(.56, .74), H * rand(.6, .74), 7);
  }

  // turn the n normal cells nearest (x, y) into the start of a colony
  function transform(x, y, n) {
    var near = cells.filter(function (c) { return !c.tumor && !c.dying; })
      .sort(function (a, b) {
        return (a.x - x) * (a.x - x) + (a.y - y) * (a.y - y) - (b.x - x) * (b.x - x) - (b.y - y) * (b.y - y);
      });
    for (var i = 0; i < n && i < near.length; i++) {
      near[i].tumor = true;
      near[i].rt = R * rand(1.02, 1.34);
      near[i].cycle = rand(1.5, 6);
    }
  }

  // neighbour lists, crowding, and one pass of pushing overlaps apart
  function relax() {
    var n = cells.length, i, c, o, b;
    for (i = 0; i < buckets.length; i++) buckets[i].length = 0;
    for (i = 0; i < n; i++) {
      c = cells[i];
      c.i = i; c.p = 0; c.nb.length = 0;
      c.gx = Math.max(0, Math.min(cols - 1, Math.floor((c.x + pad) / cellSize)));
      c.gy = Math.max(0, Math.min(rows - 1, Math.floor((c.y + pad) / cellSize)));
      buckets[c.gy * cols + c.gx].push(c);
    }
    for (i = 0; i < n; i++) {
      c = cells[i];
      for (var gy = c.gy - 1; gy <= c.gy + 1; gy++) {
        if (gy < 0 || gy >= rows) continue;
        for (var gx = c.gx - 1; gx <= c.gx + 1; gx++) {
          if (gx < 0 || gx >= cols) continue;
          b = buckets[gy * cols + gx];
          for (var j = 0; j < b.length; j++) {
            o = b[j];
            if (o.i <= c.i) continue;
            var dx = o.x - c.x, dy = o.y - c.y;
            var reach = c.r + o.r + R * .8;
            var d2 = dx * dx + dy * dy;
            if (d2 > reach * reach) continue;
            var d = Math.sqrt(d2) || .01;
            c.nb.push(o); o.nb.push(c);
            var overlap = c.r + o.r - d;
            if (overlap <= 0) continue;
            var push = overlap * .22 / d;
            c.x -= dx * push; c.y -= dy * push;
            o.x += dx * push; o.y += dy * push;
            c.p += overlap / R; o.p += overlap / R;
          }
        }
      }
    }
    for (i = 0; i < n; i++) {
      c = cells[i];
      c.x = Math.max(-pad, Math.min(W + pad, c.x));
      c.y = Math.max(-pad, Math.min(H + pad, c.y));
    }
  }

  function divide(c) {
    var ax = Math.cos(c.axis), ay = Math.sin(c.axis);
    var r = c.r * .74;
    var d = makeCell(c.x + ax * r * .5, c.y + ay * r * .5, r);
    c.x -= ax * r * .5; c.y -= ay * r * .5;
    c.r = r;
    d.tumor = c.tumor;
    if (c.tumor) {
      d.rt = R * rand(1.02, 1.34);
      c.cycle = rand(3.2, 6.5);
      d.cycle = rand(3.2, 6.5);
    } else {
      d.rt = R * rand(.86, 1.14);
    }
    cells.push(d);
  }

  function dose(c) { if (c.tumor && !c.dying) c.dying = .001; }

  function step(dt) {
    var i, c, tumors = 0, alive = 0;
    relax();

    for (i = cells.length - 1; i >= 0; i--) {
      c = cells[i];
      c.r += (c.rt - c.r) * Math.min(1, dt * .7);
      c.x += rand(-1, 1) * R * .012;
      c.y += rand(-1, 1) * R * .012;

      if (c.dying) {
        c.dying += dt / (c.tumor ? 1.5 : .9);
        c.rt = R * .3;
        if (c.dying >= 1) cells.splice(i, 1);
        continue;
      }
      alive++;
      if (c.tumor) tumors++;

      if (c.mit > 0) {
        c.mit -= dt;
        if (c.mit <= 0) { c.mit = 0; divide(c); alive++; if (c.tumor) tumors++; }
        continue;
      }
      // a mutant cell divides on a clock, whatever its neighbours are doing
      if (c.tumor && phase === "growth") {
        c.cycle -= dt;
        if (c.cycle <= 0) { c.mit = .9; c.axis = rand(0, Math.PI); }
      }
      if (c.tumor && pointer) {
        var px = c.x - pointer.x, py = c.y - pointer.y;
        if (px * px + py * py < R * R * 10) dose(c);
      }
      if (c.tumor && phase === "dose" && c.x < scanX && Math.random() < dt * 2.4) dose(c);
    }

    // the sheet holds a fixed number of cells. Too many: the most crowded
    // normal cell is squeezed out. Too few: the least crowded one, no
    // longer held back by its neighbours, divides.
    tick += dt;
    if (tick > .12) {
      tick = 0;
      var pick = null, m;
      if (alive > N0 + 1) {
        for (m = 0; m < 3 && alive - m > N0 + 1; m++) {
          pick = null;
          for (i = 0; i < cells.length; i++) {
            c = cells[i];
            if (!c.tumor && !c.dying && !c.mit && (!pick || c.p > pick.p)) pick = c;
          }
          if (pick) pick.dying = .001;
        }
      } else if (alive < N0 - 1) {
        for (m = 0; m < 4 && alive + m < N0 - 1; m++) {
          pick = null;
          for (var t = 0; t < 60; t++) {
            c = cells[Math.floor(Math.random() * cells.length)];
            if (!c.tumor && !c.dying && !c.mit && c.r > c.rt * .9 && (!pick || c.p < pick.p)) pick = c;
          }
          if (pick) { pick.mit = .7; pick.axis = rand(0, Math.PI); }
        }
      }
    }

    phaseT += dt;
    if (phase === "growth") {
      if (tumors === 0) setPhase("recovery");
      else if (tumors >= Math.max(20, N0 * .17)) { setPhase("dose"); scanX = -pad; }
    } else if (phase === "dose") {
      scanX += (W + pad * 2) / 5.5 * dt;
      if (scanX > W + pad && tumors === 0) setPhase("recovery");
    } else if (phase === "recovery") {
      if (alive >= N0 - 2 && phaseT > 2) setPhase("rest");
    } else if (phaseT > 5) {
      setPhase("growth");
      transform(W * rand(.18, .82), H * rand(.58, .78), 3);
    }
    report(tumors);
  }

  function setPhase(p) { phase = p; phaseT = 0; }

  var STATES = { growth: "growing", dose: "dosed", recovery: "clearing", rest: "in remission" };
  function report(tumors) {
    if (countEl && tumors !== shownCount) { countEl.textContent = tumors; shownCount = tumors; }
    if (stateEl && STATES[phase] !== shownState) { stateEl.textContent = shownState = STATES[phase]; }
  }

  // each membrane vertex goes out to the cell's radius, or to the wall it
  // shares with a neighbour, whichever comes first
  function shape(c) {
    var free = c.r * 1.1, nb = c.nb, v = c.v;
    for (var k = 0; k < K; k++) {
      var dist = free;
      for (var j = 0; j < nb.length; j++) {
        var o = nb[j];
        var dx = o.x - c.x, dy = o.y - c.y;
        var d = Math.sqrt(dx * dx + dy * dy) || .01;
        var along = (DIRX[k] * dx + DIRY[k] * dy) / d;
        if (along < .08) continue;
        var wall = d * c.r / (c.r + o.r) / along;
        if (wall < dist) dist = wall;
      }
      v[k] = Math.max(c.r * .28, dist - .9);
    }
  }

  function trace(c, scale) {
    var v = c.v;
    var x0 = c.x + DIRX[K - 1] * v[K - 1] * scale, y0 = c.y + DIRY[K - 1] * v[K - 1] * scale;
    var x1 = c.x + DIRX[0] * v[0] * scale, y1 = c.y + DIRY[0] * v[0] * scale;
    ctx.beginPath();
    ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2);
    for (var k = 0; k < K; k++) {
      var n = (k + 1) % K;
      var xa = c.x + DIRX[k] * v[k] * scale, ya = c.y + DIRY[k] * v[k] * scale;
      var xb = c.x + DIRX[n] * v[n] * scale, yb = c.y + DIRY[n] * v[n] * scale;
      ctx.quadraticCurveTo(xa, ya, (xa + xb) / 2, (ya + yb) / 2);
    }
    ctx.closePath();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    var i, c;

    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      if (c.x < -pad || c.x > W + pad) continue;
      shape(c);
      var life = c.dying ? 1 - c.dying : 1;
      var scale = c.dying ? .55 + .45 * life : 1;

      // cytoplasm: eosin, pale in normal tissue, saturated in the colony
      trace(c, scale);
      ctx.fillStyle = eosin;
      ctx.globalAlpha = (c.tumor ? (dark ? .36 : .3) : (dark ? .1 : .085)) * c.tone * life;
      ctx.fill();
      ctx.strokeStyle = c.tumor ? eosin : ink;
      ctx.globalAlpha = (c.tumor ? .62 : .2) * life;
      ctx.stroke();

      // nucleus: small and round in a normal cell; large, dark and
      // irregular in a tumor cell; a bar of chromosomes during mitosis;
      // shrunken and dense in a dying one
      var nx = c.x + c.nx * c.r, ny = c.y + c.ny * c.r;
      ctx.fillStyle = c.tumor ? karyon : nucleus;
      if (c.mit > 0) {
        var ax = Math.cos(c.axis + Math.PI / 2), ay = Math.sin(c.axis + Math.PI / 2);
        ctx.globalAlpha = .85;
        ctx.strokeStyle = c.tumor ? karyon : nucleus;
        ctx.lineWidth = Math.max(2, c.r * .2);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(c.x - ax * c.r * .36, c.y - ay * c.r * .36);
        ctx.lineTo(c.x + ax * c.r * .36, c.y + ay * c.r * .36);
        ctx.stroke();
        ctx.lineWidth = 1;
      } else if (c.tumor) {
        var nr = c.r * (c.dying ? .26 : .5);
        ctx.globalAlpha = (c.dying ? .95 : .78) * Math.min(1, life * 1.6);
        ctx.beginPath();
        ctx.ellipse(nx, ny, nr, nr * .74, c.tilt, 0, Math.PI * 2);
        ctx.fill();
        if (!c.dying) {
          ctx.globalAlpha = .5;
          ctx.fillStyle = eosin;
          ctx.beginPath();
          ctx.arc(nx + nr * .25, ny - nr * .1, Math.max(1, nr * .2), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // blebs: the cell comes apart in small pieces
          ctx.fillStyle = eosin;
          ctx.globalAlpha = .55 * life;
          for (var b = 0; b < 3; b++) {
            var ba = c.tilt + b * 2.1, bd = c.r * (.5 + c.dying * .9);
            ctx.beginPath();
            ctx.arc(c.x + Math.cos(ba) * bd, c.y + Math.sin(ba) * bd, c.r * .13, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        ctx.globalAlpha = (dark ? .6 : .5) * life;
        ctx.beginPath();
        ctx.arc(nx, ny, c.r * .29, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // the inhibitor front
    if (phase === "dose" && scanX < W + pad) {
      ctx.globalAlpha = .55;
      ctx.strokeStyle = ink;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(scanX, H * .2);
      ctx.lineTo(scanX, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "11px 'Fragment Mono', ui-monospace, monospace";
      ctx.textAlign = "right";
      var label = "+ inhibitor", lw = ctx.measureText(label).width;
      ctx.globalAlpha = .88;
      ctx.fillStyle = paper;
      ctx.fillRect(scanX - 14 - lw, H * .56 - 13, lw + 12, 19);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ink;
      ctx.fillText(label, scanX - 8, H * .56);
    }

    // the pipette
    if (pointer) {
      var pr = R * 3.16;
      ctx.globalAlpha = .6;
      ctx.strokeStyle = ink;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, pr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(pointer.x - 5, pointer.y); ctx.lineTo(pointer.x + 5, pointer.y);
      ctx.moveTo(pointer.x, pointer.y - 5); ctx.lineTo(pointer.x, pointer.y + 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var nw = Math.round(rect.width), nh = Math.round(rect.height);
    // phones change height as the URL bar hides; only a new width reseeds
    if (!nw || !nh || (nw === W && Math.abs(nh - H) < 80)) return;
    W = nw; H = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    seed();
    if (reduceMotion) {
      // a still: the colony a few generations in
      for (var n = 0; n < 420; n++) { if (phase !== "growth") break; step(1 / 30); }
    }
    relax();
    draw();
  }

  colours();
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    colours();
    draw();
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

  var visible = true, running = false, then = 0;
  function frame(now) {
    if (!visible) { running = false; return; }
    var dt = Math.min(1 / 30, (now - then) / 1000 || 0);
    then = now;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true;
    then = performance.now();
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
  start();
})();
