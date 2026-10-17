// site.js — shared on every page: the light/dark toggle, the log's
// scroll-in, and a warning while any writing slot is still empty.

// light / dark: follows the system until the toggle is used, then the
// choice is kept in localStorage (read back by the inline script in
// <head>). Canvases redraw on the "themechange" event.
(function theme() {
  var root = document.documentElement;
  var button = document.querySelector(".theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');
  var system = window.matchMedia("(prefers-color-scheme: dark)");

  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : system.matches;
  }
  function sync() {
    var dark = isDark();
    if (button) {
      button.textContent = dark ? "light" : "dark";
      button.setAttribute("aria-label", "Switch to " + (dark ? "light" : "dark") + " mode");
    }
    if (meta) meta.setAttribute("content", dark ? "#0D0C0B" : "#F2EFE9");
  }

  sync();
  system.addEventListener("change", sync);
  if (!button) return;
  button.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    sync();
    document.dispatchEvent(new Event("themechange"));
  });
})();

// log entries fade and rise into place as they scroll in
(function reveal() {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    for (var i = 0; i < els.length; i++) els[i].classList.add("is-in");
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  for (var j = 0; j < els.length; j++) io.observe(els[j]);
})();

// RYAN-WRITES slots render as .todo; say so until they're all filled
(function todo() {
  var n = document.querySelectorAll(".todo").length;
  if (n) console.warn(n + " RYAN-WRITES slot" + (n > 1 ? "s" : "") + " still empty on this page");
})();
