# Punch List — ryanjmahn.github.io v2 (strict black & white)

Fix-by-fix corrections for the site as currently deployed. **Do not add new ideas or new sections until every item here is done.** Work top to bottom; commit at each phase boundary. Items marked **[blocking]** break correctness, accessibility, or content accuracy — do those first.

This supersedes the color-grading section of the previous build prompt (`portfolio-revamp-prompt.md`). Everything else in that document still stands.

---

## Phase 0 — Direction correction: strict monochrome

The reference is a wall of posters that are **all pure black-and-white**. The site currently uses a color hero (orange alpenglow Everest) and the spec allowed `grade-film` / `grade-cyan` / an oxidized-red accent. Remove all of it.

1. **[blocking]** Delete the `--accent` token and every use of it (`▼` marks, current-nav underline, headline periods). Current page in nav is marked with an ink underline only.
2. **[blocking]** Delete the `.grade-film` and `.grade-cyan` presets. Keep only:
   - `.grade-silver` — `grayscale(1) contrast(1.22) brightness(.95)`, blacks lifted ~4% so nothing is pure `#000`.
   - `.grade-warm` — `grayscale(1) sepia(.18) contrast(1.15)`, used at most on two paper plates for print warmth. Still reads as black-and-white.
3. **[blocking]** Bake grayscale into the exported image files (see Phase 2), don't rely on the CSS filter alone. A CSS-only filter means the color original flashes during decode on slow connections and shows through in any context that strips filters (RSS, OG preview, print).
4. Page palette is exactly: `--paper #E9E7E2`, `--paper-2 #DEDBD4`, `--ink #111110`, `--ink-2 #5B5A56`, `--rule rgba(17,17,16,.18)`. Grep the CSS for any other hex, `hsl(`, or `rgb(` value with saturation and remove it.
5. Keep all texture work from §4.8 of the original prompt (paper fiber, grain, vignette, dust/scratches, lit dark plates). Monochrome does not mean flat.

---

## Phase 1 — Content and correctness bugs

6. **[blocking] Animated stat counters have no no-JS value.** On `/initiatives/` the stats currently serialize as `0 youths reached`, `0 nations`, `$0 raised in prizes`, `0 hackathons directed`. That's what search engines, previews, and any user with JS blocked see — the page states zero for every achievement. Fix: put the real values in the HTML (`<span data-count-to="4500">4,500+</span>`), and have JS read the final value from the attribute, set the start state itself, and animate up. Never initialize a counter's text to `0` in markup.
7. **[blocking] The home "now" strip is missing.** The four stats (`4,500+ youths reached`, `132 nations`, `$200k+ raised in prizes`, `3 hackathons directed`) exist only on `/initiatives/`. Restore them on the home page between the intro block and the latest-writing line, as a hairline-separated row per §2.3 of the original prompt. Keeping them on `/initiatives/` too is fine.
8. **[blocking] "researches" is not a word in this context.** Nav label, page `<title>`, `<h1>`/kicker, and caption-row label must all read `research` (the URL `/research/` is already correct). Check every page — the nav is duplicated in seven files.
9. **Caption rows are inconsistent.** Home shows one caption row for two plates; `/initiatives/` shows a merged `STEMise · Hackathons … 03 / 04`. Rule: **one caption row per plate**, directly under that plate, with its own two-digit number. Plate 002's caption (`Probix Labs · Proof, not promises. · 02`) is missing on home.
10. **Duplicated identity elements on home.** The page currently has a portrait photo, the old ASCII portrait, and a stray text node reading `photo`. Pick one portrait treatment — recommendation: keep the photographic portrait (it belongs to the poster language), move the ASCII to `console.log` and `/404.html` as originally specced. Delete the stray `photo` string (it looks like a leftover caption or an alt attribute that escaped).
11. **Probix plate is missing its quote block.** Add the pull quote and the Korean line under it, per Plate 002 in the original prompt, with the `TODO(ryan)` comment for verifying the Korean.
12. **Section pages are too thin.** `/built/` is one plate plus two sentences; `/research/` is one plate plus two one-line entries. A visitor who clicks "built" should get more than the home page already told them. For each, add a second content tier using only facts I've given you, and insert `<!-- TODO(ryan): ... -->` where you need more:
    - `/built/` — role and dates, what Probix Labs does in 2–3 sentences, the recognition line (YC F26 top 10%, Founders Inc. top 10%, $2,500 grant from Todd), an outbound link block to tryprobix.com. TODO: founding date, team size, current product status.
    - `/research/` — for each study: one-sentence problem, method, status. TODO: status, collaborators, links/preprints.
    - `/initiatives/` — split STEMise and the hackathons into two clearly separated entries, each with its own caption-row-numbered plate and its own detail block. TODO: hackathon names and years.
    - `/cv/`, `/contact/` — verify they exist and match the template; add `/shelf/` only if I've supplied books, otherwise leave it out of the nav entirely rather than shipping an empty page.
