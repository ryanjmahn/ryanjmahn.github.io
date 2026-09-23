// plates.js — the one source of truth for plate photography.
//
// Each rotating plate has a set of three interchangeable photos (same crop,
// same pixel size, same quiet region for the headline). One variant per
// plate is picked per visit and kept in sessionStorage, so the wall stays
// put while you navigate and changes next time you come back.
//
// Loaded as a small blocking script in <head>. Each plate's inset then
// calls plateInset() from an inline script, which writes the chosen
// <picture> into the markup before first paint (no src swap after render,
// no layout shift). A <noscript> next to it carries variant a.
//
// Per-variant fields:
//   alt    describes the photo itself (it travels with the image)
//   scrim  how far the paper fade on the inset's left edge reaches, so a
//          straddle headline stays legible on this particular photo
//   fade   bright-band position for .plate--dark tonal-fade headlines
//          (unused by the current paper plates; kept per variant so a dark
//          plate can use the set without hardcoding one value)
//   pos    object-position, if the default centre crop needs nudging
//
// Add a photo: tools/process-images.sh, then a variant here, then a row
// in CREDITS.md.

(function () {
  var PLATES = {
    "001": {
      sizes: [1600, 2000], w: 1200, h: 1600, grade: "silver",
      variants: [
        { id: "a", scrim: "22%", fade: "50%", alt: "A lone hiker, tiny on a grassy slope under a sky filled with towering cumulus clouds." },
        { id: "b", scrim: "26%", fade: "50%", alt: "Two hikers, small on the skyline, crossing a wide grassy ridge beneath scattered clouds." },
        { id: "c", scrim: "22%", fade: "50%", alt: "A lone hiker standing on top of a tall rock pillar above a wide valley, a raven in flight beside them and clouds overhead." }
      ]
    },
    "002": {
      sizes: [1600, 2000], w: 1200, h: 1600, grade: "warm",
      variants: [
        { id: "a", scrim: "22%", fade: "50%", alt: "A wooden test tube rack, a row of identical holes above a row of identical drying pegs, on a plain white ground." },
        { id: "b", scrim: "22%", fade: "50%", alt: "A dark wooden test tube rack drilled with two rows of identical round holes, on a plain white ground." },
        { id: "c", scrim: "22%", fade: "50%", alt: "A wooden test tube rack seen side-on, its drying pegs standing in an even row beneath the holes." }
      ]
    },
    "003": {
      sizes: [1600, 2000], w: 1200, h: 1600, grade: "warm",
      variants: [
        { id: "a", scrim: "26%", fade: "50%", alt: "A 19th-century engraved map of the western hemisphere, the Americas drawn inside a ruled circle of meridians." },
        { id: "b", scrim: "26%", fade: "50%", alt: "A 19th-century engraved map of the eastern hemisphere: Europe, Africa, Asia and Australia inside a circle of meridians." },
        { id: "c", scrim: "26%", fade: "50%", alt: "A 1682 engraved world map, the western hemisphere filling the frame, coastlines and meridians drawn in fine line." }
      ]
    },
    "004": {
      sizes: [1600, 2000], w: 1200, h: 1600, grade: "silver",
      variants: [
        { id: "a", scrim: "22%", fade: "50%", alt: "An 1870s drafting room: architects seated around a long table covered in drawings, plaster casts on the wall behind them." },
        { id: "b", scrim: "22%", fade: "50%", alt: "The same 1870s drafting room from another angle, the team gathered at a table strewn with set squares and plans." },
        { id: "c", scrim: "30%", fade: "50%", alt: "A mid-century government drafting room, draftsmen in shirtsleeves bent over rows of large drawing tables." }
      ]
    },
    "005": {
      sizes: [1600, 1840], w: 1200, h: 1600, grade: "silver",
      variants: [
        { id: "a", scrim: "30%", fade: "50%", alt: "Micrograph of human pancreas: dense clusters of glandular cells divided by pale, branching bands of connective tissue." },
        { id: "b", scrim: "30%", fade: "50%", alt: "Micrograph of human pancreas, pale islets of hormone-producing cells scattered among darker glandular tissue." },
        { id: "c", scrim: "30%", fade: "50%", alt: "Micrograph of human pancreas, lobules of glandular tissue parted by a pale, branching duct system." }
      ]
    }
  };

  var KEY = "plates";
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var chosen = {};
  try { chosen = JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) {}
  var last = {};
  try { last = JSON.parse(localStorage.getItem(KEY + "-last")) || {}; } catch (e) {}

  function pick(num) {
    var plate = PLATES[num];
    if (saveData) return 0;
    var ids = plate.variants.map(function (v) { return v.id; });
    var i = ids.indexOf(chosen[num]);
    if (i >= 0) return i;
    // new visit: random, but not the one shown last visit
    var pool = ids.filter(function (id) { return id !== last[num]; });
    var id = pool[Math.floor(Math.random() * pool.length)];
    remember(num, id);
    return ids.indexOf(id);
  }

  function remember(num, id) {
    chosen[num] = id;
    last[num] = id;
    try { sessionStorage.setItem(KEY, JSON.stringify(chosen)); } catch (e) {}
    try { localStorage.setItem(KEY + "-last", JSON.stringify(last)); } catch (e) {}
  }

  function base(num, id) { return "/assets/img/plate-" + num + "-" + id; }

  function srcset(num, id, ext) {
    var p = PLATES[num];
    return p.sizes.map(function (long) {
      return base(num, id) + "-" + long + "." + ext + " " + Math.round(long * p.w / p.h) + "w";
    }).join(", ");
  }

  function pictureHTML(num, index, opts) {
    var p = PLATES[num], v = p.variants[index];
    var load = opts.load === "lazy"
      ? ' loading="lazy" decoding="async"'
      : ' loading="eager"' + (opts.load === "high" ? ' fetchpriority="high"' : "");
    return '<picture>' +
      '<source type="image/avif" srcset="' + srcset(num, v.id, "avif") + '" sizes="' + opts.sizes + '" />' +
      '<source type="image/webp" srcset="' + srcset(num, v.id, "webp") + '" sizes="' + opts.sizes + '" />' +
      '<img src="' + base(num, v.id) + "-" + p.sizes[0] + '.jpg" srcset="' + srcset(num, v.id, "jpg") + '" sizes="' + opts.sizes + '"' +
      ' alt="' + v.alt.replace(/"/g, "&quot;") + '" class="plate__photo grade-' + p.grade + '"' +
      ' width="' + p.w + '" height="' + p.h + '"' + load + (v.pos ? ' style="object-position:' + v.pos + '"' : "") + " />" +
      "</picture>";
  }

  function applyVars(inset, num, index) {
    var v = PLATES[num].variants[index];
    inset.style.setProperty("--scrim", v.scrim);
    var plate = inset.closest ? inset.closest(".plate") : null;
    if (plate) plate.style.setProperty("--fade-pos", v.fade);
  }

  // Called from an inline <script> inside each .plate__inset[data-plate].
  window.plateInset = function () {
    var script = document.currentScript;
    var inset = script.parentNode;
    var num = inset.getAttribute("data-plate");
    if (!PLATES[num]) return;
    var index = pick(num);
    inset.setAttribute("data-variant", PLATES[num].variants[index].id);
    applyVars(inset, num, index);
    script.insertAdjacentHTML("beforebegin", pictureHTML(num, index, {
      sizes: inset.getAttribute("data-sizes"),
      load: inset.getAttribute("data-load") || "lazy"
    }));
  };

  // Optional manual advance: click / Enter / Space on a plate's photo moves
  // to the next variant with a short crossfade (none under reduced motion).
  function enableAdvance() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var insets = document.querySelectorAll(".plate__inset[data-plate]");
    Array.prototype.forEach.call(insets, function (inset) {
      var num = inset.getAttribute("data-plate");
      var plate = PLATES[num];
      if (!plate || plate.variants.length < 2) return;
      var index = Math.max(0, plate.variants.map(function (v) { return v.id; }).indexOf(inset.getAttribute("data-variant")));
      var sizes = inset.getAttribute("data-sizes");
      var indexEl = inset.parentNode.querySelector(".plate__index");
      var countEl = document.createElement("span");
      countEl.className = "plate__count";
      if (indexEl) indexEl.insertBefore(countEl, indexEl.querySelector(".tri"));

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "plate__advance";
      btn.setAttribute("aria-label", "next photo");
      inset.parentNode.insertBefore(btn, inset.nextSibling);

      var preloaded = {};
      function preloadNext() {
        if (saveData) return;
        var next = (index + 1) % plate.variants.length;
        if (preloaded[next]) return;
        preloaded[next] = true;
        var holder = document.createElement("div");
        holder.innerHTML = pictureHTML(num, next, { sizes: sizes, load: "eager" });
        var img = holder.querySelector("img");
        img.decode ? img.decode().catch(function () {}) : null;
      }
      btn.addEventListener("pointerenter", preloadNext);
      btn.addEventListener("focus", preloadNext);

      btn.addEventListener("click", function () {
        index = (index + 1) % plate.variants.length;
        var id = plate.variants[index].id;
        var old = inset.querySelector("picture");
        var wrap = document.createElement("div");
        wrap.innerHTML = pictureHTML(num, index, { sizes: sizes, load: "eager" });
        var pic = wrap.firstChild;
        pic.className = "plate__incoming";
        inset.appendChild(pic);
        inset.setAttribute("data-variant", id);
        applyVars(inset, num, index);
        remember(num, id);
        countEl.textContent = " · " + (index + 1) + "/" + plate.variants.length;
        var img = pic.querySelector("img");
        var swap = function () {
          if (reduceMotion) { finish(); return; }
          requestAnimationFrame(function () { pic.classList.add("is-in"); });
          setTimeout(finish, 240);
        };
        var finish = function () {
          pic.className = "";
          if (old && old.parentNode) old.parentNode.removeChild(old);
        };
        (img.decode ? img.decode() : Promise.resolve()).then(swap, swap);
      });
    });
  }

  // exposed for tools/sync-plates.js (writes the <noscript> fallbacks)
  window.PLATES = PLATES;
  window.plateHTML = pictureHTML;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enableAdvance);
  else enableAdvance();
})();
