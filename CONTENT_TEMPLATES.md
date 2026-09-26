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

**KRAS G12D benchmark.** Under review at the Columbia Junior Science
Journal. When a decision comes back, replace the status line under the
entry title:
```html
<p class="paper-venue">Manuscript under review, Columbia Junior Science Journal · sole author</p>
```
If accepted, swap it for the citation, and replace the self-hosted
manuscript link (`/assets/papers/kras-g12d-switch-ii-benchmark.pdf`) with
the journal's page, or with the published PDF if CJSJ allows it:
```html
<p class="paper-venue">[citation] · sole author</p>
<p class="paper-link"><a href="[paper url]" target="_blank" rel="noreferrer">[venue] ↗</a> · <a href="https://github.com/ryanjmahn/KRASG12DBenchmarking" target="_blank" rel="noreferrer">Code and data →</a></p>
```


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