13. **Decide the wordmark.** It currently renders `/ra`; the spec said `/재민`. Use `/재민` — it's distinctive, it matches the `재민` display type on home, and `/ra` reads like a placeholder. Keep `ryan jaemin ahn` as the `aria-label`.
14. **Definition copy audit.** `132 nations.` followed by `[noun] the ability to reach, or be present in, places you've never stood.` doesn't parse as a dictionary entry — the headline isn't the word being defined. Either make the defined word the headline (`Reach.` / `[noun] …`) and put `132 nations` as the sub-line, or drop the bracket-definition on that plate and use the sub-line only. Same check on every plate: the `[part of speech]` block only appears where the headline is genuinely a single defined term.

---

## Phase 2 — Photography: new picks, and a rotating set per plate

Current images are generic stock that don't map to the content: a San Francisco skyline for "Reproducible", the Apollo moon for STEMise, a boxing match for hackathons, a color Everest for the hero. Decoration with no relationship to the section reads as filler no matter how good the photo is; the point of the poster format is that each plate is *about* the thing beneath it.

Two changes here: re-source the photos, and give each plate a **set of three** that rotates between visits, the way a poster wall changes as you walk past it.

### 2a. Re-source the photos

15. **[blocking]** Build a set of **three** photos per plate against the briefs below. Requirements for every image: genuinely monochrome or convincingly convertible (strong tonal range, not a flat color photo); **one subject, small in frame, with a large clear area for the headline**; high contrast with blown highlights and deep shadows; no logos, no identifiable faces without a license that allows it. Confirm each license (Unsplash License, CC0, or public domain) and record source URL + author + license in `/CREDITS.md`.
    - **001 home — "Build responsibly."** A lone climber or walker, tiny, under a large open sky. Search: `lone climber ridge black and white`, `mountaineer silhouette summit`, `hiker ridge fog`.
    - **002 Probix — "Reproducible."** The image should say *repetition and verification*, not "tech company". Best fits: a photographic contact sheet (a grid of near-identical frames), rows of identical flasks or test tubes, an archival lab-notebook page. Search: `contact sheet negatives black and white`, `rows of test tubes laboratory`, `laboratory notebook archival public domain`.
    - **003 STEMise — "132 nations."** Reach and teaching, not the moon. Search: `students classroom black and white`, `old world map public domain`, `long exposure flight paths night`.
    - **004 Hackathons — "2,000+ builders."** People building together. The boxing photo reads as competition-as-combat and is off-tone. Search: `auditorium crowd black and white`, `people laptops hall`, `workshop many people working`.
    - **005 Research — "PDAC."** A CT or MRI slice (the actual object of segmentation work) maps better than generic fluorescence microscopy, and survives grayscale conversion — fluorescence images lose their meaning when their channel colors are removed. Search NIH / NCI Visuals Online / Wikimedia: `abdominal CT slice public domain`, `histology pancreas public domain`.

