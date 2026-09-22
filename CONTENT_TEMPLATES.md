# Content templates

Copy-paste blocks for everything still marked `TODO(ryan)` on the site.
Each one shows exactly where it goes, the HTML pattern already in use
on that page, and a filled-in example. Swap the bracketed text, paste
over the matching `<!-- TODO(ryan): ... -->` line, done — no other
markup needs to change.

---

## cv/index.html

### Education

Find:
```html
<span class="gutter-label">education</span>
<div class="entry-body">
  <p><!-- TODO(ryan): add school / grade / program --></p>
</div>
```

Replace the `<p>` line with one paragraph per school/program (add more
`<p>` tags for more than one):
```html
<p>[School name] — [grade/class, e.g. "11th grade"], [program or track, if any].</p>
```
Example:
```html
<p>Korea International School — 11th grade, STEM track.</p>
```

### CV PDF link

Find:
```html
<p style="margin-top: var(--s3); font-family: var(--font-bracket); font-size: 15px; color: var(--ink-2);">
  <!-- TODO(ryan): link a PDF version of this CV --> download cv (pdf) — coming soon
</p>
```
Once you have a PDF, drop the file at `assets/cv-ryan-jaemin-ahn.pdf`
and replace the whole `<p>` with:
```html
<p style="margin-top: var(--s3); font-family: var(--font-bracket); font-size: 15px; color: var(--ink-2);">
  <a href="/assets/cv-ryan-jaemin-ahn.pdf">download cv (pdf) →</a>
</p>
```

---

## research/index.html

Two `TODO(ryan)` comments, one per project, both inline after the
existing sentence:
```html
<p>PDAC tumor segmentation — CNN vs. transformer benchmarking. <!-- TODO(ryan): link / status --></p>
...
<p>KRAS G12D cryptic-pocket prediction — benchmarking study. <!-- TODO(ryan): link / status --></p>
```
If there's a paper, preprint, GitHub repo, or poster to link, replace
the whole `<p>` with:
```html
<p><a href="[url]" target="_blank" rel="noreferrer">PDAC tumor segmentation</a> — CNN vs. transformer benchmarking. [status, e.g. "in progress" / "preprint under review"]</p>
```
If there's nothing to link yet, just swap the comment for a plain
status word so it doesn't read as an oversight:
```html
<p>PDAC tumor segmentation — CNN vs. transformer benchmarking. (in progress)</p>
```

---

## Korean quote verification (index.html was simplified — this line
currently only appears if you re-add Plate 002's quote block)

The build brief's Plate 002 spec included a Korean translation of the
thesis line that was flagged for verification:
```
혁신만을 위해서가 아니라, 사회에 책임 있게 기여하기 위해 만든다.
```
This isn't currently rendered anywhere on the live pages (it was part
of an optional `.plate__quote` block that didn't make it into the
final home/built markup). If you want to add it back under the
thesis line anywhere, the pattern used elsewhere for a Korean gloss is:
```html
<p class="entry-body">i build not only to innovate, but also to responsibly serve society.</p>
<p style="font-family: var(--font-kr-serif); font-size: 13px; color: var(--ink-2);">[verified Korean phrasing]</p>
```
Have a native speaker (or your own gut) check the phrasing above
before using it — it was machine-drafted, not verified.

---

## General pattern: adding a new hairline-list entry anywhere

Every "quiet column" list on the site (built, initiatives, research,
cv) uses the same structure. To add a new row to any of them:
```html
<li>
  <span class="gutter-label">[short label, lowercase]</span>
  <div class="entry-body">
    <p>[body text — links use <a href="..." target="_blank" rel="noreferrer">text</a>]</p>
  </div>
</li>
```
Drop it inside the existing `<ul class="hairline-list">` /
`<ol class="hairline-list">` on that page. A hairline rule and the
spacing are automatic — no extra markup needed.
