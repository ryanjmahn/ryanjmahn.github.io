# Build Prompt — ryanjmahn.github.io v-next

> **For:** Claude coding agent working in the `ryanjmahn.github.io` repo
> **Mode:** autonomous build with a closed verification loop (see §7). Do not stop after the first pass.
> **Goal in one line:** a multi-page personal site that reads like a technical SF founder's homepage — terminal-precise and minimal — but set with the restraint of a classical book page.

---

## 0. Context (read first)

- Owner: **Ryan Ahn** (재민), high school senior in Seoul. Currently building **OpenWM** — world models for physical design. Background: STEMise, DSH Hacks / UnivaBio, Probix Labs, comp-bio research (KRAS G12D, protein ML evaluation), NeurIPS 2026 workshop papers.
- The site is a core piece of an application to **The Horowitz Andreessen Academy**. It should tell the story of someone who *builds*, not list achievements.
- Stack stays **vanilla HTML / CSS / minimal JS on GitHub Pages**. No framework, no build step, no tracking scripts.
- Existing content and assets in the repo are the source of truth for facts. **Never invent numbers, titles, affiliations, or dates.** If a fact is missing, leave a visible `<!-- TODO(ryan): ... -->` and list it in the final report.

### Three references and what each contributes

| Reference | Take | Don't take |
|---|---|---|
| **ryanjmahn.github.io** (current) | Voice (lowercase, short, "sup! i'm ryan"), italic-serif name treatment, portrait, logo-led entries, bolded metrics, the colophon line ("end of entry. seoul · last revised …"), light/dark toggle, `#0D0C0B` ink | Single-page structure |
| **array.vc** | The techy skeleton: bracketed wordmark `[ array.vc ]`, the `>`-chained category ticker ("defense > scientific discovery > … > EVERYTHING >"), a small 3-up stat strip, the portfolio rendered as a **real table** (Company / Description / Category / Stage), "Recent wins" list separated by `/`, the "Chat with us" mini-form that just composes a `mailto:` | VC framing, any copy, their exact palette or logo shapes |
| **wenhao-lu.com** | **Information architecture** (see §3): short top nav with a monogram, a home page = portrait + icon links + 2–3 sentence intro + grouped highlights + "full cv →"; separate projects / initiatives / cv / blog / contact pages; "← back home" on subpages; quote-led initiatives page; CV with logo + role + date + bullets, numbered publications, awards with proof images; playful footer line | Its look (al-folio Jekyll theme). **The structural debt must not be obvious** — rename sections, reorder, and give them our own voice |

---

## 1. Design direction: "terminal × folio"

Think: a YC founder's homepage typeset by someone who loves old scientific books. Two registers, used deliberately:

- **Classical register** (headlines, names, section titles, pull quotes): Instrument Serif — roman for most, *italic* for emphasis words. Large, calm, generous leading.
- **Technical register** (nav, labels, metadata, dates, tables, stats, tags, ticker, buttons): a monospace — **JetBrains Mono** or **Geist Mono** (pick one; load from Google Fonts / fontsource CDN). Uppercase-optional, small, tracked +0.02em.
- **Body text:** Instrument Serif is too delicate at paragraph size — use **Inter** or **Geist** for body (16–17px, 1.6 line-height), *or* keep a sturdier serif (Newsreader / EB Garamond) if it reads better in testing. Decide in Loop 1 with screenshots, record the decision.

### Classical elements (use sparingly — 3–4 max on any page)
- Section numbering in **roman numerals** in mono: `§ I — built`, `§ II — research`.
- **Hairline rules** (1px, 12% ink) between sections; a double rule under the masthead.
- A **margin gutter** on desktop for dates/metadata (left column, mono, muted) — book-margin style, like the current site's date gutter.
- **Small caps** for org names (`font-variant: small-caps` on the serif).
- One **fleuron / § mark** to end long pages, followed by the colophon line.
- Optional: a single drop cap on the home intro. Kill it if it looks costume-y.

