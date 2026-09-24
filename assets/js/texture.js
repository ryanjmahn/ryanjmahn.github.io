// texture.js — the site's moving matter: an ordered-dither field in each
// plate's light, dust motes drifting through it, ASCII density strips on
// the reading surfaces, and the ASCII portrait resolving out of noise.
//
// All of it is decoration: aria-hidden, pointer-events none, paused when
// off-screen or in a background tab, and static (or absent) under
// prefers-reduced-motion. Colours come from the CSS tokens.

(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = getComputedStyle(document.documentElement);

  function token(name) {
    var hex = root.getPropertyValue(name).trim();
    var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
  }
  var ICE = token("--blue-100");
  var ON_DARK = token("--on-dark");

  function smoothstep(a, b, x) {
    var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  // Only animate what's on screen.
  function whenVisible(el, onChange) {
    if (!("IntersectionObserver" in window)) { onChange(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { onChange(e.isIntersecting); });
    }).observe(el);
  }

  /* ---------------------------------------------------------------
     1. Dither field — a 4x4 Bayer ordered dither in 2px cells, drawn
     from the same light the CSS field uses (rising from the bottom,
     peaking low-right), in ice blue. Masked out of the type column.
     The pointer adds a soft pool of light that the dither follows.
     --------------------------------------------------------------- */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var CELL = 2;

  function ditherPlate(plate) {
    var canvas = document.createElement("canvas");
    canvas.className = "plate__dither";
    canvas.setAttribute("aria-hidden", "true");
    // above the photo (z 1, after the inset), under the type (z 2+)
    plate.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var cols = 0, rows = 0, img = null;
    var pointer = null, pending = false, visible = false;

    function size() {
      var r = plate.getBoundingClientRect();
      cols = Math.max(1, Math.ceil(r.width / CELL));
      rows = Math.max(1, Math.ceil(r.height / CELL));
      canvas.width = cols;
      canvas.height = rows;
      img = ctx.createImageData(cols, rows);
    }

    function draw() {
      pending = false;
      if (!img) return;
      var d = img.data;
      var narrow = cols * CELL < 720;
      for (var y = 0; y < rows; y++) {
        var v = y / rows;
        for (var x = 0; x < cols; x++) {
          var u = x / cols;
          // the light: a broad pool low-right, like --field-light
          var dx = (u - .78) / .62, dy = (v - 1.02) / .7;
          var val = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * .9;
          if (pointer) {
            var px = (u - pointer.u) * 1.6, py = (v - pointer.v) * 1.6 * rows / cols;
            val += Math.max(0, 1 - Math.sqrt(px * px + py * py) / .28) * .75;
          }
          // keep the type column (and on phones the bottom band) clear
          val *= smoothstep(.36, .56, u);
          if (narrow) val *= 1 - smoothstep(.55, .72, v);
          var i = (y * cols + x) * 4;
          if (val * val > (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16) {
            d[i] = ICE[0]; d[i + 1] = ICE[1]; d[i + 2] = ICE[2]; d[i + 3] = 255;
          } else {
            d[i + 3] = 0;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    function schedule() {
      if (pending || !visible) return;
      pending = true;
      setTimeout(function () { requestAnimationFrame(draw); }, 70); // ~12fps: print, not video
    }

    size();
    draw();
    if ("ResizeObserver" in window) new ResizeObserver(function () { size(); draw(); }).observe(plate);
    whenVisible(plate, function (on) { visible = on; });
    if (reduceMotion) return;
    plate.addEventListener("pointermove", function (e) {
      var r = plate.getBoundingClientRect();
      pointer = { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height };
      schedule();
    });
    plate.addEventListener("pointerleave", function () { pointer = null; schedule(); });
  }

  document.querySelectorAll(".plate--dark:not(.plate--type)").forEach(ditherPlate);

  /* ---------------------------------------------------------------
     2. Particles — sparse dust motes drifting up through the light,
     over the whole page (they're tiny and faint enough to cross text).
     --------------------------------------------------------------- */
  (function particles() {
    if (reduceMotion) return;
    var canvas = document.createElement("canvas");
    canvas.className = "particles";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W, H, motes = [];

    function mote(anyY) {
      return {
        x: Math.random() * W,
        y: anyY ? Math.random() * H : H + 10,
        r: (.5 + Math.random() * 1.1) * dpr,
        vy: (.08 + Math.random() * .3) * dpr,
        sway: Math.random() * Math.PI * 2,
        a: .12 + Math.random() * .4,
        ice: Math.random() < .5
      };
    }
    function size() {
      W = canvas.width = Math.round(innerWidth * dpr);
      H = canvas.height = Math.round(innerHeight * dpr);
      var n = Math.round(Math.min(90, innerWidth * innerHeight / 16000));
      motes = [];
      for (var i = 0; i < n; i++) motes.push(mote(true));
    }
    var running = true, t = 0;
    function frame() {
      if (!running) return;
      t += 1;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y -= m.vy;
        m.x += Math.sin(m.sway + t * .01) * .15 * dpr;
        if (m.y < -10) motes[i] = m = mote(false);
        var c = m.ice ? ICE : ON_DARK;
        var flicker = .75 + .25 * Math.sin(t * .03 + m.sway);
        ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (m.a * flicker).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", size, { passive: true });
    document.addEventListener("visibilitychange", function () {
      var was = running;
      running = !document.hidden;
      if (running && !was) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  })();

  /* ---------------------------------------------------------------
     ASCII is drawn on canvas, not as DOM text: it's texture, so it
     shouldn't be read as (tiny, faint) body text by screen readers,
     contrast audits or the legible-font-size audit.
     --------------------------------------------------------------- */
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  function asciiCanvas(canvas, lines, fontPx, rgb, alpha) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cols = lines.reduce(function (m, l) { return Math.max(m, l.length); }, 0);
    var cw = fontPx * .6, lh = fontPx;
    canvas.width = Math.ceil(cols * cw * dpr);
    canvas.height = Math.ceil(lines.length * lh * dpr);
    canvas.style.width = cols * cw + "px";
    canvas.style.height = lines.length * lh + "px";
    var ctx = canvas.getContext("2d");
    return function draw(ls) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cols * cw, ls.length * lh);
      ctx.font = fontPx + "px " + MONO;
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(" + rgb.join(",") + "," + alpha + ")";
      for (var r = 0; r < ls.length; r++)
        for (var c = 0; c < ls[r].length; c++)
          if (ls[r][c] !== " ") ctx.fillText(ls[r][c], c * cw, r * lh);
    };
  }

  /* 3. ASCII density strips — three rows of type falling from dense to
     sparse, heading each reading sheet and the footer. A few characters
     re-roll each tick, like film grain in type. */
  var BANDS = ["%#*@", "+=*-", ":.-. "];
  function stripRows(cols) {
    return BANDS.map(function (band, row) {
      var s = "";
      for (var i = 0; i < cols; i++) {
        // sparser toward the bottom row and toward the right edge
        var keep = (1 - row * .28) * (1 - .55 * i / cols);
        s += Math.random() < keep ? band[(Math.random() * band.length) | 0] : " ";
      }
      return s;
    });
  }
  function strip(host, before) {
    var el = document.createElement("canvas");
    el.className = "ascii-strip";
    el.setAttribute("aria-hidden", "true");
    if (before) host.parentNode.insertBefore(el, host);
    else host.insertBefore(el, host.firstChild);
    var FONT = 10, rows = [], draw = null, visible = false;
    function fill() {
      el.style.width = "";
      var width = el.parentNode === host ? host.clientWidth - 32 : host.clientWidth - 32;
      var cols = Math.max(8, Math.floor(width / (FONT * .6)));
      rows = stripRows(cols);
      draw = asciiCanvas(el, rows, FONT, ON_DARK, .34);
      draw(rows);
    }
    fill();
    window.addEventListener("resize", fill, { passive: true });
    if (reduceMotion) return;
    whenVisible(el, function (on) { visible = on; });
    setInterval(function () {
      if (!visible || document.hidden) return;
      var cols = rows[0].length;
      for (var k = 0; k < Math.ceil(cols * .04); k++) {
        var r = (Math.random() * rows.length) | 0, c = (Math.random() * cols) | 0;
        var ch = rows[r][c] === " " ? BANDS[r][(Math.random() * BANDS[r].length) | 0] : " ";
        rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1);
      }
      draw(rows);
    }, 140);
  }
  document.querySelectorAll(".sheet").forEach(function (s) { strip(s, false); });
  var footer = document.querySelector(".site-footer");
  if (footer) strip(footer, true);

  /* 4. ASCII portrait — the <pre> is the no-JS fallback; with JS it's
     drawn on a canvas sized to the frame, and resolves out of noise the
     first time it's seen in a visit. */
  (function portrait() {
    var frame = document.querySelector("[data-ascii-resolve]");
    var pre = frame && frame.querySelector(".ascii-portrait");
    if (!pre) return;
    var target = pre.textContent.split("\n");
    var canvas = document.createElement("canvas");
    canvas.className = "ascii-portrait-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", pre.getAttribute("aria-label"));
    pre.hidden = true;
    pre.parentNode.insertBefore(canvas, pre);
    var cols = target.reduce(function (m, l) { return Math.max(m, l.length); }, 0);
    var draw;
    function fit() {
      draw = asciiCanvas(canvas, target, frame.clientWidth / cols / .6, ON_DARK, 1);
      draw(target);
    }
    fit();
    window.addEventListener("resize", fit, { passive: true });

    var seen = false;
    try { seen = !!sessionStorage.getItem("ascii-resolved"); } catch (e) {}
    if (reduceMotion || seen) return;
    var RAMP = "@%#*+=-:.";
    var order = target.map(function (l) { return Array.prototype.map.call(l, Math.random); });
    function noisy(p) {
      return target.map(function (line, r) {
        var out = "";
        for (var c = 0; c < line.length; c++) {
          var ch = line[c];
          out += order[r][c] < p ? ch : (ch === " " && Math.random() < .75 ? " " : RAMP[(Math.random() * RAMP.length) | 0]);
        }
        return out;
      });
    }
    draw(noisy(0));
    var started = false;
    whenVisible(frame, function (on) {
      if (!on || started) return;
      started = true;
      var t0 = null, dur = 1400;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        draw(p < 1 ? noisy(1 - Math.pow(1 - p, 2)) : target);
        if (p < 1) setTimeout(function () { requestAnimationFrame(step); }, 50);
        else try { sessionStorage.setItem("ascii-resolved", "1"); } catch (e) {}
      }
      requestAnimationFrame(step);
    });
  })();
})();
