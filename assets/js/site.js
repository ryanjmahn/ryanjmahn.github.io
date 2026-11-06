// site.js — scroll reveals, count-ups, the github chart and the hero landscape.
var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var root = document.documentElement;

// blocks rise in as they scroll into view; siblings stagger
(function reveal() {
  var els = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
  els.forEach(function (el) {
    var i = 0, p = el.previousElementSibling;
    while (p && p.hasAttribute("data-reveal")) { i++; p = p.previousElementSibling; }
    el.style.setProperty("--d", Math.min(i, 4) * 0.08 + "s");
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (el) { io.observe(el); });
})();

// numbers count up from zero when they scroll into view, keeping "$", "," and "+"
function countTo(text, t) {
  var m = /^(\D*)([\d,]+)(.*)$/.exec(text);
  if (!m) return text;
  var n = Math.round(parseInt(m[2].replace(/,/g, ""), 10) * t);
  return m[1] + (m[2].indexOf(",") > -1 ? n.toLocaleString("en-US") : String(n)) + m[3];
}
console.assert(countTo("$200,000", 1) === "$200,000" && countTo("5,600+", 0.5) === "2,800+" && countTo("final round", 0) === "final round", "countTo");
(function countUp() {
  var els = document.querySelectorAll(".stats dd, .proof b, .flowfig b");
  if (calm || !els.length || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target, final = el.textContent, start = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - start) / 1400);
        el.textContent = countTo(final, 1 - Math.pow(1 - t, 3));
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
})();

// github contributions for the last year, one square per day.
// shortcut: relies on the public github-contributions-api.jogruber.de proxy (github has no keyless api for this); on failure the chart stays hidden.
(function contributions() {
  var box = document.querySelector("[data-gh]");
  if (!box) return;
  var total = document.querySelector("[data-gh-total]");
  fetch("https://github-contributions-api.jogruber.de/v4/" + box.getAttribute("data-gh") + "?y=last")
    .then(function (r) { if (!r.ok) throw r; return r.json(); })
    .then(function (data) {
      var days = data.contributions, html = "";
      // pad the first column so each row is a weekday (sunday on top)
      for (var p = new Date(days[0].date + "T00:00:00Z").getUTCDay(); p > 0; p--) html += '<i style="visibility:hidden"></i>';
      days.forEach(function (d, i) {
        html += '<i data-l="' + d.level + '" style="--c:' + Math.floor(i / 7) + '" title="' + d.date + ": " + d.count + (d.count === 1 ? " contribution" : " contributions") + '"></i>';
      });
      box.innerHTML = html;
      box.scrollLeft = box.scrollWidth;
      if (total) total.textContent = data.total.lastYear.toLocaleString("en-US");
    })
    .catch(function () {
      // chart unavailable: keep just the link to the profile
      if (total) total.parentNode.innerHTML = '<a href="https://github.com/ryanjmahn" target="_blank" rel="noreferrer">github activity ↗</a>';
    });
})();

