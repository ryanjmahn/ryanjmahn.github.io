// gallery.js — the log as a gallery wall. On a wide screen the section is
// made tall enough to hold the track's width, its stage is pinned, and the
// page's scroll walks the track sideways. A rail shows how far along the
// wall you are. Tabbing to a panel's link brings that panel into view. On a
// phone, under reduced motion or without the script, the panels just stack.

(function gallery() {
  var section = document.querySelector(".gallery");
  if (!section) return;
  var track = section.querySelector(".gallery__track");
  var bar = section.querySelector(".gallery__bar i");
  var at = section.querySelector(".gallery__at");
  var panels = track.querySelectorAll(".panel:not(.panel--intro)");
  var wide = window.matchMedia("(min-width: 901px)");
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var pinned = false, travel = 0, ticking = false;

  function measure() {
    pinned = wide.matches && !still.matches;
    section.classList.toggle("is-pinned", pinned);
    if (!pinned) { section.style.height = ""; track.style.transform = ""; return; }
    travel = Math.max(0, track.scrollWidth - innerWidth);
    section.style.height = travel + innerHeight + "px";
    move();
  }

  function progress() {
    var top = section.getBoundingClientRect().top;
    return travel ? Math.min(1, Math.max(0, -top / travel)) : 0;
  }

  function move() {
    ticking = false;
    if (!pinned) return;
    var p = progress();
    track.style.transform = "translate3d(" + (-p * travel).toFixed(1) + "px, 0, 0)";
    if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    // the panel nearest the middle of the screen is the one you're at
    var mid = innerWidth / 2, best = 0, bestD = Infinity;
    for (var i = 0; i < panels.length; i++) {
      var r = panels[i].getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (at) at.textContent = String(best + 1).padStart(2, "0");
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(move); }
  }, { passive: true });
  window.addEventListener("resize", measure);
  wide.addEventListener("change", measure);
  still.addEventListener("change", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  // keyboard: a focused link in a panel off to the side brings it into view
  track.addEventListener("focusin", function (e) {
    if (!pinned) return;
    var panel = e.target.closest(".panel");
    if (!panel) return;
    var x = Math.min(travel, Math.max(0, panel.offsetLeft - (innerWidth - panel.offsetWidth) / 2));
    var top = section.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top + x);
  });

  measure();
})();
