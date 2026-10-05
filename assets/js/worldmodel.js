// worldmodel.js — fig. 1, a world model in miniature. A ball bounces in
// a box (the world). A model with slightly wrong physics (gravity a touch
// weak, bounces too soft) rolls its own copy forward and predicts what
// comes next; every LOOK seconds it observes the ball and is corrected.
// Fixed meanings, shared with the rest of the page: round = the real
// thing, square = what a model computes. Decorative canvas; the caption
// carries the meaning. A single still frame under reduced motion.

(function worldmodel() {
  var canvas = document.querySelector(".world__field");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var errEl = document.querySelector(".world__err");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var R = 5;          // ball radius, css px
  var STEP = 1 / 120; // physics substep, seconds
  var LOOK = .9;      // seconds between observations
  var AHEAD = .8;     // how far ahead the model predicts, seconds
  var TRAIL = 1.4;    // seconds of history drawn
  var WORLD = { g: 1500, e: .8, drag: .04 };
  var MODEL = { g: 1300, e: .66, drag: .12 };

  var w = 0, h = 0, dpr = 1, floor = 0;
  var ball = null, guess = null, trail = [], looks = [];
  var acc = 0, sinceLook = 0, clock = 0, rest = 0, err = 0, shownErr = -1;
  var ink = "#000", ink2 = "#777";

  function rand(a, b) { return a + Math.random() * (b - a); }
  function copy(s) { return { x: s.x, y: s.y, vx: s.vx, vy: s.vy }; }

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue("--ink").trim() || ink;
    ink2 = cs.getPropertyValue("--ink-2").trim() || ink2;
  }

  function physics(s, p, dt) {
    s.vy += p.g * dt;
    s.vx -= s.vx * p.drag * dt;
    s.vy -= s.vy * p.drag * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.y > floor - R) { s.y = floor - R; s.vy = -Math.abs(s.vy) * p.e; s.vx *= .96; }
    if (s.y < R) { s.y = R; s.vy = Math.abs(s.vy); }
    if (s.x < R) { s.x = R; s.vx = Math.abs(s.vx) * p.e; }
    if (s.x > w - R) { s.x = w - R; s.vx = -Math.abs(s.vx) * p.e; }
  }

  function observe() {
    looks.push({ x: ball.x, y: ball.y, t: clock });
    if (looks.length > 6) looks.shift();
    guess = copy(ball);
    sinceLook = 0;
  }

  // throw from (x, y), or from a random side; always back toward the middle
  function toss(x, y) {
    if (x == null) x = Math.random() < .5 ? rand(.08, .25) * w : rand(.75, .92) * w;
    if (y == null) y = rand(.25, .55) * floor;
    var dir = x < w / 2 ? 1 : -1;
    ball = { x: x, y: y, vx: dir * rand(.32, .55) * w, vy: -rand(380, 620) };
    trail = [];
    looks = [];
    rest = 0;
    observe();
  }

  function advance(dt) {
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      clock += STEP;
      physics(ball, WORLD, STEP);
      physics(guess, MODEL, STEP);
      trail.push(ball.x, ball.y);
      if (trail.length > TRAIL / STEP * 2) trail.splice(0, 2);
      sinceLook += STEP;
      if (sinceLook >= LOOK) observe();
      // once the ball has settled on the floor, throw it again
      var still = ball.y > floor - R - 1 && Math.abs(ball.vy) < 40 && Math.abs(ball.vx) < 30;
      rest = still ? rest + STEP : 0;
      if (rest > .6) toss();
    }
    err = Math.hypot(ball.x - guess.x, ball.y - guess.y);
  }

  function square(x, y, s) { ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // the floor, with a ruler under it: a tick every 24px, a long one every 96
    ctx.globalAlpha = .5;
    ctx.fillStyle = ink2;
    ctx.fillRect(0, floor, w, 1);
    for (var x = 0; x <= w; x += 24) ctx.fillRect(x, floor + 1, 1, x % 96 ? 3 : 7);
    ctx.globalAlpha = 1;

    // what happened: the ball's path, fading into the past
    var n = trail.length / 2;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.strokeStyle = ink;
    for (var i = 1; i < n; i++) {
      ctx.globalAlpha = .65 * i / n;
      ctx.beginPath();
      ctx.moveTo(trail[i * 2 - 2], trail[i * 2 - 1]);
      ctx.lineTo(trail[i * 2], trail[i * 2 + 1]);
      ctx.stroke();
    }

    // each observation: a crosshair where the model looked
    ctx.strokeStyle = ink2;
    ctx.lineWidth = 1;
    for (i = 0; i < looks.length; i++) {
      var age = clock - looks[i].t;
      ctx.globalAlpha = Math.max(0, .8 - age / 4);
      ctx.beginPath();
      ctx.moveTo(looks[i].x - 5, looks[i].y); ctx.lineTo(looks[i].x + 5, looks[i].y);
      ctx.moveTo(looks[i].x, looks[i].y - 5); ctx.lineTo(looks[i].x, looks[i].y + 5);
      ctx.stroke();
    }

    // what the model expects: its copy rolled forward, as squares
    var p = copy(guess), every = Math.round(.05 / STEP), steps = Math.round(AHEAD / STEP);
    ctx.fillStyle = ink;
    for (i = 1; i <= steps; i++) {
      physics(p, MODEL, STEP);
      if (i % every) continue;
      ctx.globalAlpha = .55 * (1 - i / steps) + .08;
      square(p.x, p.y, 3);
    }

    // the gap between belief and world
    if (err > 2) {
      ctx.globalAlpha = .6;
      ctx.strokeStyle = ink2;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(guess.x, guess.y);
      ctx.lineTo(ball.x, ball.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // the model's ball: a hollow square; the world's: a solid disc
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ink;
    ctx.strokeRect(Math.round(guess.x - R) + .5, Math.round(guess.y - R) + .5, R * 2, R * 2);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2);
    ctx.fill();

    var shown = Math.round(err);
    if (errEl && shown !== shownErr) { errEl.textContent = shown; shownErr = shown; }
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var nw = Math.round(rect.width), nh = Math.round(rect.height);
    if (!nw || (nw === w && nh === h)) return;
    w = nw; h = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    floor = h - 16;
    toss(w * .15, floor * .35);
    // open mid-flight, with a path and a few looks already on the page
    advance(reduceMotion ? 1.2 : .7);
    draw();
  }

  function recolour() {
    colours();
    if (ball) draw();
  }

  colours();
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolour);
  document.addEventListener("themechange", recolour);
  if (reduceMotion) return;

  canvas.addEventListener("pointerdown", function (e) {
    var rect = canvas.getBoundingClientRect();
    toss(Math.min(w - R, Math.max(R, e.clientX - rect.left)), Math.min(floor - R, e.clientY - rect.top));
  });

  var visible = true, running = false, then = 0;
  function frame(now) {
    if (!visible) { running = false; return; }
    var dt = Math.min(.05, (now - then) / 1000 || 0);
    then = now;
    advance(dt);
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
