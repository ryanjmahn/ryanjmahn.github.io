# Credits

## Home intro portrait
`assets/img/src/portrait.jpg` — personal photo (mine), graded to
`.grade-silver` (grayscale + contrast) in CSS on the home page. No
external license needed.

## ASCII portrait easter egg
`assets/img/src/ryan.png` — personal photo, converted offline by
`tools/ascii.py` into a static monospace ascii-art `<pre>`, each
character colored to match its sampled pixel. The source photo is not
loaded by the page; only the converted markup is pasted into
`404.html`. Retired from the main layout in the poster-plates revamp
(§6) — survives only as a `console.log` easter egg and on `/404.html`.

## Plate photography — TODO(ryan): not yet sourced

I can't browse or download from Unsplash/Wikimedia Commons in this
environment, so every plate below is a neutral grey placeholder block
at the correct aspect ratio, per the build brief's §1.3 fallback. Drop
a licensed photo into the path listed and remove the corresponding
`.plate__photo-placeholder` block (swap in a `<picture>`/`<img
class="plate__photo grade-...">`).

| plate | path (once sourced) | grade | search terms |
|---|---|---|---|
| 001 — home hero | `assets/img/plate-001.webp` | `.grade-silver` | "lone climber ridge black and white", "summit clouds hiker" |
| 002 — Probix | `assets/img/plate-002.webp` | `.grade-warm` | "laboratory 1920s public domain" (Wikimedia Commons), "scientist microscope vintage" |
| 003 — STEMise | `assets/img/plate-003.webp` | `.grade-film` | "horizon ocean black and white", "crowd aerial black and white" |
| 004 — Hackathons | `assets/img/plate-004.webp` | `.grade-film` | "auditorium black and white", "people working laptops hall" |
| 005 — Research | `assets/img/plate-005.webp` | `.grade-cyan` | "pancreatic tissue micrograph public domain", "cells microscopy public domain" (Wikimedia Commons / NIH / NCI Visuals Online — verify PD/CC0 license explicitly before using) |

Licenses to use once sourced: Unsplash License, or Wikimedia
Commons/NIH images marked public domain or CC0 only. Record each
image's source URL, author, and license here as it's added.

## Icons
Home intro icon row (email / github / linkedin / diary) uses inline
1px-stroke SVGs hand-drawn in the style of [Lucide](https://lucide.dev)
(ISC license) — not copied directly from the Lucide source files.
