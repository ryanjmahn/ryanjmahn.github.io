# Portfolio site: restructure + polish + ASCII system

You are editing my personal site (vanilla HTML/CSS, single page, `index.html` + stylesheet, GitHub Pages).

**The visual design is settled and stays:** text-first, serif, off-white background, ASCII portrait at top, a two-column grid with a narrow left gutter, hairline dividers. **What changes is the page structure and content order** (Part A), followed by a tightening pass on the styling (Part B), followed by a small, disciplined layer of ASCII texture and detail (Part C).

Rules for the whole job:

- Single page. No nav bar, no new pages, no cards, no icons, no photos or raster images rendered on the page, no particles, no canvas backgrounds, and no animation other than the single one specified in C3.
- Do not invent content. Anywhere you see `[[SLOT: ...]]`, I have filled it in below or will fill it in myself. If a slot is still unfilled when you reach it, leave a visible `TODO` HTML comment and an obvious placeholder string, and list it in your final report. Never make up numbers, dates, backers, or links.
- Do Part A, then Part B, then Part C, in order. Do not start Part C until A and B pass the B10 audit. Do not add ideas that are not in this document.

Before you start: read `index.html` and the CSS, then tell me in a few lines (1) how the ASCII portrait is rendered (`<pre>`, image, other), (2) which fonts are loaded, (3) where spacing values live, (4) what the "diary" link points to and whether posts exist in this repo. Then proceed.

---

# Part A. Structure

## A1. Page order

Top to bottom, the page is exactly this:

1. Header (portrait, name, tagline, links)
2. Thesis
3. `now`
4. `built`
5. `research`
6. `log`
7. `writing`
8. `reach out`

Sections 3 to 8 all use the **same grid**: a narrow left gutter holding a lowercase section label, and the content in the right column. The gutter label replaces the old repeated `2026-present` dates. Each section is separated by the existing hairline divider.

Markup pattern for every section:

```html
<section class="row" id="now">
  <h2 class="row-label">now</h2>
  <div class="row-body"> ... </div>
</section>
```

`row-label` is a real `h2` for accessibility but styled as small grey metadata (see B3, B6). The gutter labels are the page's navigation; there is no nav element.

## A2. Header

Keep: portrait, `h1` name, tagline, links row (`email · github · linkedin · diary`). Changes to these are in Part B only.

## A3. Thesis

Directly under the links row, not in the grid (full column width, no gutter label). One short paragraph, first person, lowercase to match the page. Same size as body text, color `--ink`. Max two sentences.

```
[[SLOT: THESIS — two sentences stating what I'm trying to make true, tying Probix and the PDAC research into one thread. Placeholder until I write it:
"i build tools that make science hold up, from verifying papers to catching pancreatic cancer earlier."]]
```

## A4. `now`

One entry only: Probix Labs. This is the headline of the page.

- Line 1: `Probix Labs` (entry title, linked) + em dash + role + one-line description. Reuse my existing copy: co-founder/COO, product lab promoting reproducible science.
- Line 2, its own line, color `--muted`: traction and backers. Reuse existing claims, reformatted: `YC F26 top 10%, Founders Inc. top 10% · backed by [[SLOT: confirm exact spelling of the founder program currently written as "Tood Founder Program"]]`
- Optional line 3: `[[SLOT: one concrete Probix number or milestone, e.g. users, papers verified, pilots. Omit the line if I leave this empty.]]`

## A5. `built`

Two entries, one line each, same title treatment as `now`. Each line ends with one real number.

- `STEMise` (linked) — `[[SLOT: role + one-line description + one number]]`
- `Hackathons` — `[[SLOT: which events (e.g. DSH Hacks), my role, one number such as participants or sponsorship raised]]`

Use active past-tense verbs where natural: launched, grew, raised, ran, shipped.

## A6. `research`

Compressed to at most three lines. It is supporting depth, not the main event.

- `PDAC tumor segmentation` — CNN vs. transformer benchmarking. `[[SLOT: link to repo/writeup, or omit link]]`
- `KRAS G12D cryptic-pocket prediction` — benchmarking study. `[[SLOT: link, or omit]]`
- Optional third: `[[SLOT: one more project + link, or delete this line]]`

If an item has no link yet, show it as plain text with no "coming soon" note. Remove the existing "writeups coming soon" phrase entirely.

## A7. `log`

A reverse-chronological list of dated one-liners showing momentum. This is the one place real dates appear.

