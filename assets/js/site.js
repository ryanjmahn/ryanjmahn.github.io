// site.js — nav, scroll-reveal, parallax. Shared, byte-identical include
// on every page. Respects prefers-reduced-motion throughout.

(function nav() {
  var navEl = document.querySelector(".site-nav");
  if (navEl) {
    var setScrolled = function () {
      navEl.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  var menuBtn = document.querySelector(".site-nav__menu-btn");
  var overlay = document.querySelector(".site-nav__overlay");
  var closeBtn = document.querySelector(".site-nav__overlay-close");
  if (menuBtn && overlay) {
    var open = function () {
      overlay.classList.add("is-open");
      menuBtn.setAttribute("aria-expanded", "true");
    };
    var close = function () {
      overlay.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.focus();
    };
    menuBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }
})();

(function reveal() {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = Number(el.dataset.revealDelay || 0);
      setTimeout(function () { el.classList.add("is-visible"); }, delay);
      io.unobserve(el);
    });
  }, { threshold: .15 });
  targets.forEach(function (el) { io.observe(el); });
})();

(function countUp() {
  // The real value is in the markup (e.g. "$200k+"), so no-JS readers,
  // crawlers and link previews see it. JS only reads the target from
  // data-count-to, swaps the number inside that text for 0 itself, and
  // animates back up to the value that was already there.
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nums = document.querySelectorAll("[data-count-to]");
  if (!nums.length || reduceMotion || !("IntersectionObserver" in window)) return;

  var NUMBER = /[\d,]+/;
  function render(el, value) {
    el.textContent = el.dataset.countText.replace(NUMBER, value.toLocaleString("en-US"));
  }

  nums.forEach(function (el) {
    el.dataset.countText = el.textContent;
    render(el, 0);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = Number(el.dataset.countTo);
      var duration = 1100;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        render(el, Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = el.dataset.countText;
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: .4 });
  nums.forEach(function (el) { io.observe(el); });
})();

(function parallax() {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || window.innerWidth < 720) return;
  var headlines = document.querySelectorAll(".plate--dark .plate__headline");
  if (!headlines.length) return;
  var ticking = false;
  function update() {
    headlines.forEach(function (el) {
      var plate = el.closest(".plate");
      var rect = plate.getBoundingClientRect();
      var progress = 1 - (rect.top + rect.height / 2) / (window.innerHeight + rect.height);
      var offset = Math.max(-1, Math.min(1, progress * 2 - 1)) * 15;
      el.style.transform = "translateY(" + offset + "px)";
    });
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
})();

(function ditherField() {
  // A cursor-following ordered-dither field — same spirit as the old
  // ASCII particle field (retired per the poster-plates revamp), redrawn
  // as halftone stipple instead of characters. Desktop + hover-capable
  // only, stepped at ~10fps (not rAF-smooth) to read as print, not video.
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;
  if (reduceMotion || !canHover || window.innerWidth < 1100) return;

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = [
    "position:fixed", "inset:0", "z-index:2", "pointer-events:none",
    "width:100%", "height:100%", "opacity:.09",
    "mix-blend-mode:multiply", "image-rendering:pixelated",
  ].join(";");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d", { alpha: true });

  var ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#111110";
  var inkRGB = (function () {
    var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(ink);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [17, 17, 16];
  })();

  var BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  var cols = 160;
  var rows = Math.round(cols * (window.innerHeight / window.innerWidth));
  canvas.width = cols;
  canvas.height = rows;

  var mouse = { x: cols / 2, y: rows / 2, active: false };
  var radius = cols * 0.32;

  function draw() {
    var img = ctx.createImageData(cols, rows);
    var data = img.data;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var dx = x - mouse.x;
        var dy = y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var value = Math.max(0, 1 - dist / radius);
        value = value * value;
        var threshold = BAYER[y % 4][x % 4] / 16;
        var i = (y * cols + x) * 4;
        if (value > threshold) {
          data[i] = inkRGB[0];
          data[i + 1] = inkRGB[1];
          data[i + 2] = inkRGB[2];
          data[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; draw(); }, 90);
  }

  window.addEventListener("mousemove", function (e) {
    mouse.x = (e.clientX / window.innerWidth) * cols;
    mouse.y = (e.clientY / window.innerHeight) * rows;
    mouse.active = true;
    schedule();
  }, { passive: true });

  window.addEventListener("resize", function () {
    if (window.innerWidth < 1100) {
      canvas.remove();
      return;
    }
    rows = Math.round(cols * (window.innerHeight / window.innerWidth));
    canvas.height = rows;
    schedule();
  }, { passive: true });

  draw();
})();

// ASCII-portrait easter egg, retired from the main layout per the
// poster-plates revamp — survives here and on /404.html only.
// Generated by: python3 tools/ascii.py photo assets/img/src/ryan.png --plain --cols 48 --bare
console.log(
  "%c" + "                    .:-:.:-=-:\n                 :+#%%%%%%%%%%%+:\n                =%%%%%%%%%%%%%%%%+\n               +%%%%%%%%%%%%%%%%%%*\n              :%%%%%%%%%%%%%%%%%%%#-\n              +%%%%#*****++*##%%%%%=\n              =%%%#+==+++=--=+#%%%%:\n               %%+=+===----====+#%*\n               #*=------::::-:---#-\n              :++--===:-:::-=--:-*-\n              :=+-::.::-:::...::-=-\n              .-==-:.:==:--:..::--.\n                .=-:::-=---:..:-.\n                 -=-:-=====-::--\n               -#%*=-:----:::-=*=.\n             -#@%@#*+-:::.::-==%%%-\n            *%%%%@#++*++===+=-=@%%%-\n          :#%%%%%%*=-=====--::-%%%%%+\n         +%%%%%%%%#=----::::::-#%%%%%#=.\n        #%%%%%%%%%%#=::::::::-#%%%%%%%%%=\n    .-+#%%%%%%%%%%%%%*-:::::-#%%%%%%%%%%%%*+-.\n.=*%%%%%%%%%%%%%%%%%%%%+::-+#%%%%%%%%%%%%%%%%%*-\n%%%%%%%%%%%%%%%%%%%%%%%%%#%%%%%%%%%%%%%%%%%%%%%%\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%" + "\n\n%cryan jaemin ahn — builder, seoul.",
  "font-family:monospace;line-height:1;", "font-weight:bold;"
);