16. **[blocking] The three photos in a set must be interchangeable, not merely thematic.** Before accepting a set, check all three against the same plate:
    - same crop and aspect ratio, exported at identical dimensions;
    - the clear area for the headline is in the **same region of the frame** in all three (if the headline sits lower-left, all three need quiet lower-left);
    - the headline stays legible on all three — for `.plate--dark` tonal-fade headlines (§4.4 of the build prompt), the bright band of the gradient must land on a bright zone in every variant, so per-variant gradient stops may be needed; store them as a CSS custom property per variant rather than hardcoding one set;
    - similar overall tonal weight after grading, so the page doesn't feel lighter or heavier depending on which one loaded.
    If a candidate fails any of these, replace it rather than tuning the layout around it.

17. **Image pipeline.** Add `tools/process-images.sh` using ImageMagick or `sharp`: grayscale → contrast curve → slight black lift → resize to 1600px and 2400px long edge → export AVIF + WebP + JPG. Reference it in `CREDITS.md` so I can re-run it on new photos. Keep untouched originals in `/assets/img/src/`. Naming: `plate-001-a`, `plate-001-b`, `plate-001-c`.

### 2b. Rotation behavior

18. **One manifest, one source of truth.** Put the sets in `assets/js/plates.js` (or a `data-variants` attribute on each plate), each entry carrying `src`, `alt`, and the headline gradient stops. Alt text must travel with the image — a rotating photo with a fixed alt string is wrong for every variant but one.
19. **Rotate per visit, not per second.** On load, pick a variant per plate at random and keep that choice for the whole visit by storing it in `sessionStorage` — so navigating home → built → home doesn't reshuffle mid-session, but coming back tomorrow shows a different wall. No auto-crossfade timer: a photo that changes while someone is reading is a distraction, and it costs bandwidth for motion nobody asked for.
20. **No layout shift, no flash.** Pick the variant in a small inline script in `<head>`, before first paint, and write the chosen `src` into the markup — don't swap `src` after the image has already rendered. Every variant is the same pixel dimensions, so `width`/`height` stay fixed and CLS stays at zero.
21. **Hero cost control.** Plate 001 is the LCP element. Because the choice is random you can't preload one specific file, so: keep each variant under ~180 KB in AVIF, set `fetchpriority="high"` on it, and preload **nothing else** above the fold. If Lighthouse LCP suffers, fall back to a fixed hero photo and let only plates 002–005 rotate — the rotation is a nice touch, not worth a slow first paint.
22. **Optional manual advance.** Let the reader click a plate to advance to the next variant, with the plate's index reading `002 · 2/3` in the corner while it's being used. Keyboard accessible (`button` wrapper, Enter/Space, `aria-label="next photo"`), 220ms crossfade, and skip the crossfade under `prefers-reduced-motion`. Only build this after items 15–21 are done.
23. **Bandwidth respect.** If `navigator.connection.saveData` is true, always use the `-a` variant and skip the manual-advance preloading.
24. **Serve them properly.** `<picture>` with AVIF/WebP/JPG sources and a `sizes` attribute; explicit `width`/`height` on every `<img>`; `loading="lazy" decoding="async"` on everything below the fold. Alt text describes the photo, not the headline.

---

## Phase 3 — Accessibility and markup

