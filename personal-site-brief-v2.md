# 재민 — Personal Site Design Brief

## What we're doing

Redesigning my personal site around one concept: **the site is a small Renaissance volume, in restored color.**

Three pages, mapped to the three parts of a printed book:

| Page | Book equivalent | Contains |
|---|---|---|
| **Home** | Frontispiece | Name, portrait, one-line bio, links |
| **Works** | Index of plates | What I've built, as a numbered catalogue |
| **Contact** | Colophon | How to reach me, where this was made |

No blog. No reading list. Three pages, nothing else. Remove the existing blog and reading sections cleanly — routes, nav entries, templates, unused assets.

### The concept

The muted, sepia look people associate with the Renaissance is five hundred years of varnish and soot. When the Sistine ceiling was cleaned in the 1980s, restorers found acid greens, hot pinks, and saffron underneath — so vivid that critics accused them of ruining it. Michelangelo painted in *cangiante*: drapery that shifts from pink to acid green across a single fold.

**This site is restored fresco, not aged fresco.** Renaissance structure — arches, engraved plates, roman numerals, hairlines — with the pigments at full strength.

### Reference

Structurally: `wenhao-lu.com`, an al-folio academic site. What to take:

- Tiny lowercase nav, small monogram top-left
- One enormous personal glyph as the homepage's central element
- A single portrait
- A row of link icons, no labels
- **One line** of bio. Not a paragraph
- A footer with personality
- Enormous whitespace

The visual language becomes Renaissance and the color becomes loud. The *restraint of layout* stays exactly as it is.

---

## The rule that matters most

**Formal structure, casual voice.**

The architecture, typography, and color are Renaissance. The words are lowercase, plain, and unpretentious.

A Renaissance-themed personal site written in a grand voice reads as self-important. The contrast between formal frame and casual copy is the entire charm. If a line sounds like it's announcing something, rewrite it smaller.

Never: "a scholar of computational medicine." Instead: "i work on pancreatic cancer with computers."

---

## Color

Real Renaissance pigments at full saturation.

| Token | Hex | Pigment | Character |
|---|---|---|---|
| `--intonaco` | `#FBF8F0` | Fresh lime plaster | Page ground — brighter and cleaner than aged plaster |
| `--lapis` | `#3636D3` | Ultramarine | My brand indigo. The most precious pigment |
| `--vermilion` | `#E2452F` | Cinnabar | Hot orange-red |
| `--orpiment` | `#F2B01E` | Arsenic yellow | Brilliant saffron |
| `--verdigris` | `#1FA8A0` | Copper green | Bright blue-green |
| `--madder` | `#D0396B` | Madder lake | Deep rose |
| `--umber` | `#2A2320` | Raw umber | All body and display text |
| `--umber-soft` | `#6B6058` | Diluted umber | Secondary text, captions |

Define centrally as CSS custom properties, pigment names as comments. No hardcoded hex in components.

### One pigment per page

Vibrancy without chaos: **each page has one dominant pigment**, plus `--umber` for text and at most one secondary accent.

| Page | Dominant | Accent |
|---|---|---|
| Home | `--lapis` | `--orpiment` |
| Works | `--vermilion` | `--verdigris` |
| Contact | `--verdigris` | `--madder` |

The site cycles through the palette as you move through it. Any single screen stays composed; the whole thing is loud. **Never put four pigments on one screen.**

### Cangiante

Michelangelo's shot-silk technique — a color shifting to a different hue in its highlights, not just a lighter version of itself.

Use it for **hover states only**: an element in the page's dominant pigment shifts to its accent pigment on hover, over `200ms`. On Works, a project row's rule goes vermilion → verdigris. Not a fade to a tint — an actual hue change. This is the site's signature detail.

---

## Typography

Three faces, extreme scale contrast.

- **Display:** a grotesque with humanist warmth — Founders Grotesk, Söhne Breit, or GT Alpina display. Name and page titles only
- **Serif:** the voice of the volume. Bio, descriptions, captions, colophon. Italic for asides
- **Mono:** dates and numerals only. Never prose

