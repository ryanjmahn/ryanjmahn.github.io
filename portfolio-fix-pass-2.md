# Portfolio site: fix pass 2

This is a corrective pass on the build you just made from `portfolio-polish-prompt.md`. The section order (thesis, now, built, research, log, writing, reach out) is correct and stays. Two problems to solve:

1. There are spacing bugs.
2. The body of the page reads like a settings table: label, value, rule, label, value, rule, with one or two lines per row and a lot of chrome around each. It needs more mass, more varied rhythm, and more visual texture.

Work through the sections below **in order**. Finish and verify section 1 before touching anything else. Tokens (`--ink`, `--muted`, `--paper`, `--rule`, `--accent`, `--s1`..`--s4`) and the font stacks from the previous spec still apply. Do not invent content; every number below is already on the page.

Where this document conflicts with the previous spec, this document wins.

---

## 1. Bugs

**1.1 Gap after linked titles.** "Probix Labs" and "STEMise" have a large hole before the em dash; "Hackathons" does not. This comes from the hover arrow reserving inline space. Delete the hover arrow feature entirely (markup, CSS, any reserved padding/margin/min-width on title links). After the fix, every entry reads `Title — description` with one normal space either side of the em dash, linked or not.

**1.2 Entries inside a row have no separation.** "Hackathons…" sits at the same distance from "STEMise…" as the wrapped word "sponsors" sits from its own line, so a new entry and a line wrap look identical. Each entry must be its own block element with `margin-top: var(--s2)` between siblings (none on the first).

**1.3 Line-height.** Body line-height currently renders around 1.75. Set entries, thesis and paragraphs to `line-height: 1.5`. Check for a leftover rule overriding it and delete that rule.

**1.4 Body font.** Body text still appears to be in the condensed display serif. Confirm in DevTools what `font-family` is computed on an entry. It must be the Newsreader stack; the display serif is for the `h1` name and the stat numerals in section 4 only. If Newsreader is failing to load, fix the `<link>`; tell me what was wrong.

**1.5 Visible TODO.** "TODO — log entries not yet supplied" is rendering on the page. Any section whose slot is unfilled gets the `hidden` attribute on its `<section>` plus an HTML comment. Nothing placeholder-ish may be visible to visitors.

Stop here, reload, and confirm all five before continuing.

---

## 2. De-table the body

**2.1 Remove the hairline dividers between sections.** All of them. Sections are separated by space only: `margin-top: calc(var(--s3) + var(--s2))` (48px) between sections, no vertical padding on `.row`. One exception: keep a single `1px solid var(--rule)` divider above `reach out`, with `--s3` above and below it, so the page has a clear close.

**2.2 Grid.** `grid-template-columns: 80px 1fr; column-gap: var(--s2);`. Content column `max-width: 640px`, centered as it is now. Labels stay monospace, `--muted`, baseline-aligned to the first line of content.

**2.3 Make `now` the featured block.** It must not look like the other rows.

- Probix line at 21px, `line-height: 1.4`, `--ink`. Title weight 500.
- Traction line below at 14px Newsreader `--muted`, `margin-top: var(--s1)`.
- `margin-bottom` on the whole section: `--s4`, because the stats strip follows it.

**2.4 `built` and `research` stay as compact lists** at 17px with the 1.2 entry gap. In `built`, wrap each number (`4500+`, `132`, `3`, `$200,000+`, `15+`) in `<span class="num">` with `font-weight: 500; font-variant-numeric: lining-nums;` so the eye catches the figures when scanning. Format `4500+` as `4,500+`.

**2.5 Varied rhythm check.** After this section the body should read: big featured line, then a numbers strip, then two compact lists, then a timeline, then a list of posts, then a rule and a closing sentence. No two adjacent blocks should share the same silhouette. If they do, tell me which.

---

## 3. Header: two columns

The header currently stacks everything vertically and leaves the horizontal space empty.

- At 700px and wider: a two-column header. Left: the ASCII portrait. Right: name, tagline, status line, links row, stacked as they are now. `display: grid; grid-template-columns: auto 1fr; column-gap: var(--s3); align-items: end;` so the bottom of the links row lines up with the bottom of the portrait.
- Because the portrait no longer costs vertical space on its own, scale it up to about **180px wide** (adjust the `<pre>` font-size and line-height together; same crop as before, head and neck, no shoulder slab).
- The thesis paragraph sits below the header at full column width, `margin-top: var(--s3)`.
- Below 700px: stack as before, portrait at 130px.
- The portrait resolve animation from the previous spec stays as is.

---

## 4. Stats strip

Between `now` and `built`, spanning the full content column (it ignores the gutter), one row of four figures. The numbers are already in my copy; do not change or add any.

| Numeral | Caption |
| --- | --- |
| `4,500+` | youths reached |
| `132` | nations |
| `$200k+` | raised |
| `3` | hackathons directed |

