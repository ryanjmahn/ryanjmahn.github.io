# Portfolio site: restructure + polish pass

You are editing my personal site (vanilla HTML/CSS, single page, `index.html` + stylesheet, GitHub Pages).

**The visual design is settled and stays:** text-first, serif, off-white background, ASCII portrait at top, a two-column grid with a narrow left gutter, hairline dividers. **What changes is the page structure and content order** (Part A), followed by a tightening pass on the styling (Part B).

Rules for the whole job:

- Single page. No nav bar, no new pages, no cards, no icons, no images besides the portrait, no animations.
- Do not invent content. Anywhere you see `[[SLOT: ...]]`, I have filled it in below or will fill it in myself. If a slot is still unfilled when you reach it, leave a visible `TODO` HTML comment and an obvious placeholder string, and list it in your final report. Never make up numbers, dates, backers, or links.
- Do Part A, then Part B, in order. Do not add ideas that are not in this document.

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

Every margin, padding, and gap must be one of `--s1`..`--s4` or a sum of two. `--accent` is for link hover and focus only, never a gradient.

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
- Gutter labels, log/writing dates, traction line, copyright: 14px, `--muted`, `font-variant-numeric: tabular-nums`.

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

1. Font families: only the display serif on `h1`, the Newsreader stack elsewhere, monospace on the portrait.
2. Colors: only the five tokens.
3. Spacing: only the `--s` scale.
4. Dead CSS from earlier directions (card grids, particle canvas, background image, old page classes) deleted. List what you removed.
5. Every row uses the same grid, label style, title treatment, and divider.
6. Heading order is valid: one `h1`, section labels as `h2`.

---

## Done means

- First viewport at 1280x680: portrait, name, tagline, links, thesis, top of `now`.
- Page order matches A1 exactly.
- Final report: what changed per section, dead CSS removed, every `[[SLOT]]` still unfilled, and anything you could not do as written and why.
