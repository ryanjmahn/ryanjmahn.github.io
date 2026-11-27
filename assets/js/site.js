// site.js — scroll reveals, count-ups, the github chart and the humanoid hero.
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
console.assert(countTo("$200,000", 1) === "$200,000" && countTo("6,000+", 0.5) === "3,000+" && countTo("final round", 0) === "final round", "countTo");
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
  fetch("https://github-contributions-api.jogruber.de/v4/" + box.getAttribute("data-gh") + "?y=last")
    .then(function (r) { if (!r.ok) throw r; return r.json(); })
    .then(function (data) {
      var days = data.contributions, html = "", months = "";
      var pad = new Date(days[0].date + "T00:00:00Z").getUTCDay();
      var fmt = function (d, o) { return d.toLocaleString("en-US", Object.assign({ timeZone: "UTC" }, o)).toLowerCase(); };
      // pad the first column so each row is a weekday (sunday on top)
      for (var p = pad; p > 0; p--) html += '<i style="visibility:hidden"></i>';
      days.forEach(function (d, i) {
        var dt = new Date(d.date + "T00:00:00Z");
        var tip = fmt(dt, { month: "short", day: "numeric" }) + " · " + (d.count || "no") + (d.count === 1 ? " contribution" : " contributions");
        html += '<i data-l="' + d.level + '"' + (i === days.length - 1 ? " data-today" : "") + ' style="--c:' + Math.floor(i / 7) + '" data-t="' + tip + '"></i>';
        if (dt.getUTCDate() === 1) months += '<span style="grid-column:' + (Math.floor((i + pad) / 7) + 1) + '">' + fmt(dt, { month: "short" }) + "</span>";
      });
      box.innerHTML = html;
      var m = document.querySelector("[data-gh-months]");
      if (m) { m.innerHTML = months; m.style.gridTemplateColumns = "repeat(" + Math.ceil((days.length + pad) / 7) + ", minmax(6px, 1fr))"; }
      var scroll = box.parentNode; scroll.scrollLeft = scroll.scrollWidth;
      var total = document.querySelector("[data-gh-total]");
      if (total) total.textContent = data.total.lastYear.toLocaleString("en-US");
      // one shared hover label instead of the browser's native title tooltip
      var tipEl = document.querySelector("[data-gh-tip]");
      if (tipEl) {
        box.addEventListener("mouseover", function (e) {
          var t = e.target.getAttribute && e.target.getAttribute("data-t");
          if (!t) return;
          var r = e.target.getBoundingClientRect(), sr = scroll.getBoundingClientRect();
          tipEl.textContent = t; tipEl.hidden = false;
          tipEl.style.left = (r.left - sr.left + scroll.scrollLeft + r.width / 2) + "px";
          tipEl.style.top = (r.top - sr.top + scroll.scrollTop) + "px";
        });
        box.addEventListener("mouseleave", function () { tipEl.hidden = true; });
      }
    })
    .catch(function () {
      // chart unavailable: keep just the link to the profile
      document.querySelectorAll("[data-gh-body]").forEach(function (el) { el.remove(); });
      var line = document.querySelector("[data-gh-line]");
      if (line) line.innerHTML = '<a href="https://github.com/ryanjmahn" target="_blank" rel="noreferrer">github activity ↗</a>';
    });
})();

// the hero: humanoid robots under a verification layer, drawn as a dithered pixel scene.
// a humanoid walks through a sunset city while a world model predicts its gait (cyan
// skeleton, a beat ahead). every few seconds it hits a slick patch and slips: the real
// pose leaves the prediction, the verifier brackets go red until it recovers.
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
var SKY = [[30, 46, 150], [64, 104, 236], [150, 170, 255], [255, 184, 204], [255, 214, 170]];
var CITY = [150, 140, 220], CITY2 = [196, 160, 214], FLOOR = [255, 212, 164], GRID = [246, 168, 150], ICE = [226, 244, 255];
var SHELL = [244, 240, 232], SHELL2 = [176, 172, 196], JOINT = [34, 36, 58], VISOR = [26, 34, 70], GLOW = [94, 224, 255];
var GHOST = [94, 224, 255], OK = [60, 220, 150], BAD = [255, 90, 79], FAR = [168, 150, 226];
var STEP = 2 * Math.PI * .85, PERIOD = 7, SLIP_AT = 4.6, SLIP_LEN = 1.5, GROUND_V = .34;