// the hero: a dithered landscape, drawn pixel by pixel. a lake reflects the sky,
// layers drift past at their own depths like a view from a train, clouds roll,
// birds cross, the cursor shifts the parallax, and on load the picture resolves
// from coarse blocks to fine pixels.
var SKY = [[40, 78, 222], [124, 166, 255], [255, 184, 204], [255, 212, 164]];
var SUN = [255, 122, 64], SUNU = .7, SUNV = .36;
var FAR = { y: .40, a: .10, f: 6.5, c: [156, 146, 236], s: .15 };
var MID = { y: .52, a: .06, f: 3.8, c: [92, 126, 212], s: .35 };
var LAKE = .62;
var NEAR = { y: .78, a: .12, f: 1.9, c: [46, 142, 94], s: .8 };
var FIELD = { y: .91, a: .035, f: 1.5, c: [240, 182, 60], s: 1.4 };
var FLOWERS = [[255, 255, 255], [226, 71, 27], [255, 128, 176]];
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function ridge(h, u) {
  return h.y - h.a * (Math.sin(u * h.f * 2.1 + h.f) * .6 + Math.sin(u * h.f * 4.7 + 1.3) * .28 + Math.sin(u * h.f * 11.3) * .12);
}
function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
// smooth 2d value noise in 0..1, for the clouds
function noise(x, y) {
  var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  var a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
// a pine every so often along the near hill: how far it pokes above the ridge
function tree(wu) {
  var cell = Math.floor(wu * 30), local = wu * 30 - cell, r = hash(cell, 7);
  if (r < .45) return 0;
  return (.025 + r * .045) * Math.max(0, 1 - Math.abs(local - .5) * 3.2);
}
function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
// snap a channel to 9 levels, nudged by the bayer threshold so gradients turn into dither
function dither(c, b) { var q = Math.round((c + (b / 16 - .47) * 32) / 32) * 32; return q < 0 ? 0 : q > 255 ? 255 : q; }
console.assert(dither(0, 0) === 0 && dither(255, 15) === 255 && dither(128, 8) === 128 && noise(3, 4) === hash(3, 4) && tree(0) >= 0, "land");

(function land() {
  var cv = document.querySelector(".land");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var W, H, img, far, mid, near, nearBase, field, start = 0, raf = 0, visible = true, mx = 0, tx = 0, offF = 0;

  function setup() {
    W = Math.max(80, Math.round(cv.clientWidth / 3));
    H = Math.max(40, Math.round(W * cv.clientHeight / Math.max(1, cv.clientWidth)));
    cv.width = W; cv.height = H;
    img = ctx.createImageData(W, H);
    far = new Float32Array(W); mid = new Float32Array(W); near = new Float32Array(W); nearBase = new Float32Array(W); field = new Float32Array(W);
  }

  function sky(x, y, t) {
    var u = x / W, v = y / H;
    var c = v < .26 ? lerp(SKY[0], SKY[1], v / .26) : v < .44 ? lerp(SKY[1], SKY[2], (v - .26) / .18) : lerp(SKY[2], SKY[3], Math.min(1, (v - .44) / .16));
    var du = u - SUNU, dv = (v - SUNV) * H / W, d = Math.sqrt(du * du + dv * dv);
    if (d < .06) return SUN;
    c = lerp(c, [255, 180, 124], Math.max(0, .6 - d * 2));
    // slow-turning rays around the sun
    var ray = Math.pow(Math.max(0, Math.sin(Math.atan2(dv, du) * 9 + t * .15)), 8) * Math.max(0, .45 - d);
    c = lerp(c, [255, 236, 200], Math.min(.5, ray * 1.6));
    // three birds, wings flapping
    for (var i = 0; i < 3; i++) {
      var bx = ((.1 + i * .37 + t * .012 * (1 + i * .3)) % 1.2 - .1) * W, by = (.2 + i * .05 + .01 * Math.sin(t * .7 + i)) * H;
      var px = Math.round(x - bx), py = Math.round(y - by), flap = Math.sin(t * 6 + i * 2) > 0 ? -1 : 0;
      if (Math.abs(px) <= 2 && py === (Math.abs(px) === 1 ? flap : Math.abs(px) === 2 ? flap + 1 : 0)) return [44, 48, 72];
    }
    var k = noise(u * 4 + t * .02, v * 9) * .65 + noise(u * 9 + t * .035, v * 20) * .35;
    var k2 = noise(u * 4 + t * .02, (v - .035) * 9) * .65 + noise(u * 9 + t * .035, (v - .035) * 20) * .35;
    var band = Math.max(0, 1 - Math.abs(v - .17) / .13), a = Math.max(0, Math.min(1, (k - .52) * 4)) * band;
    return lerp(c, k2 < k - .02 ? [255, 252, 246] : [246, 204, 214], a);
  }

  // sky and mountains: what the lake reflects
  function back(x, y, t) {
    var v = y / H, c = range(x, y, t), m = (v - (LAKE - .09)) / .09;
    if (m > 0 && v < LAKE) c = lerp(c, [244, 226, 238], Math.min(.75, m * (noise(x / W * 7 + t * .05, v * 28) * .9 + .2)));
    return c;
  }
  function range(x, y, t) {
    var v = y / H, r;
    if (v >= (r = mid[x])) return lerp(lerp(MID.c, [30, 40, 90], Math.min(1, (v - r) / .1) * .3), v - r < 1.5 / H ? [255, 214, 190] : MID.c, v - r < 1.5 / H ? .45 : 0);
    if (v >= (r = far[x])) {
      var c = lerp(FAR.c, SKY[3], .22);
      return v - r < .025 && r < FAR.y - .03 ? lerp(c, [255, 250, 250], .7) : c;
    }
    return sky(x, y, t);
  }

  function color(x, y, t) {
    var v = y / H, r;
    var up = H - 1 - y;
    if (up < 9) {
      var gx = Math.floor(x - Math.sin(t * 1.6 + x * .13) * up * .22 + offF * 1.3 * W);
      if (up < 2 + hash(gx, 12) * 7 && hash(gx, 11) > .5) return up > 4 ? [70, 160, 84] : [34, 112, 62];
    }
    if (v >= (r = field[x])) {
      var fx = Math.floor(x + offF * W);
      if (hash(fx, y) > .93) return FLOWERS[Math.floor(hash(y, fx) * 3)];
      return lerp(FIELD.c, [196, 120, 36], Math.min(1, (v - r) / .1) * .5);
    }
    if (v >= (r = near[x])) {
      if (v < nearBase[x]) return [26, 96, 66];
      var c = lerp(NEAR.c, [16, 60, 40], Math.min(1, (v - r) / .12) * .45);
      return v - r < 1.5 / H ? lerp(c, [210, 240, 170], .5) : c;
    }
    if (v >= LAKE) {
      if (v - LAKE < 1.2 / H) return lerp(back(x, y, t), [236, 240, 255], .45);
      var ripple = Math.round(Math.sin(y * 1.7 + t * 2.4) * 1.3), xr = Math.min(W - 1, Math.max(0, x + ripple));
      var my = Math.round(2 * LAKE * H - y), depth = Math.min(1, (v - LAKE) / .2);
      var c2 = lerp(back(xr, my, t), [36, 64, 150], .22 + depth * .3);
      if (Math.abs(x / W - SUNU) < .045 - depth * .02 + .012 * Math.sin(y * 2.3 + t * 3)) c2 = lerp(c2, SUN, .65);
      if (hash(x, y + Math.floor(t * 5) * 97) > .996) c2 = [255, 255, 255];
      return c2;
    }
    return back(x, y, t);
  }

  function frame(now) {
    if (!start) start = now;
    var t = (now - start) / 1000, d = img.data;
    mx += (tx - mx) * .06;
    var drift = t * .006 + mx * .02;
    offF = drift * FIELD.s;
    for (var x = 0; x < W; x++) {
      var u = x / W;
      far[x] = ridge(FAR, u + drift * FAR.s);
      mid[x] = ridge(MID, u + drift * MID.s);
      nearBase[x] = ridge(NEAR, u + drift * NEAR.s);
      near[x] = nearBase[x] - tree(u + drift * NEAR.s);
      field[x] = ridge(FIELD, u + offF);
    }
    // load-in: blocks of 16 pixels shrink to 1
    var e = calm ? 1 : Math.min(1, t / 1.5), bs = Math.max(1, Math.round(16 * Math.pow(1 - e, 2.2)));
    for (var y = 0; y < H; y += bs)
      for (x = 0; x < W; x += bs) {
        var c = color(Math.min(W - 1, x + (bs >> 1)), Math.min(H - 1, y + (bs >> 1)), t);
        for (var yy = y; yy < Math.min(H, y + bs); yy++)
          for (var xx = x; xx < Math.min(W, x + bs); xx++) {
            var b = BAYER[(yy & 3) * 4 + (xx & 3)], i = (yy * W + xx) * 4;
            d[i] = dither(c[0], b); d[i + 1] = dither(c[1], b); d[i + 2] = dither(c[2], b); d[i + 3] = 255;
          }
      }
    ctx.putImageData(img, 0, 0);
  }

  function loop(now) { frame(now); raf = visible && !calm ? requestAnimationFrame(loop) : 0; }
  function go() { if (calm) { frame(performance.now()); return; } if (!raf) raf = requestAnimationFrame(loop); }

  setup();
  window.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") tx = e.clientX / window.innerWidth * 2 - 1; }, { passive: true });
  var lastW = cv.clientWidth;
  if ("ResizeObserver" in window)
    new ResizeObserver(function () { if (cv.clientWidth === lastW) return; lastW = cv.clientWidth; setup(); if (calm) go(); }).observe(cv);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) go(); }).observe(cv);
  go();
})();
