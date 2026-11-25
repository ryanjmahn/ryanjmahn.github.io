// site.js — scroll reveals, count-ups, the github chart and the physical-ai hero.
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

// the hero: physical ai under a verification layer, drawn as a dithered pixel scene.
// a robot arm moves a block between two pads (reality, warm). a world model predicts
// the same motion (cyan ghost) and drifts when contact makes it unsure. a verifier
// box tracks the gripper: green while prediction and reality agree, red when they part.
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
var BG = [[22, 34, 120], [40, 78, 222], [124, 166, 255], [255, 184, 204]];
var FLOOR = [255, 212, 164], GRID = [255, 160, 150], ARM = [255, 238, 218], BASE = [24, 28, 64], JOINT = [255, 150, 110], BLOCK = [255, 122, 64];
var GHOST = [94, 224, 255], OK = [60, 220, 150], BAD = [255, 90, 79], SCAN = [200, 245, 255];
var KEYS = [[0, "home"], [.15, "upA"], [.25, "atA"], [.32, "atA"], [.42, "upA"], [.62, "upB"], [.72, "atB"], [.78, "atB"], [.88, "upB"], [1, "home"]];
var PERIOD = 4.2;

function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function smooth(t) { return t * t * (3 - 2 * t); }
// snap a channel to 9 levels, nudged by the bayer threshold so gradients turn into dither
function dither(c, b) { var q = Math.round((c + (b / 16 - .47) * 32) / 32) * 32; return q < 0 ? 0 : q > 255 ? 255 : q; }
// squared distance from point p to segment ab
function seg(px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  var ex = px - ax - dx * t, ey = py - ay - dy * t; return ex * ex + ey * ey;
}
// two-link inverse kinematics, elbow up (screen y points down)
function ik(bx, by, tx, ty, l1, l2) {
  var dx = tx - bx, dy = ty - by, d = Math.min(Math.sqrt(dx * dx + dy * dy), l1 + l2 - 1e-4);
  var a = Math.atan2(dy, dx), k = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  var e1 = [bx + l1 * Math.cos(a - k), by + l1 * Math.sin(a - k)], e2 = [bx + l1 * Math.cos(a + k), by + l1 * Math.sin(a + k)];
  var el = e1[1] < e2[1] ? e1 : e2, f = l2 / Math.max(1e-6, Math.hypot(tx - el[0], ty - el[1]));
  return [el, [el[0] + (tx - el[0]) * Math.min(1, f * 1.0001), el[1] + (ty - el[1]) * Math.min(1, f * 1.0001)]];
}
console.assert(dither(0, 0) === 0 && dither(255, 15) === 255 && seg(0, 1, -1, 0, 1, 0) === 1 && Math.abs(ik(0, 0, 1, 0, .6, .6)[1][0] - 1) < 1e-3, "hero");