25. **[blocking] Duplicate navigation in the DOM.** Both the desktop nav and the mobile menu are always present in the markup, so assistive tech announces every link twice and the words `menu` and `close` appear as stray text. Render one nav and toggle its presentation with CSS, or mark the hidden one with `hidden`/`inert` so it's removed from the accessibility tree when closed.
26. **[blocking] Heading structure.** Every page needs exactly one `<h1>`. On section pages the plate headline is currently an `<h2>` with no `<h1>` above it. Make the plate headline the `<h1>` on section pages (or add a visually-hidden `<h1>` with the section name), and keep the home page's `<h1>` on `재민`.
27. Mobile menu: `aria-expanded` on the toggle, focus moves into the menu on open and returns to the toggle on close, Esc closes it, focus is trapped while open, and background scroll is locked.
28. Add `aria-current="page"` to the active nav link, not just a visual underline.
29. Add a skip link (`Skip to content`) as the first focusable element, visible on focus.
30. Visible focus rings everywhere: `:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px }`. Never `outline: none` without a replacement.
31. Verify `--ink-2` on `--paper` clears 4.5:1 at body sizes; if it doesn't, darken it and keep the lighter value for large text only.
32. **Content must not depend on JS to be visible.** If the scroll-reveal sets `opacity: 0` in CSS, add a `no-js` fallback: put `document.documentElement.classList.add('js')` in the `<head>` and scope the hidden state to `.js .reveal`. Test with JS disabled — every word should still be there.
33. Respect `prefers-reduced-motion: reduce`: no grain animation, no parallax, no reveal transitions, content shown immediately.

---

## Phase 4 — Performance, SEO, polish

34. **Font budget.** You're potentially loading Inter (variable), Inter Tight, Tinos, Instrument Serif, Pretendard, and Noto Serif KR — that's too many requests for a text site. Cut to four: Inter (variable, display + text + italic), Inter Tight, Instrument Serif, Tinos. Drop Noto Serif KR; use Pretendard only if the Korean in `재민` and the quote line actually needs it, subset to the characters used. Add `<link rel="preconnect">` to the font hosts, `font-display: swap`, and preload the one face used in the hero headline.
35. Add per-page Open Graph and Twitter card tags with a poster-crop image (1200×630, monochrome), plus `<link rel="canonical">`, `theme-color`, and a favicon/apple-touch-icon set. A site this visual should preview well when shared.
36. Add `sitemap.xml`, `robots.txt`, and a JSON-LD `Person` block on home (name, url, sameAs: github/linkedin, jobTitle).
37. Add `/404.html` in the poster style (typographic plate + the ASCII portrait) — GitHub Pages serves it automatically.
38. Confirm `diary.html` and `diary.html#post-2026-09-14` still resolve and now use the new stylesheet; the home page's latest-writing line should link to the newest post automatically or carry a `TODO(ryan)` reminder to update it.
39. Run Lighthouse (mobile) on home, `/built/`, and `/research/`. Targets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100. Paste the scores into `MIGRATION_NOTES.md`. If Performance is short, the cause is almost certainly image weight — fix in Phase 2, not by removing texture.
40. **Density pass.** Walk every page at 1440px and 390px and mark each screen as *intentional breathing room* or *dead space*. The current section pages are mostly dead space below the plate; Phase 1 item 12 should fix that. Don't fix sparseness by enlarging type past the point where a line breaks awkwardly.

---

## Phase 5 — Self-audit before you report back

41. Grep for stray hex/rgb values outside the token block. Zero hits expected.
42. Grep for `0` initial values in any element that animates a number. Zero hits expected.
43. Diff the old site's content against the new one and confirm every fact from the original still appears somewhere (stats, Probix recognitions, STEMise, hackathon numbers, both research projects, all four links, diary).
44. Confirm the nav block is byte-identical across all pages.
45. Confirm every image in `/assets/img/` — all three variants of all five plates — has a `CREDITS.md` entry with a license, and that no image came from a reference screenshot.
46. Force each variant in turn (a query param like `?plate=b` for testing is fine, remove it after) and confirm every headline stays legible on every variant, at 1440px and 390px.
47. Load the site three times with a cleared `sessionStorage` and confirm the posters change between visits, stay fixed while navigating within a visit, and never shift layout or flash a different image after paint.
48. Take full-page screenshots of home, `/built/`, `/initiatives/`, `/research/` at 1440px and 390px — plus one screenshot per plate variant — and save them to `/screenshots/` so I can review them without deploying.

When you're done, report: what changed per phase, the Lighthouse scores, the full `TODO(ryan)` list, and the image sources you chose with licenses.