| Token | Family | Size | Use |
|---|---|---|---|
| `--type-name` | Display | `clamp(5rem, 18vw, 13rem)` | The homepage glyph |
| `--type-title` | Display caps | `clamp(2rem, 4vw, 3rem)` | Page titles |
| `--type-entry` | Display caps | `1.25rem` | Project names |
| `--type-body` | Serif | `1.0625rem` / `1.65` | Everything else |
| `--type-meta` | Mono, small caps, `letter-spacing: 0.12em` | `0.8125rem` | Nav, dates, labels |

**Korean typeface matters here.** The homepage glyph is 재민 set very large, so the Hangul face carries the whole page. Use a high-quality Korean display face — Pretendard, SUIT, or Freesentation. Do not let it fall back to a system font. Check the glyph at full size on both mac and windows before signing off.

Self-host or use the framework's font loader. `font-display: swap`.

---

## Page 1 — Home (Frontispiece)

A Renaissance title page. Vertical, centered, mostly empty. Dominant pigment `--lapis`.

1. **Nav** — top left, `--type-meta` lowercase: `home · works · contact`. Small monogram mark in the corner
2. **Portico arch** — hairline SVG arch framing the name, in `--lapis` at full saturation, `1.5px` stroke. Generated SVG, not an image. Below `768px`, drop the pilasters and keep only the curve
3. **재민** — `--type-name`, in `--umber`, centered in the arch opening. The dominant element on the page. Latin name in `--type-meta` beneath
4. **Portrait medallion** — my photo inside a hairline oval frame, treated as an engraved author portrait: high-contrast, **duotone in `--lapis` and `--intonaco`** rather than grayscale. It should read as a printed plate, not a photograph. Maximum 120px
5. **Bio** — one line, serif, lowercase, `--umber`. One line only
6. **Links** — a row of hairline-bordered icons: email, github, linkedin, scholar. No labels. Icons in `--lapis`, shifting to `--orpiment` on hover
7. **Plinth rule** — thin `--lapis` hairline with a small `--orpiment` lozenge at center

Ground is clean `--intonaco`. No plate on this page — the arch, the name, and the portrait are enough.

---

## Page 2 — Works (Index of plates)

A book's table of plates. Single column, numbered. Dominant pigment `--vermilion`.

```
I.    PROJECT NAME                                   2026
      one or two lines, serif, on what it is and why it exists.
      ─────────────────────────────────────────────────────
```

- **Roman numeral** in `--vermilion`, left margin
- **Project name** in `--type-entry` display caps, `--umber`
- **Year** right-aligned, mono, `--umber-soft`
- **Description** serif, one or two lines maximum, lowercase, plain
- **Hairline rule** beneath each entry in `--vermilion` — no cards, no boxes, no shadows
- Outbound links (paper, repo, demo) as small `--vermilion` text at the end of the description, not buttons
- **Cangiante hover:** the row's rule and numeral shift vermilion → verdigris, `200ms`

**Grouping.** My work clusters into computational drug discovery, medical imaging, biosensors, and a startup. Group under small serif-italic subheadings, but keep the roman numerals **continuous across groups**, the way a real index runs.

One engraved plate sits behind this page — **duotone in `--vermilion`**, not bleached gray, at low enough opacity that every line of text stays fully legible. Feathered into the page with no bounding box.

---

## Page 3 — Contact (Colophon)

Renaissance books closed with a colophon: who printed the volume, where, when. Dominant pigment `--verdigris`.

- Page title in `--type-title`
- Two or three lines of serif, lowercase, on what I'd like to hear about
- Contact links as a hairline list, one per row, not icons. Rules in `--verdigris`, cangiante to `--madder` on hover
- A colophon block at the foot, serif italic, `--umber-soft`, in the shape of a printer's imprint but written casually — something like *set in founders grotesk & pretendard, made in seoul, 2026*. Keep it light; the reference site ends with "powered by curiosity & matcha" and that register is right
- The second plate lives here, duotone in `--verdigris`, small, off to one side