function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
// snap a channel to 9 levels, nudged by the bayer threshold so gradients turn into dither
function dither(c, b) { var q = Math.round((c + (b / 16 - .47) * 32) / 32) * 32; return q < 0 ? 0 : q > 255 ? 255 : q; }
function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
// squared distance from point p to segment ab
function seg(px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  var ex = px - ax - dx * t, ey = py - ay - dy * t; return ex * ex + ey * ey;
}
// how far into a slip we are at time t: 0 walking, rising to 1 mid-slip, back to 0
function slipAt(t) { var k = (t % PERIOD - SLIP_AT) / SLIP_LEN; return k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0; }
// a humanoid's body as capsules [ax, ay, bx, by, radius, colour], back to front, plus its head
function body(p, slip, ox, oy, s, far) {
  var segs = [], sh = far ? FAR : SHELL, sh2 = far ? FAR : SHELL2, jt = far ? FAR : JOINT;
  var hip = [ox, oy - .01 * s * Math.cos(2 * p)], lean = .08 - .45 * slip;
  var top = [hip[0] + .19 * s * Math.sin(lean), hip[1] - .19 * s * Math.cos(lean)];
  function leg(ph, kick, col) {
    var a = .42 * Math.sin(ph) + kick, k = .1 + .75 * Math.max(0, Math.cos(ph));
    var kn = [hip[0] + .13 * s * Math.sin(a), hip[1] + .13 * s * Math.cos(a)], b = a - k;
    var an = [kn[0] + .13 * s * Math.sin(b), kn[1] + .13 * s * Math.cos(b)];
    segs.push([hip[0], hip[1], kn[0], kn[1], .03 * s, col], [kn[0], kn[1], an[0], an[1], .025 * s, col],
      [an[0] - .01 * s, an[1] + .012 * s, an[0] + .05 * s, an[1] + .012 * s, .014 * s, jt], [kn[0], kn[1], kn[0], kn[1], .016 * s, jt]);
  }
  function arm(ph, col) {
    var a = -.38 * Math.sin(ph) - 1.25 * slip, el = [top[0] + .1 * s * Math.sin(a), top[1] + .1 * s * Math.cos(a)], f = a + .6 + .4 * slip;
    var hd = [el[0] + .1 * s * Math.sin(f), el[1] + .1 * s * Math.cos(f)];
    segs.push([top[0], top[1], el[0], el[1], .022 * s, col], [el[0], el[1], hd[0], hd[1], .02 * s, col], [el[0], el[1], el[0], el[1], .014 * s, jt]);
  }
  leg(p + Math.PI, -.2 * slip, sh2); arm(p + Math.PI, sh2);
  var mid = [hip[0] + (top[0] - hip[0]) * .45, hip[1] + (top[1] - hip[1]) * .45];
  segs.push([hip[0] - .015 * s, hip[1], hip[0] + .015 * s, hip[1], .034 * s, jt], [hip[0], hip[1], mid[0], mid[1], .03 * s, sh2], [mid[0], mid[1], top[0], top[1] + .02 * s, .05 * s, sh]);
  leg(p, .55 * slip, sh); arm(p, sh);
  var head = [top[0] + .075 * s * Math.sin(lean), top[1] - .075 * s * Math.cos(lean), .052 * s];
  return { segs: segs, head: head };
}
console.assert(dither(0, 0) === 0 && dither(255, 15) === 255 && seg(0, 1, -1, 0, 1, 0) === 1 && slipAt(0) === 0 && slipAt(SLIP_AT + SLIP_LEN / 2) === 1, "hero");

