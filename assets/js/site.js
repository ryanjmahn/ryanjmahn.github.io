// site.js — nav, scroll-reveal, parallax. Shared, byte-identical include
// on every page. Respects prefers-reduced-motion throughout.

(function nav() {
  var navEl = document.querySelector(".site-nav");
  if (!navEl) return;
  var setScrolled = function () {
    navEl.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });

  // Mobile menu: the same link list, shown full-screen. While open, focus
  // is trapped in the nav, Esc closes, the page behind is inert and
  // doesn't scroll, and focus returns to the toggle on close.
  var toggle = navEl.querySelector(".site-nav__toggle");
  var menu = document.getElementById("site-menu");
  var main = document.getElementById("main");
  if (!toggle || !menu) return;
  var isOpen = false;

  function focusables() {
    return [navEl.querySelector(".site-nav__mark"), toggle].concat(
      Array.prototype.slice.call(menu.querySelectorAll("a")));
  }

  function setOpen(open, restoreFocus) {
    isOpen = open;
    navEl.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "close" : "menu";
    if (main) main.inert = open;
    if (open) {
      var first = menu.querySelector("a");
      if (first) first.focus();
    } else if (restoreFocus) {
      toggle.focus();
    }
  }

  toggle.addEventListener("click", function () { setOpen(!isOpen, true); });

  document.addEventListener("keydown", function (e) {
    if (!isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); setOpen(false, true); return; }
    if (e.key !== "Tab") return;
    var items = focusables();
    var i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });

  menu.addEventListener("click", function (e) {
    if (isOpen && e.target.closest("a")) setOpen(false, false);
  });

  window.matchMedia("(min-width: 721px)").addEventListener("change", function (mq) {
    if (mq.matches && isOpen) setOpen(false, false);
  });
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

(function stagger() {
  // Rows are watched one by one rather than as a whole list: a long list
  // on a phone can be taller than the viewport and would never reach a
  // list-level threshold. Rows that enter together get increasing delays.
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".hairline-list > li, .highlights > li, .now-strip__item");
  if (!items.length) return;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.style.setProperty("--stagger", (n++ * 90) + "ms");
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el) { io.observe(el); });
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

// ASCII-portrait easter egg, retired from the main layout per the
// poster-plates revamp — survives here and on /404.html only.
// Generated by: python3 tools/ascii.py photo assets/img/src/ryan.png --plain --cols 48 --bare
console.log(
  "%c" + "                    .:-:.:-=-:\n                 :+#%%%%%%%%%%%+:\n                =%%%%%%%%%%%%%%%%+\n               +%%%%%%%%%%%%%%%%%%*\n              :%%%%%%%%%%%%%%%%%%%#-\n              +%%%%#*****++*##%%%%%=\n              =%%%#+==+++=--=+#%%%%:\n               %%+=+===----====+#%*\n               #*=------::::-:---#-\n              :++--===:-:::-=--:-*-\n              :=+-::.::-:::...::-=-\n              .-==-:.:==:--:..::--.\n                .=-:::-=---:..:-.\n                 -=-:-=====-::--\n               -#%*=-:----:::-=*=.\n             -#@%@#*+-:::.::-==%%%-\n            *%%%%@#++*++===+=-=@%%%-\n          :#%%%%%%*=-=====--::-%%%%%+\n         +%%%%%%%%#=----::::::-#%%%%%#=.\n        #%%%%%%%%%%#=::::::::-#%%%%%%%%%=\n    .-+#%%%%%%%%%%%%%*-:::::-#%%%%%%%%%%%%*+-.\n.=*%%%%%%%%%%%%%%%%%%%%+::-+#%%%%%%%%%%%%%%%%%*-\n%%%%%%%%%%%%%%%%%%%%%%%%%#%%%%%%%%%%%%%%%%%%%%%%\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%" + "\n\n%cryan ahn — builder, seoul.",
  "font-family:monospace;line-height:1;", "font-weight:bold;"
);