(function hero() {
  var cv = document.querySelector(".land");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d"), verdict = document.querySelector("[data-verdict]");
  var W, H, img, start = 0, raf = 0, visible = true, lastHud = 0, trail = [];

  function setup() {
    W = Math.max(80, Math.round(cv.clientWidth / 3));
    H = Math.max(60, Math.round(W * cv.clientHeight / Math.max(1, cv.clientWidth)));
    cv.width = W; cv.height = H;
    img = ctx.createImageData(W, H);
  }

  // the arm's state at time t, in units of canvas height (x spans 0..W/H)
  function pose(t, ghost) {
    var ax = W / H, cyc = t / PERIOD, n = Math.floor(cyc), ph = cyc - n, flip = n % 2;
    var A = ax / 2 + (flip ? .34 : -.34) * Math.min(1, ax / 1.25), B = ax / 2 + (flip ? -.34 : .34) * Math.min(1, ax / 1.25);
    var P = { home: [ax / 2, .36], upA: [A, .56], atA: [A, .74], upB: [B, .56], atB: [B, .74] };
    for (var i = 1; i < KEYS.length && KEYS[i][0] < ph; i++);
    var k0 = KEYS[i - 1], k1 = KEYS[i], f = smooth((ph - k0[0]) / Math.max(1e-6, k1[0] - k0[0]));
    var p = [P[k0[1]][0] + (P[k1[1]][0] - P[k0[1]][0]) * f, P[k0[1]][1] + (P[k1[1]][1] - P[k0[1]][1]) * f];
    var held = ph > .3 && ph < .76, err = 0;
    if (ghost) {
      // the model wobbles a little always, and drifts hard after each grasp (contact is hard to predict)
      var spike = ph > .3 && ph < .52 ? Math.sin((ph - .3) / .22 * Math.PI) : 0;
      p = [p[0] + Math.sin(t * 1.9) * .012 + spike * .09 * (flip ? -1 : 1), p[1] + Math.cos(t * 2.3) * .01 + spike * .05];
    }
    var base = [ax / 2, .78], j = ik(base[0], base[1], p[0], p[1], .3, .3);
    var block = held ? [j[1][0], j[1][1] + .05] : [ph < .3 ? A : B, .8];
    return { base: base, el: j[0], ee: j[1], block: block, held: held };
  }

  function frame(now) {
    if (!start) start = now;
    var t = (now - start) / 1000, d = img.data, ax = W / H;
    var R = pose(t, false), G = pose(t, true);
    var err = Math.hypot(R.ee[0] - G.ee[0], R.ee[1] - G.ee[1]), bad = err > .035;
    trail.push(G.ee); if (trail.length > 26) trail.shift();
    var scan = ((t * .45) % 1.3 - .15) * ax, bx0 = R.ee[0] - .11, bx1 = R.ee[0] + .11, by0 = R.ee[1] - .08, by1 = R.ee[1] + .14;
    var e = calm ? 1 : Math.min(1, t / 1.4), bs = Math.max(1, Math.round(12 * Math.pow(1 - e, 2.2)));
    var px1 = 1 / H, arm2 = .022 * .022, gh2 = .013 * .013;
    var xs = [R.base[0], R.el[0], R.ee[0], G.el[0], G.ee[0], R.block[0], bx0, bx1], ys = [R.el[1], R.ee[1], G.el[1], G.ee[1], by0];
    trail.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); });
    var mx0 = Math.min.apply(0, xs) - .08, mx1 = Math.max.apply(0, xs) + .08, my0 = Math.min.apply(0, ys) - .08;

    function color(x, y, b) {
      var u = x / H, v = y / H, c;
      // backdrop: deep blue to pink, and a floor with a receding grid
      if (v < .8) c = v < .4 ? lerp(BG[0], BG[1], v / .4) : v < .66 ? lerp(BG[1], BG[2], (v - .4) / .26) : lerp(BG[2], BG[3], (v - .66) / .14);
      else {
        var z = 1 / (v - .74), gx = (u - ax / 2) * z * .9, gz = z * .35 + t * .25;
        c = (Math.abs(gx - Math.round(gx)) < .05 * z * .12 + .02 || Math.abs(gz - Math.round(gz)) < .06) ? GRID : FLOOR;
      }
      // pads
      var pa = ax / 2 - .34 * Math.min(1, ax / 1.25), pb = ax / 2 + .34 * Math.min(1, ax / 1.25);
      if (v > .82 && v < .85 && (Math.abs(u - pa) < .1 || Math.abs(u - pb) < .1)) c = [255, 255, 255];
      var near = u > mx0 && u < mx1 && v > my0;
      if (near) {
        // ghost trail and ghost arm (dithered half-tone)
        for (var i = 0; i < trail.length; i += 2) if (Math.abs(u - trail[i][0]) < px1 && Math.abs(v - trail[i][1]) < px1) c = lerp(c, GHOST, i / trail.length);
        var g1 = seg(u, v, G.base[0], G.base[1], G.el[0], G.el[1]), g2 = seg(u, v, G.el[0], G.el[1], G.ee[0], G.ee[1]);
        if ((g1 < gh2 || g2 < gh2 || Math.hypot(u - G.ee[0], v - G.ee[1]) < .02) && b < 9) c = GHOST;
        // reality: base, links, joints, gripper, block
        if (Math.abs(u - R.block[0]) < .05 && Math.abs(v - R.block[1]) < .05) c = v - (R.block[1] - .05) < px1 * 1.5 ? [255, 190, 150] : BLOCK;
        if (v > .76 && v < .82 && Math.abs(u - R.base[0]) < .07) c = BASE;
        var a1 = seg(u, v, R.base[0], R.base[1], R.el[0], R.el[1]), a2 = seg(u, v, R.el[0], R.el[1], R.ee[0], R.ee[1]);
        if (a1 < arm2 || a2 < arm2 * .7) c = ARM;
        if (Math.hypot(u - R.el[0], v - R.el[1]) < .026 || Math.hypot(u - R.base[0], v - R.base[1]) < .03) c = JOINT;
        if (Math.abs(v - R.ee[1] - .02) < .025 && (Math.abs(u - R.ee[0] - .045) < .008 || Math.abs(u - R.ee[0] + .045) < .008)) c = ARM;
        if (Math.abs(v - R.ee[1]) < .008 && Math.abs(u - R.ee[0]) < .05) c = ARM;
        // verifier: corner brackets around the gripper
        var onX = (Math.abs(u - bx0) < px1 || Math.abs(u - bx1) < px1) && v > by0 && v < by1, onY = (Math.abs(v - by0) < px1 || Math.abs(v - by1) < px1) && u > bx0 && u < bx1;
        var corner = (Math.min(Math.abs(u - bx0), Math.abs(u - bx1)) < .035) && (Math.min(Math.abs(v - by0), Math.abs(v - by1)) < .035);
        if ((onX || onY) && corner) c = bad ? BAD : OK;
      }
      // the scan beam
      var ds = u - scan;
      if (ds < 0 && ds > -.12) c = lerp(c, SCAN, (1 + ds / .12) * .35);
      if (Math.abs(ds) < px1) c = SCAN;
      return c;
    }

    for (var y = 0; y < H; y += bs)
      for (var x = 0; x < W; x += bs) {
        var cx = Math.min(W - 1, x + (bs >> 1)), cy = Math.min(H - 1, y + (bs >> 1));
        for (var yy = y; yy < Math.min(H, y + bs); yy++)
          for (var xx = x; xx < Math.min(W, x + bs); xx++) {
            var b = BAYER[(yy & 3) * 4 + (xx & 3)], c = color(bs > 1 ? cx : xx, bs > 1 ? cy : yy, b), i = (yy * W + xx) * 4;
            d[i] = dither(c[0], b); d[i + 1] = dither(c[1], b); d[i + 2] = dither(c[2], b); d[i + 3] = 255;
          }
      }
    ctx.putImageData(img, 0, 0);
    if (verdict && now - lastHud > 180) {
      lastHud = now;
      var score = Math.max(0, 1 - err * 6).toFixed(2);
      verdict.textContent = bad ? "✗ flagged · Δ " + err.toFixed(2) : "✓ verified · " + score;
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
