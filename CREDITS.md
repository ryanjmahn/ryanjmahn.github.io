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

Every plate photo is public domain or CC0, and every file was downloaded
from its source page below (none came from a reference screenshot). The
untouched originals are kept in `assets/img/src/` under the output name
(`plate-001-a.jpg`, …). For files larger than 3840px, the original is
Wikimedia's 3840px rendition.

### Regenerating the images

```sh
tools/process-images.sh              # all of them
tools/process-images.sh plate-003-b  # one
node tools/sync-plates.js            # after editing assets/js/plates.js
```

`tools/process-images.sh` runs `tools/process_images.py` (Pillow 11+, which
has AVIF built in). For each entry in `tools/images.json` it crops to the
plate's 3:4 frame, converts to grayscale, levels the tones (auto-contrast,
0.5% clip), applies an optional per-photo gamma so the three variants of a
plate carry the same tonal weight, lifts the blacks to ~12%, and exports
AVIF + WebP + JPG at two long edges. The ~12% lift lands at ~4% once the
CSS grade (`.grade-silver` / `.grade-warm`) adds its contrast, so no photo
ever reaches pure `#000`. AVIF quality is stepped down until each file is
under 180 KB.

To add a photo: put the original in `assets/img/src/`, add it to
`tools/images.json`, run the pipeline, add the variant (with its own alt
text) to `assets/js/plates.js`, run `node tools/sync-plates.js`, and add a
row here.

### Rotating plates (three variants each)

| file | shows | source | author | license |
|---|---|---|---|---|
| `plate-001-a` | Hiker in Gardner's Hole | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hiker_in_Gardner%27s_Hole_(35357222490).jpg) | Yellowstone National Park (NPS) | Public domain (US federal work) |
| `plate-001-b` | Hikers on Specimen Ridge | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hikers_on_Specimen_Ridge_(3)_(54553946796).jpg) | Yellowstone National Park (NPS) | Public domain (US federal work) |
| `plate-001-c` | Hiker and raven on Specimen Ridge | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hiker_and_Raven_on_Specimen_Ridge_(portrait)_(37038812242).jpg) | Yellowstone National Park (NPS) | Public domain (US federal work) |
| `plate-002-a` | Test tube rack (view 1) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Test_Tube_Rack_-_DPLA_-_ab2c7f238a8f5431f21593ce530768b5_(page_1).jpg) | Science History Institute, via DPLA | Public domain |
| `plate-002-b` | Test tube rack, two rows of holes | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Test_Tube_Rack_-_DPLA_-_0c07a7de62776c337eb2e34c7fc21a5e.jpg) | Science History Institute, via DPLA | Public domain |
| `plate-002-c` | Test tube rack (view 2) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Test_Tube_Rack_-_DPLA_-_ab2c7f238a8f5431f21593ce530768b5_(page_2).jpg) | Science History Institute, via DPLA | Public domain |
| `plate-003-a` | *Mappemonde*, western hemisphere | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mappemonde_hemisph%C3%A8re_occidental_(oriental)_-_par_le_docteur_Ermete_Pierotti..._-_btv1b530066999_(2_of_2).jpg) | Ermete Pierotti (1820–1880?), Bibliothèque nationale de France | Public domain |
| `plate-003-b` | *Mappemonde*, eastern hemisphere | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mappemonde_hemisph%C3%A8re_occidental_(oriental)_-_par_le_docteur_Ermete_Pierotti..._-_btv1b530066999_(1_of_2).jpg) | Ermete Pierotti (1820–1880?), Bibliothèque nationale de France | Public domain |
| `plate-003-c` | 1682 world map, western hemisphere | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1682_map_of_the_world_by_Hans_Georg_Bodenehr.jpg) | Hans Georg Bodenehr | Public domain |
| `plate-004-a` | Charles Garnier's drafting room, Paris Opéra, c. 1870 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Louis-Emile_Durandelle,_Charles_Garnier_in_the_Drafting_Room_While_Designing_the_New_Paris_Opera,_ca._1870.jpg) | Louis-Émile Durandelle | Public domain |
| `plate-004-b` | Opéra drafting room (Agence) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Op%C3%A9ra_Agence_drafting_room_-_Mead_1991_p138.jpg) | Louis-Émile Durandelle | Public domain |
| `plate-004-c` | Drafting room, Navy Department | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Drafting_room,_Navy_Dept._LCCN2016873947.jpg) | Harris & Ewing, Library of Congress | Public domain |
| `plate-005-a` | Islets of Langerhans near the interlobular ducts, human pancreas | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Larger_Islets_of_Langerhans_Near_the_Main_Interlobular_Ducts_in_the_Human_Pancreas_(32757253077).jpg) | Berkshire Community College Bioscience Image Library | CC0 1.0 |
| `plate-005-b` | Endocrine and exocrine pancreas | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_Endocrine_and_Exocrine_Pancreas_(32757253247).jpg) | Berkshire Community College Bioscience Image Library | CC0 1.0 |
| `plate-005-c` | Ductal system of the exocrine pancreas | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_Ductal_System_Serving_the_Exocrine_Pancreas_(33848119058).jpg) | Berkshire Community College Bioscience Image Library | CC0 1.0 |

Notes on the choices:
- **005.** The brief preferred a CT or MRI slice. The public-domain CT
  images I could find were either brain scans (wrong organ for a PDAC
  plate) or 512px originals, too small for a 2000px plate. Pancreas
  histology is the literal tissue and holds up in grayscale. These
  originals are 1840px tall, so plate 005 exports at 1600/1840 instead
  of 1600/2000.
- **003-c.** Upscaled 4% for its 2000px export.
- **Gamma.** `plate-001-b`, `plate-001-c` and `plate-004-c` carry a gamma
  in `tools/images.json` to match their sets' tonal weight.

### Single-photo plates (no rotation)

These kept their photos from the previous build; they're now baked to
grayscale by the same pipeline.

| file | shows | source | author | license |
|---|---|---|---|---|
| `plate-006` (cv) | A Rocket Lab launch, NASA / Kennedy Space Center | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:TROPICS_Rocket_Launch_(KSC-20230507-PH-RLS01_0005-reupload).jpg) | NASA / Kennedy Space Center | Public domain (US federal work) |
| `plate-008` (contact) | Lower Manhattan skyline at night | [WordPress Photo Directory](https://wordpress.org/photos/photo/416a282c7f/) | Manjil Aryal | CC0 1.0 |
| `plate-009` (diary) | Airplane wing at sunrise | [StockSnap](https://stocksnap.io/photo/technology-airplane-S3V8HTDRDS) | Stefan Stefancik | CC0 1.0 |

## Fonts
Self-hosted in `assets/fonts/`, all under the SIL Open Font License 1.1:
Instrument Sans and Instrument Serif (Instrument), Tinos (Steve Matteson /
Google), Pretendard (Kil Hyung-jin; subset to the Korean characters the
site uses by `tools/subset-fonts.sh`).

## Icons
Home intro icon row (email / github / linkedin / diary) uses inline
1px-stroke SVGs hand-drawn in the style of [Lucide](https://lucide.dev)
(ISC license) — not copied directly from the Lucide source files.
