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

// ASCII-portrait easter egg, retired from the main layout per the
// poster-plates revamp — survives here and on /404.html only.
console.log(
  "%cryan jaemin ahn%c — builder, seoul.\nthe old ASCII portrait lives on at /404.html.",
  "font-weight:bold;", "font-weight:normal;"
);
