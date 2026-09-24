# Content templates

Copy-paste blocks for everything still marked `TODO(ryan)` on the site.
Each one shows exactly where it goes, the HTML pattern already in use
on that page, and a filled-in example. Swap the bracketed text, paste
over the matching `<!-- TODO(ryan): ... -->` line, done — no other
markup needs to change.

---

## research/index.html

Two entries: the NeurIPS paper (`#contaminated-ancestors`), then the KRAS
G12D benchmark (`#kras-benchmark`).

**Paper link.** When the OpenReview/proceedings page is live, replace
the placeholder line (never link or host the submission PDF):
```html
<p class="paper-link">Paper link coming after camera-ready.</p>
```
with:
```html
<p class="paper-link"><a href="[openreview or proceedings url]" target="_blank" rel="noreferrer">read the paper ↗</a></p>
```

**KRAS G12D benchmark.** When the submission lands, add the venue and
paper link next to the code link:
```html
<p class="paper-link"><a href="https://github.com/ryanjmahn/KRASG12DBenchmarking" target="_blank" rel="noreferrer">Code and data →</a> · <a href="[paper url]" target="_blank" rel="noreferrer">[venue] ↗</a></p>
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
