// site.js — theme picker, current nav link, seoul clock, drafting crosshair,
// count-up spec numbers and the github contribution chart.
var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// light or dark. until one is chosen the page follows the system; the choice is
// kept in localStorage and read back by the inline script in <head>.
(function theme() {
  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-set]");
  var meta = document.querySelector('meta[name="theme-color"]');
  var system = window.matchMedia("(prefers-color-scheme: dark)");
  var colors = { light: "#F1ECE1", dark: "#0D2744" };

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

// the header is identical on every page, so the current link is marked here
(function nav() {
  var page = document.body.getAttribute("data-page");
  var link = page && document.querySelector('header.site a[data-nav="' + page + '"]');
  if (link) link.setAttribute("aria-current", "page");
})();

// local time in seoul
(function clock() {
  var el = document.querySelector("[data-clock]");
  if (!el) return;
  var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });
  function tick() { el.textContent = fmt.format(new Date()); }
  tick();
  setInterval(tick, 15000);
})();

// a pencil crosshair that follows the cursor, with its coordinates
(function crosshair() {
  if (calm || !window.matchMedia("(pointer: fine)").matches) return;
  var x = document.createElement("div");
  x.className = "xhair";
  x.setAttribute("aria-hidden", "true");
  x.innerHTML = "<span></span>";
  document.body.appendChild(x);
  var label = x.firstChild, px = 0, py = 0, queued = false;
  function pad(n) { return ("000" + Math.round(n)).slice(-4); }
  function paint() {
    queued = false;
    x.style.setProperty("--x", px + "px");
    x.style.setProperty("--y", py + "px");
    label.textContent = "x " + pad(px) + " · y " + pad(py + window.scrollY);
  }
  document.addEventListener("pointermove", function (e) {
    px = e.clientX; py = e.clientY;
    x.classList.add("on");
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  });
  document.documentElement.addEventListener("pointerleave", function () { x.classList.remove("on"); });
})();

// spec numbers count up from zero when they scroll into view, keeping "$", "," and "+"
function countTo(text, t) {
  var m = /^(\D*)([\d,]+)(.*)$/.exec(text);
  if (!m) return text;
  var n = Math.round(parseInt(m[2].replace(/,/g, ""), 10) * t);
  return m[1] + (m[2].indexOf(",") > -1 ? n.toLocaleString("en-US") : String(n)) + m[3];
}
console.assert(countTo("$200,000", 1) === "$200,000" && countTo("5,400+", 0.5) === "2,700+" && countTo("8", 0) === "0", "countTo");
(function countUp() {
  var els = document.querySelectorAll(".sheet-table dd, .flow b");
  if (calm || !els.length || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target, final = el.textContent, start = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - start) / 1200);
        el.textContent = countTo(final, 1 - Math.pow(1 - t, 3));
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
})();

// github contributions for the last year, one square per day.
// shortcut: relies on the public github-contributions-api.jogruber.de proxy (github has no keyless api for this); on failure the chart just stays hidden.
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
        var col = Math.floor(i / 7);
        html += '<i data-l="' + d.level + '" style="--c:' + col + '" title="' + d.date + ": " + d.count + (d.count === 1 ? " contribution" : " contributions") + '"></i>';
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
