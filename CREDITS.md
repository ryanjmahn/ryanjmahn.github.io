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

## Plate photography

All five plates now use real, licensed photographs (CC0 / public domain
only, per §1.3). Sourced via the Openverse API (openverse.org), which
indexes CC-licensed and public-domain work from Wikimedia Commons, the
Library of Congress, StockSnap, and other open archives, plus direct
from Wikimedia Commons. Each file below is graded in CSS per §4.5
(`.grade-...` classes) — the source photos are unedited aside from
resizing and WebP/JPEG export.

| plate | path | grade | source | author | license |
|---|---|---|---|---|---|
| 001 — home hero | `assets/img/plate-001.{webp,jpg}` | `.grade-silver` | [WordPress Photo Directory, via Openverse](https://wordpress.org/photos/photo/8896a6efa0/) — Mount Everest's summit at sunrise | Bijay Kumal | CC0 1.0 |
| 002 — Probix | `assets/img/plate-002.{webp,jpg}` | `.grade-warm` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:San_Francisco_skyline_from_Marin_Headlands.jpg) — "San Francisco skyline from Marin Headlands" | Ryan Schwark | CC0 1.0 |
| 003 — STEMise | `assets/img/plate-003.{webp,jpg}` | `.grade-film` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:AS11-44-6667_-_Full_Moon_Photographed_From_Apollo_11_Spacecraft.jpg) — "Full Moon Photographed From Apollo 11 Spacecraft" | NASA | Public domain (US government work) |
| 004 — Hackathons | `assets/img/plate-004.{webp,jpg}` | `.grade-film` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:USMC-16033.jpg) — U.S. Armed Forces Sports boxing match | MC2 Elliott Fabrizio (U.S. Navy) | Public domain (US federal work) |
| 005 — Research | `assets/img/plate-005.{webp,jpg}` | `.grade-cyan` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Small_Molecule_Probe_Targeting_Cancer_(41658265005).jpg) — "Small Molecule Probe Targeting Cancer," fluorescence microscopy of cancer cells | NCATS Chemical Genomics Center (NIH) | Public domain (US federal work) |
| 006 — CV | `assets/img/plate-006.{webp,jpg}` | `.grade-cyan` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:TROPICS_Rocket_Launch_(KSC-20230507-PH-RLS01_0005-reupload).jpg) — a Rocket Lab launch, NASA/Kennedy Space Center | NASA / Kennedy Space Center | Public domain (US federal work) |
| 008 — Contact | `assets/img/plate-008.{webp,jpg}` | `.grade-warm` | [WordPress Photo Directory, via Openverse](https://wordpress.org/photos/photo/416a282c7f/) — Lower Manhattan skyline at night | Manjil Aryal | CC0 1.0 |
| 009 — Diary | `assets/img/plate-009.{webp,jpg}` | `.grade-film` | [StockSnap](https://stocksnap.io/photo/technology-airplane-S3V8HTDRDS) — "Technology Airplane," a wing at sunrise | Stefan Stefancik | CC0 1.0 |

Exported at ≤2000px long edge, WebP (quality ~72–80) with a JPEG
fallback in `<picture>`, per §4.5. Plate 005's original histology
texture was swapped for a cleaner, higher-contrast microscopy shot;
Plate 004's original photo was swapped for a real boxing-match action
shot. The cv/contact/diary typographic plates (006/008/009), originally
photo-less per the build brief's §2.4, now carry real photos too, at
Ryan's request.

## Icons
Home intro icon row (email / github / linkedin / diary) uses inline
1px-stroke SVGs hand-drawn in the style of [Lucide](https://lucide.dev)
(ISC license) — not copied directly from the Lucide source files.
