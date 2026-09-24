# Credits

## Home intro portrait
`assets/img/src/portrait.jpg` — personal photo (mine). Exported grayscale
by the image pipeline to `assets/img/portrait-480.{avif,webp,jpg}`. No
external license needed.

## ASCII portrait easter egg
`assets/img/src/ryan.png` — personal photo, converted offline by
`tools/ascii.py photo --plain` into plain monochrome ASCII (no per-character
color, to match the black-and-white site). It lives only in the browser
console (`assets/js/site.js`) and on `/404.html`; the source photo is not
loaded by any page.

## Plate photography

Every plate follows one brief: one person, tiny in the frame, inside
something much bigger; a silhouette, never a portrait; a large quiet zone
(fog, snow, sky, black) where the headline goes; atmosphere; hard
directional light; crushed blacks and clipped highlights.

All of these are CC0. They're early Unsplash photos, from when Unsplash
published under CC0, as archived on Wikimedia Commons (each links to its
Commons page, which carries the original Unsplash source). Every file was
downloaded from those pages, none from a screenshot. The untouched
originals are in `assets/img/src/` under the output name; for files
larger than 3840px, that's Wikimedia's 3840px rendition.

Every plate sits on the blue field: the photo gets the `.grade-blueprint`
duotone and blends `luminosity` over it. Plate 001's snow/ice photos are
also exposed down (`brightness(.58)`) so a light headline holds on them.

## Blue-field reference
`assets/img/src/backgrund.jpg` — Ryan's reference for the colour system.
Not loaded by any page: the field is built in CSS and tuned against it.

### Regenerating the images

```sh
tools/process-images.sh              # all of them
tools/process-images.sh plate-003-b  # one
node tools/sync-plates.js            # after editing assets/js/plates.js
python3 tools/make-og.py             # share images + favicons
```

`tools/process-images.sh` runs `tools/process_images.py` (Pillow 11+, which
has AVIF built in). For each entry in `tools/images.json` it crops to the
plate's 3:4 frame, converts to grayscale, levels (clipping 1% of shadows
and 0.5% of highlights), applies an optional per-photo gamma so a plate's
three variants carry the same tonal weight, then a steep S-curve for
crushed blacks and clipped highlights. That baked grade is the final look;
on paper plates the CSS `.grade-silver` class only adds `grayscale(1)` as
a safety net; on dark plates `.grade-blueprint` adds the blue duotone.
Exports are AVIF + WebP + JPG at 1000/1600/2000px long edges, with AVIF
stepped down in quality until each file is under ~180 KB.

To add a photo: put the original in `assets/img/src/`, add it to
`tools/images.json`, run the pipeline, add the variant (with its own alt
text) to `assets/js/plates.js`, run `node tools/sync-plates.js`, and add a
row here.

### Rotating plates (three variants each)

| file | shows | source | photographer | license |
|---|---|---|---|---|
| `plate-001-a` | figure and dog crossing a snowfield | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Man_and_his_dog_(Unsplash).jpg) | adrian aows | CC0 1.0 |
| `plate-001-b` | ice climber on a white ice wall | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bridal_Veil_Falls_ice_climber_(Unsplash).jpg) | Greg Rakozy grakozy | CC0 1.0 |
| `plate-001-c` | hiker on a snowfield below a peak | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hiking_in_the_Swiss_Alps_(Unsplash).jpg) | René Reichelt rene_reichelt | CC0 1.0 |
| `plate-002-a` | photographer and tripod against a dusk horizon | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sunset_Photographer_(Unsplash).jpg) | Kirill Zakharov kirillz | CC0 1.0 |
| `plate-002-b` | figure on a ridge at sunset | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Man_standing_plane_sunset_(Unsplash).jpg) | Dardan Mu dardan | CC0 1.0 |
| `plate-002-c` | walker on a fenced horizon | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Horizon_person_silhouette_(Unsplash).jpg) | Chris Roe chrisjroe | CC0 1.0 |
| `plate-003-a` | figure on a hilltop under stars | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:A_Sky_Full_Of_Stars_(Unsplash).jpg) | Joshua Earle joshuaearle | CC0 1.0 |
| `plate-003-b` | figure with headlamp under the Milky Way | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Nick_Fisher_2017_(Unsplash).jpg) | Nick Fisher nick | CC0 1.0 |
| `plate-003-c` | figure holding a light under stars | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Stars_Flashlight_Cajon_Pass_(Unsplash).jpg) | Jeremy Bishop tidesinourveins | CC0 1.0 |
| `plate-004-a` | kayaker in low sun glare | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sunset_kayak_(Unsplash).jpg) | Patrick Fore patrickian4 | CC0 1.0 |
| `plate-004-b` | paddlers on a flat horizon | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:People_Silhouette_Rafting_(Unsplash).jpg) | Farjad Karimimir farjkarimimir | CC0 1.0 |
| `plate-004-c` | surfer on black sand at sunset | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sunset_surf_(Unsplash).jpg) | Alex Wigan alwig64 | CC0 1.0 |
| `plate-005-a` | figure at a cave opening, shaft of light | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:At_The_Cave%27s_Opening_(Unsplash).jpg) | Daniel Burka dburka | CC0 1.0 |
| `plate-005-b` | Son Doong Cave, light through the roof | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Son_Doong_Cave_by_Daniel_Burka.jpg) | Daniel Burka | CC0 1.0 |
| `plate-005-c` | figure walking out of a tunnel into light | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Into_the_Light_(Unsplash).jpg) | Chris B scorpkris | CC0 1.0 |

### Single-photo plates

| file | shows | source | photographer | license |
|---|---|---|---|---|
| `plate-006` (cv) | figure standing in fog on a shore | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Into_A_Fog_(Unsplash).jpg) | frank mckenna frankiefoto | CC0 1.0 |
| `plate-008` (contact) | figure on a ledge mirrored in still water | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Man_silhouette_standing_(Unsplash).jpg) | Seth Willingham waterproject | CC0 1.0 |
| `plate-009` (diary) | hiker on a ski track in snowy mountains | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mountain_hiker_(Unsplash).jpg) | Sujitkun Khantayana parkkun | CC0 1.0 |

## Fonts
Self-hosted in `assets/fonts/`, all under the SIL Open Font License 1.1:
Instrument Sans and Instrument Serif (Instrument), Tinos (Steve Matteson /
Google), Pretendard (Kil Hyung-jin; subset to the Korean characters the
site uses by `tools/subset-fonts.sh`).

## Icons
Home intro icon row (email / github / linkedin / diary) uses inline
1px-stroke SVGs hand-drawn in the style of [Lucide](https://lucide.dev)
(ISC license) — not copied directly from the Lucide source files.