(function hero() {
  var cv = document.querySelector(".land");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d"), verdict = document.querySelector("[data-verdict]");
  var W, H, img, start = 0, raf = 0, visible = true, lastHud = 0;

  function setup() {
    W = Math.max(80, Math.round(cv.clientWidth / 3));
    H = Math.max(60, Math.round(W * cv.clientHeight / Math.max(1, cv.clientWidth)));
    cv.width = W; cv.height = H;
    img = ctx.createImageData(W, H);
  }
  function box(b) {
    var x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    b.segs.forEach(function (q) { x0 = Math.min(x0, q[0], q[2]); x1 = Math.max(x1, q[0], q[2]); y0 = Math.min(y0, q[1], q[3]); y1 = Math.max(y1, q[1], q[3]); });
    return [Math.min(x0, b.head[0] - b.head[2]) - .04, Math.max(x1, b.head[0] + b.head[2]) + .04, b.head[1] - b.head[2] - .04, y1 + .04];
  }
  function hit(b, u, v, bb) {
    var ol = 1.2 / H;
    if (u < bb[0] || u > bb[1] || v < bb[2] || v > bb[3]) return null;
    var c = null, h = b.head, dx = u - h[0], dy = v - h[1];
    for (var i = 0; i < b.segs.length; i++) {
      var q = b.segs[i], d2 = seg(u, v, q[0], q[1], q[2], q[3]), o = q[4] + ol;
      if (d2 < o * o) c = d2 < q[4] * q[4] ? q[5] : b.far ? FAR : JOINT;
    }
    var hd = Math.sqrt(dx * dx + dy * dy);
    if (hd < h[2] + ol && hd >= h[2]) c = b.far ? FAR : JOINT;
    if (dx * dx + dy * dy < h[2] * h[2]) c = b.far ? FAR : dx > -h[2] * .1 && Math.abs(dy + h[2] * .05) < h[2] * .38 ? (Math.abs(dy + h[2] * .05) < h[2] * .1 ? GLOW : VISOR) : SHELL;
    return c;
  }

  function frame(now) {
    if (!start) start = now;
    var t = (now - start) / 1000, d = img.data, ax = W / H, sl = slipAt(t), cx = ax * .46, oy = .56;
    var R = body(STEP * t, sl, cx, oy, 1, false), G = body(STEP * (t + .12), 0, cx, oy, 1, false);
    var fx = ((t * .045) % 1.5 - .25) * ax, F = body(STEP * .8 * t, 0, fx, .62, .32, true); F.far = true;
    var rb = box(R), gb = box(G), fb = box(F), bb = [Math.min(rb[0], gb[0]), Math.max(rb[1], gb[1]), Math.min(rb[2], gb[2]), Math.max(rb[3], gb[3])];
    var bad = sl > .25, px1 = 1 / H, ts = t - t % PERIOD + SLIP_AT, ice = cx + (ts + .05 - t) * GROUND_V;
    var e = calm ? 1 : Math.min(1, t / 1.4), bs = Math.max(1, Math.round(12 * Math.pow(1 - e, 2.2)));

    function color(x, y, b) {
      var u = x / H, v = y / H, c, hz = .66;
      if (v < hz) {
        var k = v / hz * (SKY.length - 1), i = Math.min(SKY.length - 2, Math.floor(k));
        c = lerp(SKY[i], SKY[i + 1], k - i);
        // two layers of city blocks drifting at their own depths
        var c1 = Math.floor((u + t * .012) * 9), h1 = .1 + hash(c1, 3) * .16;
        if (v > hz - h1 * .7) c = CITY2;
        var c2 = Math.floor((u + t * .03) * 6), h2 = .06 + hash(c2, 5) * .14, wnd = (Math.floor((u + t * .03) * 60) + Math.floor(v * 70)) % 3 === 0;
        if (v > hz - h2) c = wnd && v < hz - .01 && hash(c2, Math.floor(v * 70)) > .55 ? [255, 222, 170] : CITY;
      } else {
        var z = 1 / (v - hz + .02), gz = z * .5 + t * GROUND_V * 4, gx = (u - ax * .5) * z * .7;
        c = Math.abs(gz - Math.round(gz)) < .07 || Math.abs(gx - Math.round(gx)) < .04 ? GRID : FLOOR;
        if (v > .815 && v < .85 && Math.abs(u - ice) < .1) c = hash(x, y + Math.floor(t * 6)) > .9 ? [255, 255, 255] : ICE;
      }
      var f = hit(F, u, v, fb); if (f) c = f;
      if (u > bb[0] && u < bb[1] && v > bb[2] && v < bb[3]) {
        // world model's predicted skeleton, under the real robot
        for (var j = 0; j < G.segs.length; j++) { var q = G.segs[j]; if (seg(u, v, q[0], q[1], q[2], q[3]) < .009 * .009 && b < 10) c = GHOST; }
        var g = G.head; if (Math.abs(Math.hypot(u - g[0], v - g[1]) - g[2]) < px1 && b < 10) c = GHOST;
        var r = hit(R, u, v, rb); if (r) c = r;
        // verifier: corner brackets around the robot
        var onX = (Math.abs(u - rb[0]) < px1 || Math.abs(u - rb[1]) < px1) && v > rb[2] && v < rb[3], onY = (Math.abs(v - rb[2]) < px1 || Math.abs(v - rb[3]) < px1) && u > rb[0] && u < rb[1];
        if ((onX || onY) && Math.min(Math.abs(u - rb[0]), Math.abs(u - rb[1])) < .04 && Math.min(Math.abs(v - rb[2]), Math.abs(v - rb[3])) < .04) c = bad ? BAD : OK;
      }
      return c;
    }

    for (var y = 0; y < H; y += bs)
      for (var x = 0; x < W; x += bs) {
        var cx2 = Math.min(W - 1, x + (bs >> 1)), cy2 = Math.min(H - 1, y + (bs >> 1));
        for (var yy = y; yy < Math.min(H, y + bs); yy++)
          for (var xx = x; xx < Math.min(W, x + bs); xx++) {
            var b = BAYER[(yy & 3) * 4 + (xx & 3)], c = color(bs > 1 ? cx2 : xx, bs > 1 ? cy2 : yy, b), i = (yy * W + xx) * 4;
            d[i] = dither(c[0], b); d[i + 1] = dither(c[1], b); d[i + 2] = dither(c[2], b); d[i + 3] = 255;
          }
      }
    ctx.putImageData(img, 0, 0);
    if (verdict && now - lastHud > 200) {
      lastHud = now;
      verdict.textContent = bad ? "✗ slip · off-prediction" : "✓ gait verified · " + (.97 + .02 * Math.sin(t)).toFixed(2);
      verdict.className = "hud hud-tr " + (bad ? "bad" : "ok");
    }
  }

  function loop(now) { frame(now); raf = visible && !calm ? requestAnimationFrame(loop) : 0; }
  function go() { if (calm) { frame(performance.now()); return; } if (!raf) raf = requestAnimationFrame(loop); }

  setup();
  var lastW = cv.clientWidth;
  if ("ResizeObserver" in window)
    new ResizeObserver(function () { if (cv.clientWidth === lastW) return; lastW = cv.clientWidth; setup(); if (calm) go(); }).observe(cv);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) go(); }).observe(cv);
  go();
})();