### Techy / SF elements
- Wordmark: `[ ryan ahn ]` in mono, top-left (echo of `[ array.vc ]`, not a copy — lowercase, our spacing).
- **Interest ticker** under the hero, `>`-chained and slowly scrolling on desktop, static and wrapped on mobile:
  `world models > physical design > comp bio > trustworthy science > education > everything >`
- **Stat strip**: 3–4 cells, mono label above, serif numeral below. Candidates (verify each against repo): `5k+ youths reached`, `130 nations`, `2.5k hackers`, `2 neurips workshop papers`.
- **"Building" table** (array's portfolio table, adapted): columns `project / what it does / domain / status`. Rows link out. On mobile collapses to stacked cards.
- **Recent** list: short dated wins separated by `/` (e.g. `neurips tae accepted / openwm …`), linking to sources.
- **"reach out"** button that opens a tiny modal (name, what are you working on) and composes a `mailto:` — no backend, no form service. Must be keyboard-accessible and closable with Esc.
- Subtle `:hover` states: underline grows from left; table rows get a faint background. No glow, no gradients, no particles, no glassmorphism.

### Palette (tokens on `:root`)
```
--paper:   #F4F1EA   /* warm off-white, light mode bg */
--ink:     #0D0C0B   /* existing theme color */
--muted:   #6B6862
--rule:    rgba(13,12,11,.12)
--accent:  #2B4BFF   /* one cold "signal" blue for links/active states — test #1F3A93 too */
```
Dark mode: `--paper:#0D0C0B; --ink:#ECE8DF; --muted:#8F8B83; --rule:rgba(236,232,223,.12)`. Respect `prefers-color-scheme`, keep the existing manual toggle, persist choice in `localStorage` (wrapped in try/catch).

### Layout
- Content column max **680px** for prose; tables/stat strip may widen to **960px**.
- Desktop: left margin gutter (~140px) for dates/§ numbers. Mobile (≤640px): gutter folds inline above each entry; 16px side padding; **zero horizontal scroll**.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 112.
- Optional ambient layer: a very faint dot-grid or blueprint grid (≤4% opacity) behind the hero only. If it competes with type, remove it.

### Motion
- Ticker marquee (pause on hover, `prefers-reduced-motion` → static).
- Page sections fade/slide 8px on first view (IntersectionObserver, once). That's it.

---

## 2. Voice & copy rules
- Lowercase throughout headings/nav (matches current site). Proper nouns and acronyms keep their case where readability needs it (NeurIPS, KRAS, YC).
- Short declarative lines. Verbs first: "built", "benchmarked", "found", "directed".
- Every entry answers: **what I built → why it matters → one hard number or outcome.**
- Bold only the metric, never whole phrases.
- No "passionate", "leveraging", "innovative", "spearheaded".

---

## 3. Site structure (wenhao-inspired, renamed)

Top nav (mono, small): `[ ryan ahn ]   home   building   research   log   cv  |  writing   contact   ◐`

| Page | File | Modeled on | Content |
|---|---|---|---|
| **home** | `index.html` | wenhao home + array hero | masthead (name in serif with italic *ryan*, small 재민 beside it), portrait, icon links (email, github, linkedin, scholar if exists), 2–3 sentence intro, interest ticker, stat strip, **highlights** grouped `building / research / communities` (3 lines each max), **recent** list, "full cv →", reach-out button |
| **building** | `building.html` | array portfolio table + wenhao projects | intro line; the table (OpenWM, Probix Labs, STEMise, DSH Hacks + UnivaBio, Synthify if confirmed); below it one long-form card per *current* project: domain tag (mono), title, 3–4 sentence abstract, year, image/diagram, "visit ↗" |
| **research** | `research.html` | wenhao projects (long-form) + cv publications | one card per work: tag, title, venue/status badge, plain-English abstract, figure, links (pdf / site / code). Then a **numbered publications list**. Entries to port: KRAS G12D switch-II benchmark (w/ Prof. Se-Jin Hwang, Hanyang), Contaminated Ancestors (NeurIPS 2026 TAE), Project UNISON (Barnard). Add if confirmed in repo: MedMNIST Extension / DermaMNIST (NeurIPS 2026 AIDaR), PDAC segmentation, magnetoelastic CA 19-9 biosensor |
| **communities** | section inside `building.html` *or* own page `communities.html` | wenhao initiatives | lead with a one-sentence mission statement (Ryan's own words — accessible, trustworthy science), then per org: logo, name, role, one-liner, 3–5 metric bullets |
| **log** | `log.html` | array "recent wins" + wenhao blog index | reverse-chron dated list, mono dates in gutter: shipped / accepted / launched / learned. Seed with 6–10 real items from repo history |
| **cv** | `cv.html` | wenhao cv | education → research → building/leadership → publications (numbered) → awards. Each entry: logo, org (small caps), role, date range right-aligned in mono, bullets. Link a PDF if one exists in `/assets` |
| **writing** | `writing/index.html` | wenhao blog | list of essays (title, date, 1-line dek). If none exist yet, ship the page with one placeholder entry flagged TODO, not lorem ipsum |
| **contact** | `contact.html` | wenhao contact | one paragraph on what Ryan wants to hear about, email, socials, the same mailto modal |

Every subpage: `← home` link under the title, same footer.

**Footer (all pages):** icon links · `© 2026 · built in seoul, powered by <something true and specific>` · colophon `end of entry. seoul · last revised {month yyyy}` (auto from a single constant in `site.js`).

**Disguise the wenhao structure:** different nav labels (done above), table-first building page instead of card-first, stat strip and ticker on home, "log" instead of a blog-first nav, our own footer joke.

---

## 4. Technical requirements
- Shared `assets/css/site.css` (tokens, type, layout) and `assets/js/site.js` (theme toggle, ticker, modal, reveal, colophon date). Each HTML page is self-contained otherwise.
- Shared header/footer: duplicate markup per page (no build step) but keep it **byte-identical**; add a tiny `scripts/check-partials.sh` that diffs them.
- Semantic HTML: `header / nav / main / section / article / footer`; one `h1` per page; skip link.
- Per-page `<title>`, meta description, OG/Twitter tags (reuse existing OG images in `assets/img/og/`).
- Images: `loading="lazy"`, explicit width/height, WebP where present, descriptive `alt`.
- Fonts: `display=swap`, preconnect, max 2 families + 1 mono, ≤4 weights total.
- Accessibility: WCAG AA contrast in both themes, visible focus rings (accent, 2px offset), modal traps focus, everything works keyboard-only.
- Performance budget: each page **< 300KB** transferred excluding portrait, Lighthouse ≥ 95 on Performance / Accessibility / Best Practices / SEO.
- Keep old URLs working: `works.html` and any removed pages → meta-refresh redirect to the new equivalent.

---

## 5. Out of scope
Particles, WebGL, scroll-jacking, cursor effects, carousels, auto-playing video, any analytics, any third-party form backend, color gradients as backgrounds.

---

## 6. Deliverables
1. All pages in §3, live-previewable via `python3 -m http.server`.
2. `DESIGN.md` — tokens, type scale, component list, decisions made during loops and why.
3. `LOOP_LOG.md` — one entry per loop iteration (see §7).
4. Final report in chat: what shipped, open TODO(ryan) facts, rubric scores, screenshots of every page at 375 / 1440 in both themes.

---

## 7. Loop engineering — how to work

Do **not** build everything and stop. Work in explicit, logged loops. Each loop has a goal, a build step, a verification step with real evidence, a critique against a rubric, and an exit check.

### 7.1 Tooling to set up in Loop 0
- Local server: `python3 -m http.server 8000`.
- **Playwright** (`npx playwright` / `pip install playwright`) script `scripts/shoot.(js|py)` that screenshots every page at **375, 768, 1440** widths × **light/dark** → `.loop/shots/loop-N/`.
- `scripts/check.sh` that runs, and fails loudly on:
  - horizontal overflow at 375px (`document.documentElement.scrollWidth > innerWidth`)
  - broken internal links / missing assets (crawl from `index.html`)
  - more than one `h1`, missing `alt`, missing `<title>`/meta description
  - partial drift (`check-partials.sh`)
  - Lighthouse CI (`npx lighthouse` or `@lhci/cli`) scores below 95
  - grep for banned words (§2) and `lorem`
- First, open **array.vc**, **wenhao-lu.com**, and the current site in the browser, inspect computed fonts/colors/spacing with DevTools, and screenshot them into `.loop/refs/`. Write 5 bullets per site in `DESIGN.md` on what you observed. Adjust §1 tokens if what you see contradicts them — note the change.

### 7.2 Loop sequence

| Loop | Goal | Exit when |
|---|---|---|
| **0 — Audit** | Inventory current repo content, assets, URLs; build tooling; reference screenshots | `content-inventory.md` lists every fact with its source file; scripts run green on the *current* site or failures are listed |
| **1 — System** | Tokens, type scale, grid, nav, footer, theme toggle on a `styleguide.html` page showing every component (both registers, table, stat strip, ticker, rules, § numbering, modal, buttons) | Styleguide screenshots pass rubric A + B ≥ 4/5; body-font decision recorded |
| **2 — Home** | Build `index.html` | Rubric ≥ 4 on every row; a cold reader can answer "what is ryan building right now?" from the first viewport |
| **3 — Building + Research** | Table + long-form cards, publications list | All facts trace to `content-inventory.md`; table collapses cleanly at 375 |
| **4 — Log, CV, Writing, Contact, Communities** | Remaining pages | Structure matches §3; no lorem; redirects in place |
| **5 — Polish** | Cross-page consistency, motion, dark mode, micro-typography (quotes, dashes, non-breaking spaces before units, tabular numerals in tables/stats) | Full rubric ≥ 4 everywhere, `check.sh` green |
| **6 — Adversarial review** | Spawn/act as a **fresh reviewer that has not seen the build process**. Give it only the screenshots + this prompt. It scores the rubric and lists the 5 weakest things | Fix every item scored < 4, rerun check, re-shoot. Max 2 review rounds |

### 7.3 The inner loop (run inside every loop above)
```
plan    → write the loop goal + 3 concrete acceptance checks in LOOP_LOG.md
build   → smallest change that could meet them
verify  → run scripts/check.sh and scripts/shoot; LOOK at the screenshots (open the images, don't assume)
critique→ score rubric rows relevant to this loop, 1–5, with one sentence of evidence each
decide  → all ≥ 4 and checks green? → exit loop. else → list fixes, repeat
```
- **Iteration cap:** 4 inner iterations per loop. If still failing, log why, pick the best version, move on, and flag it in the final report.
- **No silent regressions:** after any shared CSS/JS change, re-shoot *all* finished pages, not just the current one.
- **Evidence over claims:** every "fixed" line in the log must cite a screenshot path or a script output.

### 7.4 Rubric (score 1–5)
| # | Criterion | 5 looks like |
|---|---|---|
| A | **Register discipline** | Serif only for names/headlines/quotes, mono only for meta/data; never mixed within one element |
| B | **Restraint** | ≤ 4 classical devices per page; whitespace reads intentional, not empty |
| C | **Founder signal** | First viewport says what he's building now and why it matters; feels like an SF startup founder, not a student résumé |
| D | **Story** | Pages read as a builder's trajectory (communities → research → startups → OpenWM), not an award dump |
| E | **Originality** | Doesn't look like al-folio or a clone of array.vc; a viewer of both wouldn't call it a copy |
| F | **Mobile** | 375px is as considered as desktop; no overflow, tables collapse gracefully, tap targets ≥ 44px |
| G | **Truth** | Every number/claim traces to the content inventory |
| H | **Craft** | Alignment to grid, consistent spacing tokens, tabular numerals, good rag, AA contrast, both themes polished |

### 7.5 Stop conditions
Finish only when: all pages exist, `check.sh` is green, every rubric row ≥ 4 on every page in both themes at 375 and 1440, the adversarial review's issues are resolved or explicitly flagged, and `LOOP_LOG.md` + final report are written. Then commit on a branch `redesign/terminal-folio` with one commit per loop and open a PR — do not push to `main`.