- Nested mini-grid inside `row-body`: a date column (`YYYY-MM`, `--muted`, tabular numerals, ~64px) and a text column.
- 5 to 8 entries. No dividers between log entries, just `--s1` vertical gap.
- Each entry is one line, lowercase, starts with a verb.

```
[[SLOT: LOG ENTRIES — I will supply 5–8 lines in the form:
2026-MM · verb + what happened (+ number if there is one)
Do not write these yourself.]]
```

## A8. `writing`

The three most recent diary posts: date in the mini-grid date column (same pattern as `log`), post title as a link. Then a final line: `all posts →` linking to the diary index.

- If posts live in this repo, hard-code the latest three titles and dates from what exists. Do not build a feed system or add JavaScript.
- If the diary is external or has fewer than three posts, list what exists and keep `all posts →`. If there are zero posts, omit this whole section and tell me.

## A9. `reach out`

Last section, replaces any existing footer. One sentence plus the email link:

```
[[SLOT: ASK — one sentence on who should email me and about what. Placeholder:
"if you work on research reproducibility or pancreatic cancer, or want to build something together, email me."]]
```

Below it, a single small `--muted` line: `© 2026 ryan jaemin ahn`. Nothing else.

## A10. Remove

Delete the old four-entry list markup once its content has been moved into `now`, `built`, and `research`. Delete any leftover references to `works.html` / `contact.html`.

---

# Part B. Polish

## B0. Tokens

Add to `:root`, use everywhere, and replace hard-coded values as you go.

```css
:root {
  --ink: #1a1a1a;     /* keep the existing near-black if different */
  --muted: #8a8780;   /* metadata: tagline, labels, dates, separators, underlines */
  --paper: #fafaf7;   /* keep the existing background value */
  --rule: #e4e2dc;    /* hairline dividers */
  --accent: #a8584f;  /* sample from the red tint already in the ASCII portrait; prefer that exact value */

  --s1: 8px;
  --s2: 16px;
  --s3: 32px;
  --s4: 64px;
}
```

Every margin, padding, and gap must be one of `--s1`..`--s4` or a sum of two. `--accent` is never a gradient and is allowed in exactly these places: link hover, focus outline, the status dot (C5), `::selection` (C6), and `.hit` characters in ASCII figures (C2). Nowhere else. It should cover well under 5% of any viewport.

## B1. Portrait: crop and shrink

Goal: on a 1280x680 window, the first viewport shows portrait, name, tagline, links, thesis, and the top of `now`. The head must sit on the same left edge as the text.

- If `<pre>`: delete the bottom rows that form the solid shoulder slab (rows that are almost entirely `%` across the full width). Keep head, neck, top of collar, ending where the shoulders start to flare. Strip the common leading whitespace from all remaining rows so the widest row starts at column 0.
- Reduce the `<pre>` font-size and matching line-height so it renders about **130px wide**. Do not stretch.
- If it is an image: crop to the same region, `width: 130px; height: auto;`.
- Left-aligned to the column. Do not regenerate or re-convert the portrait, only crop and scale.
- `white-space: pre; overflow: hidden;` so rows never wrap.

## B2. Typography

- The current condensed serif stays for the `h1` name only. Leave its size.
- Everything else: **Newsreader** via Google Fonts (400, 400 italic, 500). Stack: `"Newsreader", Georgia, "Times New Roman", serif`.
- Body, thesis, entries: 17px, `line-height: 1.55`, `--ink`.
- Tagline: 17px, `--muted`.
- Links row: 16px.
- Traction line: 14px Newsreader, `--muted`.
- Gutter labels, log/writing dates, status line, copyright: monospace per C4, `--muted`.

## B3. Hierarchy

Exactly three levels: name (display serif), content (`--ink`), metadata (`--muted`). `--muted` applies to: tagline, `·` separators, gutter labels, all dates, the Probix traction line, copyright. Nothing else is grey.

## B4. Entry titles

Every entry title (`Probix Labs`, `STEMise`, `Hackathons`, research project names) uses one class: `font-weight: 500; font-style: normal;`. Same look linked or not; linked ones simply pick up the underline from B5. Em dash after the title with a normal space each side.

## B5. Links

```css
a {
  color: inherit;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: var(--muted);
  transition: color .15s, text-decoration-color .15s;
}
a:hover { color: var(--accent); text-decoration-color: var(--accent); }
a:focus-visible { outline: 1px solid var(--accent); outline-offset: 2px; }
```

## B6. Grid

