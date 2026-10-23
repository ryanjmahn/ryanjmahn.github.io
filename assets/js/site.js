// site.js — the theme picker: light, dark or ghibli. Until one is chosen
// the page follows the system (light/dark); the choice is kept in
// localStorage and read back by the inline script in <head>.
(function theme() {
  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-set]");
  var meta = document.querySelector('meta[name="theme-color"]');
  var system = window.matchMedia("(prefers-color-scheme: dark)");
  var colors = { light: "#FBFAF7", dark: "#0D0C0B", ghibli: "#BCDDEE" };

  function current() { return root.getAttribute("data-theme") || (system.matches ? "dark" : "light"); }
  function sync() {
    var t = current();
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute("aria-pressed", String(buttons[i].getAttribute("data-set") === t));
    if (meta) meta.setAttribute("content", colors[t]);
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      var t = this.getAttribute("data-set");
      root.setAttribute("data-theme", t);
      try { localStorage.setItem("theme", t); } catch (e) {}
      sync();
    });
  }
  system.addEventListener("change", sync);
  sync();
})();
