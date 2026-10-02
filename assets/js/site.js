// site.js — the letterhead's pulse. Shared, byte-identical include on
// every page. Draws a lead-II ECG into .vitals__trace the way a bedside
// monitor does: a sweep that overwrites the last pass. Decorative
// (aria-hidden in the markup); a single still pass under reduced motion.

(function vitals() {
  var canvas = document.querySelector(".vitals__trace");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var bpmEl = document.querySelector(".vitals__bpm-num");
  var heart = document.querySelector(".vitals__heart");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var REST = 62;      // resting rate
  var SPEED = 70;     // sweep, css px per second
  var GAP = 16;       // blank stretch ahead of the sweep head

  var w = 0, h = 0, dpr = 1;
  var samples = [];   // one value per css px, -1..1
  var head = 0;       // sweep position, css px
  var phase = 0;      // 0..1 through the current beat
  var rate = REST, target = REST, beatLen = 60 / REST;
  var ink = "#000", accent = "#f00";

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue("--ink").trim() || ink;
    accent = cs.getPropertyValue("--eosin").trim() || accent;
  }

  function bump(p, mu, sigma) {
    var d = (p - mu) / sigma;
    return Math.exp(-.5 * d * d);
  }
  // P wave, QRS complex, T wave
  function wave(p) {
    return .11 * bump(p, .16, .028)
         - .13 * bump(p, .268, .008)
         + 1.0 * bump(p, .295, .0095)
         - .24 * bump(p, .322, .011)
         + .25 * bump(p, .53, .05);
  }

  function advance(dt) {
    // ease toward the target rate; each beat's length wanders a little,
    // as a real heart's does
    rate += (target - rate) * Math.min(1, dt * 1.6);
    phase += dt / beatLen;
    if (phase >= 1) {
      phase -= 1;
      beatLen = 60 / rate * (1 + (Math.random() - .5) * .07);
      onBeat(Math.round(60 / beatLen));
    }
    return wave(phase);
  }

  function onBeat(bpm) {
    if (bpmEl) bpmEl.textContent = bpm;
    if (!heart || reduceMotion) return;
    heart.classList.remove("is-beat");
    void heart.offsetWidth;
    heart.classList.add("is-beat");
  }

  function sweep(px) {
    // move the head on, writing every pixel it crosses exactly once
    var to = head + px;
    for (var x = Math.floor(head) + 1; x <= Math.floor(to); x++) {
      samples[x % w] = advance(1 / SPEED);
    }
    head = to % w;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var base = h * .68, amp = h * .56;
    var hx = Math.floor(head);
    ctx.lineWidth = 1.15;
    ctx.lineJoin = "round";
    ctx.strokeStyle = ink;
    ctx.globalAlpha = .7;
    ctx.beginPath();
    var pen = false;
    for (var x = 0; x < w; x++) {
      var ahead = (x - hx + w) % w;
      if (ahead < GAP && !reduceMotion) { pen = false; continue; }
      var y = base - samples[x] * amp;
      if (pen) ctx.lineTo(x + .5, y); else { ctx.moveTo(x + .5, y); pen = true; }
    }
    ctx.stroke();
    if (reduceMotion) return;
    // the head: a bright point where the trace is being written
    var last = samples[(hx - 1 + w) % w];
    ctx.globalAlpha = 1;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(hx, base - last * amp, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var nw = Math.max(2, Math.round(rect.width)), nh = Math.round(rect.height);
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    // a full pass already on screen, so the page never opens on a flat line
    samples = new Array(w);
    head = 0;
    for (var x = 0; x < w; x++) samples[x] = advance(1 / SPEED);
    head = reduceMotion ? 0 : w * .82;
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

  // a link under the pointer or focus quickens the pulse
  function excite(e) { if (e.target.closest && e.target.closest("a")) target = 96; }
  function settle(e) { if (e.target.closest && e.target.closest("a")) target = REST; }
  document.addEventListener("pointerover", excite);
  document.addEventListener("pointerout", settle);
  document.addEventListener("focusin", excite);
  document.addEventListener("focusout", settle);

  var then = 0;
  function frame(now) {
    var dt = Math.min(.05, (now - then) / 1000 || 0);
    then = now;
    sweep(dt * SPEED);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
