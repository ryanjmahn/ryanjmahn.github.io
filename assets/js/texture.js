// texture.js — the site's moving matter. Every section gets its own,
// echoing what it's about (see SECTIONS below):
//   - a dither field laid over each plate's light (Bayer, line screen,
//     halftone or stipple), following the pointer
//   - particles drifting over the page (dust, a lockstep lattice, a
//     constellation, cells, snow, ripples)
//   - ASCII: density strips heading the reading sheets, an ASCII "echo"
//     of the section's plate photo, and the home portrait resolving out
//     of noise
//
// All of it is decoration: aria-hidden, pointer-events none, paused when
// off-screen or in a background tab, and static (or absent) under
// prefers-reduced-motion. ASCII is drawn on canvas so screen readers and
// audits don't read it as tiny text. Colours come from the CSS tokens.

(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = getComputedStyle(document.documentElement);

  var SECTIONS = {
    home:        { dither: "bayer",    particles: "dust",          strip: ["%#*@", "+=*-", ":.-. "] },
    built:       { dither: "lines",    particles: "lattice",       strip: ["[##]", "[==]", "[--]"], repeat: true },
    initiatives: { dither: "halftone", particles: "constellation", strip: ["@Oo.", "Oo. ", "o.  "] },
    research:    { dither: "stipple",  particles: "cells",         strip: ["ACGT", "ACGT", "acgt"] },
    cv:          { dither: "bayer",    particles: "constellation", strip: ["01", "01", "0 1 "] },
    contact:     { dither: "halftone", particles: "ripples",       strip: ["~~=~", "~-~ ", "-.  "] },
    diary:       { dither: "stipple",  particles: "snow",          strip: ["abcdefg", "hijklmn", ".,;:' "] },
    "404":       { dither: "bayer",    particles: "dust",          strip: ["?!?#", "?-?.", ".?  "] }
  };
  var section = SECTIONS[document.body.getAttribute("data-page")] || SECTIONS.home;

  function token(name) {
    var hex = root.getPropertyValue(name).trim();
    var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
  }
  var ICE = token("--blue-100");
  var ON_DARK = token("--on-dark");
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")"; }

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
     1. Dither field — laid over each plate's light in 2px ice-blue
     cells, masked out of the type column. The pattern is the section's:
       bayer    4x4 ordered dither
       lines    a horizontal line screen (repetition, for "reproducible")
       halftone round dots on a 45° screen, like a printed map
       stipple  scattered grain, like a micrograph
     --------------------------------------------------------------- */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var CELL = 2;
  var THRESHOLD = {
    bayer: function (x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16; },
    lines: function (x, y) { return ((y % 4) + .5) / 4; },
    halftone: function (x, y) {
      var P = 5, u = (x + y) / Math.SQRT2, v = (x - y) / Math.SQRT2;
      var du = (((u % P) + P) % P) - P / 2, dv = (((v % P) + P) % P) - P / 2;
      return Math.sqrt(du * du + dv * dv) / (P / Math.SQRT2);
    },
    stipple: function (x, y) {
      var h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return h - Math.floor(h);
    }
  };
  var threshold = THRESHOLD[section.dither];

  function ditherPlate(plate) {
    var canvas = document.createElement("canvas");
    canvas.className = "plate__dither";
    canvas.setAttribute("aria-hidden", "true");
    // above the photo (z 1, after the inset), under the type (z 2+)
    plate.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var cols = 0, rows = 0, img = null, table = null;
    var pointer = null, pending = false, visible = false;

    function size() {
      var r = plate.getBoundingClientRect();
      cols = Math.max(1, Math.ceil(r.width / CELL));
      rows = Math.max(1, Math.ceil(r.height / CELL));
      canvas.width = cols;
      canvas.height = rows;
      img = ctx.createImageData(cols, rows);
      table = new Float32Array(cols * rows);
      for (var y = 0; y < rows; y++)
        for (var x = 0; x < cols; x++) table[y * cols + x] = threshold(x, y);
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
          if (val * val > table[y * cols + x]) {
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
     2. Particles — one fixed canvas over the page, behaviour per
     section. Tiny and faint enough to cross text.
     --------------------------------------------------------------- */
  var PARTICLES = {
    // motes drifting up through the light
    dust: {
      count: function (W, H) { return Math.min(90, W * H / 16000); },
      make: function (W, H, fresh) {
        return { x: Math.random() * W, y: fresh ? H + 10 : Math.random() * H, r: .5 + Math.random() * 1.1,
          vy: .08 + Math.random() * .3, ph: Math.random() * 6.28, a: .12 + Math.random() * .4, ice: Math.random() < .5 };
      },
      step: function (p, t, W, H, ctx) {
        p.y -= p.vy; p.x += Math.sin(p.ph + t * .01) * .15;
        if (p.y < -10) return false;
        ctx.fillStyle = rgba(p.ice ? ICE : ON_DARK, p.a * (.75 + .25 * Math.sin(t * .03 + p.ph)));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        return true;
      }
    },
    // snow falling (diary)
    snow: {
      count: function (W, H) { return Math.min(110, W * H / 12000); },
      make: function (W, H, fresh) {
        return { x: Math.random() * W, y: fresh ? -10 : Math.random() * H, r: .6 + Math.random() * 1.4,
          vy: .25 + Math.random() * .6, ph: Math.random() * 6.28, a: .2 + Math.random() * .45 };
      },
      step: function (p, t, W, H, ctx) {
        p.y += p.vy; p.x += Math.sin(p.ph + t * .015) * .35;
        if (p.y > H + 10) return false;
        ctx.fillStyle = rgba(ON_DARK, p.a);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        return true;
      }
    },
    // cells in Brownian drift, ring-shaped (research)
    cells: {
      count: function (W, H) { return Math.min(34, W * H / 38000); },
      make: function (W, H) {
        return { x: Math.random() * W, y: Math.random() * H, r: 3 + Math.random() * 8, vx: 0, vy: 0,
          a: .12 + Math.random() * .22, ph: Math.random() * 6.28 };
      },
      step: function (p, t, W, H, ctx) {
        p.vx = p.vx * .96 + (Math.random() - .5) * .08; p.vy = p.vy * .96 + (Math.random() - .5) * .08;
        p.x = (p.x + p.vx + W) % W; p.y = (p.y + p.vy + H) % H;
        var r = p.r * (1 + .06 * Math.sin(t * .02 + p.ph));
        ctx.strokeStyle = rgba(ICE, p.a); ctx.fillStyle = rgba(ICE, p.a * .25); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = rgba(ON_DARK, p.a * 1.4);
        ctx.beginPath(); ctx.arc(p.x + r * .25, p.y - r * .2, Math.max(.8, r * .22), 0, 6.283); ctx.fill();
        return true;
      }
    },
    // ripples opening on still water (contact)
    ripples: {
      count: function () { return 7; },
      make: function (W, H) {
        return { x: Math.random() * W, y: Math.random() * H, r: 0, max: 40 + Math.random() * 70, delay: Math.random() * 240 };
      },
      step: function (p, t, W, H, ctx) {
        if (p.delay > 0) { p.delay--; return true; }
        p.r += .35;
        if (p.r > p.max) return false;
        var a = .3 * (1 - p.r / p.max);
        ctx.strokeStyle = rgba(ICE, a); ctx.lineWidth = 1;
        for (var k = 0; k < 3; k++) {
          var rr = p.r - k * 9;
          if (rr > 0) { ctx.beginPath(); ctx.ellipse(p.x, p.y, rr, rr * .35, 0, 0, 6.283); ctx.stroke(); }
        }
        return true;
      }
    },
    // one lattice of identical points, all moving in lockstep (built)
    lattice: {
      field: true,
      draw: function (ctx, t, W, H) {
        var S = 56;
        var ox = Math.sin(t * .012) * 8, oy = Math.cos(t * .009) * 6;
        ctx.fillStyle = rgba(ON_DARK, .22);
        for (var y = S / 2; y < H + S; y += S)
          for (var x = S / 2; x < W + S; x += S) ctx.fillRect(x + ox - 1, y + oy - 1, 2, 2);
      }
    },
    // points drifting, linked when they come near each other (initiatives, cv)
    constellation: {
      field: true,
      init: function (W, H) {
        var n = Math.round(Math.min(70, W * H / 18000)), ps = [];
        for (var i = 0; i < n; i++) ps.push({ x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, a: .25 + Math.random() * .35 });
        return ps;
      },
      draw: function (ctx, t, W, H, ps) {
        var R = 130, i, j;
        for (i = 0; i < ps.length; i++) {
          ps[i].x = (ps[i].x + ps[i].vx + W) % W; ps[i].y = (ps[i].y + ps[i].vy + H) % H;
        }
        ctx.lineWidth = 1;
        for (i = 0; i < ps.length; i++)
          for (j = i + 1; j < ps.length; j++) {
            var dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < R) {
              ctx.strokeStyle = rgba(ICE, .16 * (1 - d / R));
              ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke();
            }
          }
        for (i = 0; i < ps.length; i++) {
          ctx.fillStyle = rgba(ON_DARK, ps[i].a);
          ctx.beginPath(); ctx.arc(ps[i].x, ps[i].y, 1.2, 0, 6.283); ctx.fill();
        }
      }
    }
  };

  (function particles() {
    if (reduceMotion) return;
    var kind = PARTICLES[section.particles];
    var canvas = document.createElement("canvas");
    canvas.className = "particles";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W, H, list = [], state = null;

    function size() {
      W = innerWidth; H = innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      if (kind.field) { state = kind.init ? kind.init(W, H) : null; return; }
      list = [];
      for (var i = 0, n = Math.round(kind.count(W, H)); i < n; i++) list.push(kind.make(W, H, false));
    }
    var running = true, t = 0;
    function frame() {
      if (!running) return;
      t += 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (kind.field) kind.draw(ctx, t, W, H, state);
      else for (var i = 0; i < list.length; i++)
        if (!kind.step(list[i], t, W, H, ctx)) list[i] = kind.make(W, H, true);
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
     ASCII, drawn on canvas.
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
      ctx.fillStyle = rgba(rgb, alpha);
      for (var r = 0; r < ls.length; r++)
        for (var c = 0; c < ls[r].length; c++)
          if (ls[r][c] !== " ") ctx.fillText(ls[r][c], c * cw, r * lh);
    };
  }

  /* 3. ASCII density strips heading each reading sheet, in the section's
     own characters. A few re-roll each tick, like film grain in type.
     (built's strip is one token repeated exactly — no re-rolls.) */
  var BANDS = section.strip;
  function stripRows(cols) {
    return BANDS.map(function (band, row) {
      var s = "";
      for (var i = 0; i < cols; i++) {
        if (section.repeat) { s += band[i % band.length]; continue; }
        // sparser toward the bottom row and toward the right edge
        var keep = (1 - row * .28) * (1 - .55 * i / cols);
        s += Math.random() < keep ? band[(Math.random() * band.length) | 0] : " ";
      }
      return s;
    });
  }
  function strip(host) {
    var el = document.createElement("canvas");
    el.className = "ascii-strip";
    el.setAttribute("aria-hidden", "true");
    host.insertBefore(el, host.firstChild);
    var FONT = 10, rows = [], draw = null, visible = false;
    function fill() {
      var cols = Math.max(8, Math.floor((host.clientWidth - 32) / (FONT * .6)));
      rows = stripRows(cols);
      draw = asciiCanvas(el, rows, FONT, ON_DARK, .34);
      draw(rows);
    }
    fill();
    window.addEventListener("resize", fill, { passive: true });
    if (reduceMotion || section.repeat) return;
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
  document.querySelectorAll(".sheet").forEach(strip);

  /* 4. ASCII echo — the section's plate photo (whichever variant this
     visit drew) re-rendered in type inside its reading panel. */
  var RAMP = " .:-=+*#%@"; // dark -> bright: bright light becomes dense type
  function echo(img, host) {
    function render() {
      var cols = 64;
      var ratio = img.naturalHeight / img.naturalWidth;
      var rows = Math.max(8, Math.round(cols * ratio * .5));
      var c = document.createElement("canvas");
      c.width = cols; c.height = rows;
      var x = c.getContext("2d");
      x.drawImage(img, 0, 0, cols, rows);
      var px;
      try { px = x.getImageData(0, 0, cols, rows).data; } catch (e) { return; }
      var lines = [];
      for (var y = 0; y < rows; y++) {
        var s = "";
        for (var i = 0; i < cols; i++) {
          var k = (y * cols + i) * 4;
          var l = (.299 * px[k] + .587 * px[k + 1] + .114 * px[k + 2]) / 255;
          s += RAMP[Math.min(RAMP.length - 1, Math.floor(l * RAMP.length))];
        }
        lines.push(s.replace(/\s+$/, ""));
      }
      var canvas = document.createElement("canvas");
      canvas.className = "ascii-echo";
      canvas.setAttribute("aria-hidden", "true");
      host.appendChild(canvas);
      function fit() {
        var font = Math.min(8, host.clientWidth / cols / .6);
        asciiCanvas(canvas, lines, font, ON_DARK, .5)(lines);
      }
      fit();
      window.addEventListener("resize", fit, { passive: true });
    }
    if (img.complete && img.naturalWidth) render();
    else img.addEventListener("load", render, { once: true });
  }
  var entries = document.querySelectorAll(".entry");
  entries.forEach(function (entry) {
    var img = entry.querySelector(".plate .plate__photo");
    var host = entry.querySelector(".entry__detail");
    if (img && host) echo(img, host);
  });
  var column = document.querySelector(".sheet > .quiet-column");
  var plateImg = document.querySelector(".plate .plate__photo");
  if (!entries.length && column && plateImg) echo(plateImg, column);

  /* 5. ASCII portrait — the <pre> is the no-JS fallback; with JS it's
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
    var NOISE = "@%#*+=-:.";
    var order = target.map(function (l) { return Array.prototype.map.call(l, Math.random); });
    function noisy(p) {
      return target.map(function (line, r) {
        var out = "";
        for (var c = 0; c < line.length; c++) {
          var ch = line[c];
          out += order[r][c] < p ? ch : (ch === " " && Math.random() < .75 ? " " : NOISE[(Math.random() * NOISE.length) | 0]);
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