---

## Imagery

**Two plates total, sitewide.** Plus the portrait. That is the entire image budget.

Source public domain from Wellcome Collection (`wellcomecollection.org` — best first stop, mostly CC0), the Met Open Access, Rijksmuseum, Internet Archive, or Biodiversity Heritage Library. Look for Vesalius anatomical plates, Renaissance botanical illustration, Piranesi etchings, engraved frontispieces.

**Verify the license on each.** A 1543 engraving being public domain does not mean the institution's *scan* is. Prefer explicit CC0. Keep a short `CREDITS.md` with source, work, date, license.

**Treatment — duotone, not bleached:**
1. Convert to high-contrast grayscale
2. Map the tonal range to **`--intonaco` → the page's dominant pigment** (a real duotone, not a colored overlay)
3. Reduce to ~30% opacity against the ground
4. Feather the edges with a radial alpha mask so it dissolves into the page. No bounding box, ever
5. Export WebP/AVIF with fallback

This is the key departure from the usual antique treatment. The plates are *colored*, not aged.

---

## Motion

**Three effects sitewide. That is the entire budget.**

1. **Arch draw-in** *(home, on load)* — the arch draws itself via `stroke-dashoffset`, `1200ms`, ease-out. Contents then fade up in sequence: name → portrait → bio → links, `400ms` each, `80ms` stagger
2. **Entry fade-up** *(works)* — project rows fade and rise `16px` on scroll entry, `500ms`, `60ms` stagger
3. **Cangiante hover** — as described above, `200ms` hue shift on rules, numerals, icons, and links

Nothing else moves. No page transitions, no cursor effects, no parallax, no scroll-jacking.

Everything gates behind `prefers-reduced-motion: reduce` — content appears in final state, no fade. The cangiante hover is a color change with no motion, so it may stay.

### Banned

Particle fields, matrix rain, neon glow, glitch effects, animated gradients, 3D tilt, magnetic buttons, custom cursors, typewriter text, loading spinners. Also: laurel wreaths, marble textures, gold foil, Greek key borders, column clip-art, or any "ancient Rome" stock asset. The classicism is structural, never ornamental — and the color is pigment, never neon.

---

## Constraints

**Accessibility.** Saturated pigments on a light ground fail contrast easily. Check every one:
- `--orpiment` on `--intonaco` is **almost certainly too light for text** — restrict it to ornament, lozenges, and hairlines. Never body copy
- `--verdigris` and `--vermilion` need checking at small sizes; fall back to `--umber` for text where they fail
- All body text is `--umber` regardless. Pigments carry structure, not prose
- Target WCAG AA: 4.5:1 body, 3:1 large display. Visible focus rings in the page's dominant pigment
- Contrast-check text over duotone plates against the plate's busiest region. If it fails, reduce plate opacity — never add a scrim
- Decorative arch and plates: `aria-hidden="true"`, empty `alt`. The portrait gets real alt text

**Responsive.** The arch is fragile at narrow widths — below `768px` keep only the curve. Works entries stack with the roman numeral above the project name. Verify 재민 at `--type-name` doesn't overflow on a 390px viewport.

**Performance.** Three pages of type and hairlines should be near-instant. Architecture is generated SVG, not images. Preload only the portrait.

---

## How to work

1. **Read the codebase first.** Report the framework, where styles live, how pages are defined, and every file you plan to touch. **Then stop and wait for my approval.**
2. **Remove blog and reading** cleanly. Confirm nothing else references them
3. **Build the color tokens and check contrast** on all six pigment-on-ground pairings. Report which fail and at what sizes, before building anything
4. **Source the two plates.** Show me candidates and the credits manifest before processing
5. **Homepage first**, static, no motion. Show me
6. Then Works, then Contact, then the three animations. Commit per page
7. **If anything reads as costume rather than structure, say so and stop.** I would rather cut an element than ship a theme-park version of this

## Out of scope

New content, new pages, CMS changes, analytics.
