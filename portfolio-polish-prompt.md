# Portfolio site polish pass

You are editing my personal site (vanilla HTML/CSS, single page, `index.html` + stylesheet). The design direction is settled: text-first, serif, off-white background, ASCII portrait at the top, entries in a date-gutter list. **Do not redesign anything.** This is a tightening pass. Work through the punch list below in order, and do not add new elements, sections, animations, or ideas that are not listed here.

Before you start: read `index.html` and the CSS, and tell me in two or three lines how the ASCII portrait is rendered (a `<pre>` block, an image, or something else), what font(s) are loaded, and where spacing values are defined. Then proceed.

---

## 0. Set up tokens first

Add these CSS custom properties on `:root` and use them everywhere below. Replace existing hard-coded values with them as you go.

```css
:root {
  --ink: #1a1a1a;          /* primary text, keep whatever near-black is already used */
  --muted: #8a8780;        /* metadata: tagline, dates, separators, underlines */
  --paper: #fafaf7;        /* keep the existing background value */
  --rule: #e4e2dc;         /* hairline dividers */
  --accent: #a8584f;       /* sample this from the red tint already in the ASCII portrait; use that value, not mine, if they differ */

  --s1: 8px;
  --s2: 16px;
  --s3: 32px;
  --s4: 64px;
}
```

Rules for the rest of the pass: every margin, padding, and gap must be one of `--s1` to `--s4` (or a sum of two of them). `--accent` is used for link hover only, nowhere else, and never as a gradient.

## 1. Portrait: crop and shrink

Goal: the portrait, my name, the tagline, and the links all fit in the first viewport on a 1280x680 laptop window, and the head sits on the same left edge as the text below it.

- If the portrait is a `<pre>` block: delete the bottom rows that form the solid shoulder slab (the rows that are almost entirely `%` characters spanning the full width). Keep head, neck, and the top of the collar, ending where the shoulders start to flare out. Then strip the common leading whitespace from every remaining row so the leftmost character of the widest remaining row sits at column 0.
- Reduce the `<pre>` font-size (and matching line-height) so the rendered portrait is about **130px wide**. Keep the character aspect ratio intact; do not stretch.
- If it is an image instead: crop to the same region and set `width: 130px; height: auto;`.
- Left-align it to the content column. No centering.
- Space below the portrait before the name: `--s3`.
- Do not regenerate, redraw, or re-convert the portrait. Only crop and scale what exists.

## 2. Typography: split display and body

The current condensed serif stays for the **name only** (the `h1`).

- Load one text serif for everything else: **Newsreader** from Google Fonts (weights 400 and 400 italic, plus 500). Fallback stack: `"Newsreader", Georgia, "Times New Roman", serif`.
- Body / entry text: 17px, `line-height: 1.55`, color `--ink`.
- Tagline: 17px, color `--muted`.
- Links row: 16px.
- Dates: 14px, color `--muted`, `font-variant-numeric: tabular-nums`.
- Leave the `h1` size as it is.

## 3. Hierarchy through one grey

Apply `--muted` to: the tagline line, the `·` separators between links, all dates in the gutter. Everything else stays `--ink`. That gives three levels (name, content, metadata) with no new elements.

## 4. Entry titles: one treatment

Every entry starts with a title ("Research", "Probix Labs", "STEMise", "Hackathons"). Wrap each in the same element/class (e.g. `<span class="entry-title">` or `<a class="entry-title">` when it links).

- `font-weight: 500; font-style: normal;`
- Same look whether or not it is a link. Linked titles get the link underline from section 5; unlinked titles get no underline. That is the only difference.
- Keep the em dash after the title, with a normal space on each side.

## 5. Links and underlines

Apply to every `a` on the page:

```css
a {
  color: inherit;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: var(--muted);
  transition: color .15s, text-decoration-color .15s;
}
a:hover {
  color: var(--accent);
  text-decoration-color: var(--accent);
}
```

Add a visible `:focus-visible` outline (1px `--accent`, 2px offset).

## 6. Entry list layout

- Use a two-column grid per entry: `grid-template-columns: 88px 1fr; column-gap: var(--s2);`
- `align-items: baseline` so each date shares a baseline with the first line of its entry text. Verify visually; if the different font sizes leave it off by a pixel or two, nudge the date with `padding-top`, not a negative margin.
- Divider between entries: `1px solid var(--rule)`, with `--s3` of padding above and below.
- If every date on the page reads "2026–present", replace the dates with short lowercase category labels instead: `research`, `startup`, `edtech`, `events`. Same styling as dates. If the dates actually differ between entries, keep the dates.
- Use a real en dash in date ranges (`2026–present`), not a hyphen.

## 7. Vertical rhythm

Set these exact gaps and remove any others:

| Between | Gap |
| --- | --- |
| Top of page and portrait | `--s4` |
| Portrait and name | `--s3` |
| Name and tagline | `--s2` |
| Tagline and links | `--s2` |
| Links and first entry | `--s4` |
| Last entry and bottom of page | `--s4` |

Content column stays at its current max-width and left position.

## 8. Copy hygiene (text only, no rewording beyond this)

- Tagline: use the same separator as the links row. Change `17 | aspiring builder | seoul` to `17 · builder · seoul`, with the `·` in `--muted`.
- Research entry: remove the comma after `(CNN vs. transformer benchmarking)`, and remove the space before the semicolon so it reads `prediction; writeups coming soon`.
- Probix entry: inside the parenthetical, replace the pipe with a comma: `(YC F26 Top 10%, Founders Inc. Top 10%)`. Keep the claim itself as is.
- Capitalization: the page mixes all-lowercase (name, tagline, links) with sentence case in entries. Make it consistent: entry titles and proper nouns keep their capitals (Research, Probix Labs, PDAC, KRAS G12D, YC, Founders Inc.), but lowercase sentence starts inside descriptions to match the rest of the page (e.g. `backed by`, `product lab promoting`). Do not lowercase proper nouns or acronyms.
- Flag to me, do not change: confirm whether "Tood Founder Program" is spelled correctly.

## 9. Responsive check

At widths under 560px:

- Entry grid collapses to one column; the date/label sits above the entry text with `--s1` between them.
- Portrait stays 130px wide or scales down to 110px. It must never overflow or wrap its rows; set `white-space: pre; overflow: hidden;` on it.
- Body text stays 17px. Side padding `--s2`.

## 10. Consistency audit before you finish

Go through the whole page, not just the top, and confirm:

1. No font-family declarations remain other than the display serif on `h1` and the Newsreader stack everywhere else (plus the monospace on the portrait).
2. No color values remain outside the five tokens.
3. No spacing values remain outside the `--s` scale.
4. No leftover CSS from earlier directions (old card grids, particle canvas, background image rules, unused classes for `works.html` / `contact.html`). Delete dead rules you find and list them for me.
5. Every entry, including the ones below the fold, uses the same title treatment, grid, and divider.

## Done means

- First viewport at 1280x680 shows portrait, name, tagline, links, and the top of the first entry.
- Report back with: a short list of what you changed per section, the dead CSS you removed, and anything in this spec you could not do as written and why.