- `.row { display: grid; grid-template-columns: 88px 1fr; column-gap: var(--s2); align-items: baseline; }`
- The gutter label must share a baseline with the first line of its content. If the size difference leaves it off by a pixel or two, fix with `padding-top` on the label, not negative margins.
- Divider between rows: `border-top: 1px solid var(--rule)`, with `--s3` padding above and below each row.
- Multiple entries inside one `row-body` are separated by `--s2`.

## B7. Vertical rhythm

| Between | Gap |
| --- | --- |
| Top of page and portrait | `--s4` |
| Portrait and name | `--s3` |
| Name and tagline | `--s2` |
| Tagline and links | `--s2` |
| Links and thesis | `--s3` |
| Thesis and `now` | `--s4` |
| Last row and bottom of page | `--s4` |

Content column keeps its current max-width and left position.

## B8. Copy hygiene

- Tagline becomes `17 · builder · seoul`, separators in `--muted`, matching the links row.
- Whole page is lowercase except proper nouns and acronyms: Probix Labs, STEMise, PDAC, KRAS G12D, YC, Founders Inc., CNN, DSH Hacks. Sentence starts inside descriptions are lowercase.
- No pipes anywhere. Use commas inside sentences and `·` between metadata items.
- Real en dashes in ranges, real em dashes after titles, no space before semicolons.

## B9. Responsive (under 560px)

- `.row` collapses to one column; label sits above content with `--s1` gap.
- Log and writing mini-grids keep two columns (date column narrows to 56px).
- Portrait 110–130px, never overflowing. Body stays 17px. Side padding `--s2`.

## B10. Consistency audit before finishing

Check the entire page, top to bottom:

1. Font families: only the display serif on `h1`, the Newsreader stack for content, and the one monospace stack (C4) for the portrait, ASCII figures, and metadata.
2. Colors: only the five tokens.
3. Spacing: only the `--s` scale.
4. Dead CSS from earlier directions (card grids, particle canvas, background image, old page classes) deleted. List what you removed.
5. Every row uses the same grid, label style, title treatment, and divider.
6. Heading order is valid: one `h1`, section labels as `h2`.

---

# Part C. ASCII system and detail layer

The page already has one distinctive rendering technique: the ASCII portrait. Part C extends that into a small system instead of adding new techniques. **One rule governs all of it: ASCII on this site always depicts something real that I work on. It is never abstract filler.** No particles, no dither fields, no generative backgrounds.

Budget: at most three margin figures, one closing strip, one motion moment. If something does not fit this budget, leave it out.

## C1. Build a converter, do not hand-draw

You cannot draw convincing ASCII figures from a text description, so do not try. Instead:

- First, work out how the existing portrait was produced: character ramp, whether colors are per-character `<span>`s, font-size and line-height of the `<pre>`. Report this.
- Write a small offline script at `tools/ascii.py` (Python + Pillow) that converts a source image to a static `<pre>` HTML snippet using **the same character ramp and the same cell proportions as the portrait**. Sample cells at roughly 1:2 width:height to compensate for character aspect ratio. Treat near-white / transparent pixels as spaces.
- Red detection: any cell whose average pixel is red-dominant (e.g. `r > 150 and r > 1.6*g and r > 1.6*b`) is wrapped in `<span class="hit">`. Everything else is plain text. The script takes `--cols` to set output width in characters.
- Output is pasted into `index.html` as static markup. **No runtime conversion, no canvas, no image files loaded on the page.**
- Source images go in `assets/src/` and are not referenced by the page.

```
[[SLOT: SOURCE IMAGES — I will add these files. Each should be high-contrast on a white or transparent background, with the "target" region painted pure red:
  assets/src/kras.png    KRAS G12D structure render, cryptic pocket in red
  assets/src/ct.png      axial pancreas CT slice or segmentation figure, tumor region in red
  assets/src/probix.png  Probix mark, no red
If a file is missing, skip that figure entirely and tell me. Do not substitute anything.]]
```

## C2. Margin figures

Place converted figures in the empty space to the right of the content column, each tied to the section it depicts.

| Section | Figure | Approx width |
| --- | --- | --- |
| `now` | Probix mark | 28–32 cols |
| `research` | KRAS G12D, and below it the CT slice | 36–44 cols each |

- Markup: `<pre class="fig" aria-hidden="true">…</pre>` inside the relevant `.row`.
- Positioning: `.row { position: relative; }` and `.fig { position: absolute; left: calc(100% + var(--s4)); top: var(--s3); }`. The content column's width and position do not change. Figures must never push or overlap text.
- Style: same monospace stack, font-size and line-height as the portrait; color `--muted` at `opacity: .7`; `.hit { color: var(--accent); opacity: 1; }`; `user-select: none; pointer-events: none;`.
- Rendered width target: 160–200px.
- Only show when there is room: wrap in `@media (min-width: 1100px)`; `display: none` below that. Verify at 1100px and 1440px that no figure is clipped by the viewport; if one would be, reduce `--cols` rather than shrinking the font.
- If the `research` row is too short to hold two stacked figures without overflowing into `log`, keep only KRAS.