- Numerals: the **display serif** (same face as the `h1`), 34px, `--ink`, `line-height: 1`.
- Captions: monospace 12.5px, `--muted`, lowercase, `margin-top: var(--s1)`.
- Layout: `display: grid; grid-template-columns: repeat(4, auto); justify-content: start; column-gap: var(--s4);`. Left-aligned to the column edge, **not centered, not justified across the width**.
- No boxes, borders, pills, backgrounds, icons, or count-up animation. It is just type.
- Below 560px: two columns, `row-gap: var(--s3)`.
- `margin-bottom: var(--s4)`.

---

## 5. Log as a timeline rail

When log entries are supplied (the section is `hidden` until then, per 1.5), render them as a vertical rail rather than a plain list.

- Each entry is a three-column mini-grid: date (monospace, `--muted`, 64px), a rail cell (16px wide), text.
- The rail cell contains a monospace `●` for the entry and the rail is continued between entries with a `│` drawn via a pseudo-element or a repeated character, color `--rule`. The newest entry's `●` is `--accent`; all others are `--muted`. This is one more allowed use of `--accent`; add it to the list.
- Entry gap `--s2`. Text 17px Newsreader.
- The rail must be continuous with no breaks between entries and must end at the last dot, not trail below it.

```
[[SLOT: LOG ENTRIES — I will supply 5–8 lines as `2026-MM · verb + what happened`. Do not write these yourself.]]
```

---

## 6. ASCII field in the side margins

The margins on either side of the content column are empty on any laptop-width screen. Fill them with a quiet, generated ASCII texture that uses the same character ramp as the portrait, so the portrait, the closing strip and the field all read as one system. It has **no idle animation**: it only changes when the visitor scrolls or moves the cursor.

**Markup and placement**

- One `<pre id="field" aria-hidden="true"></pre>` as the first child of `body`.
- `position: fixed; inset: 0; z-index: -1; margin: 0; overflow: hidden; white-space: pre; pointer-events: none; user-select: none;`
- Monospace stack, `font-size: 11px; line-height: 13px; color: var(--muted); opacity: .38;`
- Background `--paper` lives on `html`, not `body`, so the field is visible behind the transparent body.
- Hide it behind the content with a mask so it never sits under text:

```css
#field {
  --half: 360px;               /* half the content column + breathing room */
  -webkit-mask-image: linear-gradient(to right,
    #000 0, #000 calc(50% - var(--half) - 60px),
    transparent calc(50% - var(--half)),
    transparent calc(50% + var(--half)),
    #000 calc(50% + var(--half) + 60px), #000 100%);
          mask-image: /* same value */;
}
```

- `@media (max-width: 1099px) { #field { display: none; } }` and do not run the script at all below that width or on `(hover: none)` devices.

**Generation (vanilla JS, target under ~70 lines, inline at end of `body`)**

- On load and on resize (debounced 150ms), measure one character cell, compute `cols` and `rows` to cover the viewport.
- Density at each cell comes from a cheap smooth function, not `Math.random()` per frame. Use a small value-noise function or a sum of three or four low-frequency sines of `(x, y + scrollOffset)`. Output 0..1.
- Bias it sparse: `d = Math.pow(d, 2.2)`, then multiply by an edge weight that is ~1 at the far left/right of the viewport and ~0.4 next to the column, so texture thins out toward the content.
- Map `d` onto the ramp `" .:-=+*"` only. Do not use the heavy end of the ramp (`#`, `%`, `@`); most cells should be spaces or dots. If more than about a third of the cells are non-space, the bias is too weak.
- **Scroll:** feed `window.scrollY * 0.02` into the noise y-offset so the texture drifts as the page scrolls.
- **Cursor:** within a 120px radius of the pointer, add up to `+0.45` to `d` with smooth falloff (`1 - (dist/120)^2`, clamped), so characters thicken around the cursor. Here, and only here, the ramp may extend to `#`.
- Re-render via a single `requestAnimationFrame` loop that runs **only when** a scroll or pointermove event has flagged the field dirty. No timers, no continuous loop. Build the whole frame as one string and assign it to `textContent` once.
- `prefers-reduced-motion: reduce`: render once, ignore scroll and cursor.
- No per-character spans, no canvas, no libraries.

**Relationship to the rest of the ASCII system**

- Keep the closing strip from the previous spec.
- The margin figures (Probix mark, KRAS, CT) from the previous spec are still pending my source images. When they are added later, each figure gets `background: var(--paper); padding: var(--s1);` so it sits cleanly on top of the field. Do not attempt them now.

---

## 7. Audit and report

1. Reload at 820, 1100, 1280, 1440 and 1920px wide. No horizontal scroll, no field characters visible under or touching text, header columns align at the bottom.
2. No hairline dividers remain except the one above `reach out`.
3. No visible TODO or placeholder text anywhere.
4. Every entry reads `Title — description` with identical spacing, linked or not.
5. With the pointer still and no scrolling, nothing on the page is moving (after the one-time portrait resolve).
6. Scrolling stays smooth with the field on. If `textContent` updates cause jank at 1920px, raise `font-size`/`line-height` of the field to 12px/14px to cut the cell count, and tell me.

Report back with: what caused bugs 1.1, 1.3 and 1.4, a screenshot-worthy description of the body rhythm after section 2, the field's cell count at 1440x900, and anything you could not do as written.