The meaning of red: **red marks the target**, the tumor in the scan and the pocket on the protein. Do not use red in a figure for any other purpose.

## C3. The one motion moment: portrait resolve

On first load, the portrait's characters start scrambled and resolve into the face.

- Vanilla JS, under ~40 lines, inline at the end of `body`. No libraries.
- Walk the text nodes inside the portrait `<pre>` so existing color spans are preserved. For every non-space character, swap in a random character from the ramp, then restore the real character. Restore order: top row to bottom row with slight random jitter, total duration about 600ms, using `requestAnimationFrame`.
- Spaces are never touched, so the silhouette and the `<pre>` dimensions are stable and there is zero layout shift.
- Runs once per session (`sessionStorage` flag). Never loops. No hover re-trigger.
- `@media (prefers-reduced-motion: reduce)` or no JS: the portrait simply renders in its final state. The final state is what is in the HTML; the script only scrambles it after load.
- Margin figures do not animate.

## C4. Monospace for metadata

The portrait's monospace currently belongs to nothing else on the page. Tie it into the type system:

- Load **JetBrains Mono** (400) from Google Fonts. Stack: `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`.
- Use it, at 12.5px, `--muted`, lowercase, `letter-spacing: 0`, for: gutter labels, dates in `log` and `writing`, the status line (C5), the copyright line.
- Apply the same stack to the margin figures. Apply it to the portrait **only if** the portrait still renders at the correct proportions afterwards; if its width or shape changes noticeably, revert the portrait to its current font and tell me.
- Re-check the B6 baseline alignment after this change, since label metrics will differ.

## C5. Status line

Directly under the tagline, above the links row, one monospace metadata line:

`● building probix · seoul 21:24 KST`

- The dot is a 6px circle in `--accent`, vertically centered on the text. Static, no pulse.
- The time is live Seoul time (`Intl.DateTimeFormat` with `timeZone: "Asia/Seoul"`, 24h, `HH:mm`), updated once a minute. If JS is unavailable, the line reads `● building probix · seoul` with no time.
- Gaps: `--s1` above, `--s2` below. Update the B7 table accordingly.
- `[[SLOT: STATUS TEXT — defaults to "building probix". I may change this.]]`

## C6. Small details

- `::selection { background: var(--accent); color: var(--paper); }`
- Row hover (pointer devices only, `@media (hover: hover)`): when hovering a linked entry title, a `→` appears after it, fading in over 150ms via opacity. It must not shift layout: reserve its space or position it absolutely.
- Smooth scrolling is not needed; do not add it.

## C7. Closing strip

The last element on the page, below the copyright line: a 3-row ASCII density strip spanning the content column, echoing the shoulder slab that was cropped from the portrait.

- Generated by `tools/ascii.py --strip` (or a tiny separate function): row 1 dense (`%#*`), row 2 medium (`+=-`), row 3 sparse (`:.` and spaces), with characters chosen pseudo-randomly within each band so it reads as texture fading downward, not as stripes.
- Static `<pre aria-hidden="true">`, portrait font metrics, color `--rule` darkened slightly (`--muted` at `opacity: .5`). `overflow: hidden; white-space: pre;`
- `--s3` above it, `--s4` below it.
- On narrow screens it simply clips to the column width.

## C8. Part C audit

1. Exactly one animation exists on the page (C3), and it does nothing under reduced motion.
2. Every ASCII element uses the same ramp, font stack, size, and line-height.
3. Red appears only in the places listed in B0.
4. Below 1100px the page is identical to the Part B result apart from C4, C5, C6, and C7.
5. No figure overlaps text or causes horizontal scroll at 1100, 1280, 1440, and 1920px.
6. Lighthouse-style sanity: no images loaded, total added JS under ~80 lines, no layout shift on load.

---

## Done means

- First viewport at 1280x680: portrait, name, tagline, links, thesis, top of `now`.
- Page order matches A1 exactly.
- On a wide screen, margin figures sit beside `now` and `research`, with red marking only the targets; the portrait resolves once on first load.
- Final report: what changed per section, how the original portrait was generated, dead CSS removed, every `[[SLOT]]` still unfilled, and anything you could not do as written and why.
