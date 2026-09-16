// ambient bridge background — the actual golden gate bridge photo, resampled
// into a field of small colored dots (in the photo's own colors). dots that
// sample as the bridge's dark saturated steel are drawn bigger & more opaque
// than the pale sky/water dots, so the silhouette stays legible. the field
// stays hidden while you're up in the header (where the ascii portrait
// lives) and materializes, particle by particle, as you scroll down toward
// the entries — so the two never fight for the same space.

(function () {
  const canvas = document.querySelector(".sf-bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const IMG_SRC = "assets/images/golden-gate-bridge.jpg";
  const COLS = 144; // particle grid columns sampled from the full-res photo
  const SATURATION_THRESHOLD = 0.55; // min saturation for the bridge's dark steel — tight enough to reject sky/haze
  const LUMINANCE_THRESHOLD = 110; // steel is genuinely dark; this excludes sunset sky even at its most saturated
  const WARMTH_THRESHOLD = 45; // red-minus-blue above this reads as warm sunset sky, not water/land
  const SCROLL_FADE = 0.09; // width (in scroll-progress units) of each particle's pop-in
  const BRIDGE_RED = [188, 46, 38]; // fixed international-orange red for the structure tier

  // this specific photo has a rocky cliff (bottom-right) and shoreline rocks
  // (bottom-left) that are colorimetrically almost identical to painted
  // steel — dark and warm — so color alone can't separate them. these two
  // small regions are excluded from ever counting as "structure" by position
  function isTerrainMasked(u, v) {
    if (u < 0.38 && v > 0.9) return true; // shoreline rocks, bottom-left
    if (u > 0.78) {
      const cut = 0.62 - (u - 0.78) * 0.6; // the cliff's upper edge slopes up toward the right
      if (v > cut) return true;
    }
    return false;
  }

  // per-tier look: smaller dots read as "particles" rather than a filled-in
  // shape; the structure tier is pinned to one solid red (jittered slightly
  // so it doesn't look dead-flat) rather than each pixel's own sampled tone,
  // so the bridge reads as unambiguously red instead of a muddy mix of dark
  // reds/browns. sky & water keep their real sampled color, soft, as
  // atmosphere rather than subject
  const TIER_STYLE = {
    structure: {
      size: () => 1.0 + Math.random() * 0.7,
      alpha: () => 0.84 + Math.random() * 0.14,
      amp: () => 0.6 + Math.random() * 0.5,
    },
    water: {
      size: () => 0.55 + Math.random() * 0.35,
      alpha: () => 0.26 + Math.random() * 0.12,
      amp: () => 1.0 + Math.random() * 1.1,
    },
    sky: {
      size: () => 0.5 + Math.random() * 0.3,
      alpha: () => 0.2 + Math.random() * 0.1,
      amp: () => 1.1 + Math.random() * 1.3,
    },
  };

  const jitter = (v) => clamp(v + (Math.random() - 0.5) * 16, 0, 255);

  let dpr = 1;
  let w = 0;
  let h = 0;
  let imgAspect = 1920 / 1280;
  let particles = [];
  let resizeFrame = null;
  let fadeStart = 0;
  let fadeEnd = 1;

  function buildParticles(img) {
    imgAspect = img.naturalWidth / img.naturalHeight;

    // sample the full-resolution photo, not a shrunk copy — the bridge's
    // cables are only a couple of pixels wide, and a smooth downscale
    // blurs them straight into the sky before any color test can see them
    const off = document.createElement("canvas");
    off.width = img.naturalWidth;
    off.height = img.naturalHeight;
    const octx = off.getContext("2d");
    octx.drawImage(img, 0, 0);
    const data = octx.getImageData(0, 0, off.width, off.height).data;

    const rows = Math.round(COLS / imgAspect);
    const blockW = off.width / COLS;
    const blockH = off.height / rows;
    const INNER = 8; // interior samples per axis within each block

    // pass 1: scan every block for its best bridge-steel candidate pixel,
    // and keep the block's average color as a fallback
    const grid = [];
    for (let cy = 0; cy < rows; cy++) {
      const y0 = Math.floor(cy * blockH);
      const y1 = Math.max(y0 + 1, Math.floor((cy + 1) * blockH));
      const stepY = Math.max(1, Math.floor((y1 - y0) / INNER));
      const v = (cy + 0.5) / rows;
      const rowCells = [];
      for (let cx = 0; cx < COLS; cx++) {
        const x0 = Math.floor(cx * blockW);
        const x1 = Math.max(x0 + 1, Math.floor((cx + 1) * blockW));
        const stepX = Math.max(1, Math.floor((x1 - x0) / INNER));
        const u = (cx + 0.5) / COLS;

        // the bridge's painted steel is dark AND saturated red/orange; the
        // sunset sky is often just as saturated but far brighter, so both
        // tests together are what actually isolates the structure. scan the
        // block for its single best-matching pixel — that catches a cable
        // even if it only crosses a sliver of the block — and fall back to
        // the block's average color when nothing qualifies
        let bestSat = -1;
        let bestR = 0;
        let bestG = 0;
        let bestB = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let n = 0;
        const terrainMasked = isTerrainMasked(u, v);
        for (let y = y0; y < y1; y += stepY) {
          for (let x = x0; x < x1; x += stepX) {
            const idx = (y * off.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            sumR += r;
            sumG += g;
            sumB += b;
            n++;
            if (terrainMasked) continue;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const qualifies = r >= g && r >= b && lum < LUMINANCE_THRESHOLD;
            const score = qualifies ? sat : -1;
            if (score > bestSat) {
              bestSat = score;
              bestR = r;
              bestG = g;
              bestB = b;
            }
          }
        }

        rowCells.push({
          structure: bestSat > SATURATION_THRESHOLD,
          sr: bestR,
          sg: bestG,
          sb: bestB,
          ar: Math.round(sumR / n),
          ag: Math.round(sumG / n),
          ab: Math.round(sumB / n),
        });
      }
      grid.push(rowCells);
    }

    // pass 2: a thin cable can dodge every interior sample in a block even
    // though it visibly passes through it — fill a block back in when two or
    // more of its neighbors already read as structure, so cables & railings
    // read as continuous lines instead of dashed ones
    const filled = grid.map((row) => row.map((c) => c.structure));
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        if (grid[cy][cx].structure) continue;
        let neighbors = 0;
        if (cx > 0 && grid[cy][cx - 1].structure) neighbors++;
        if (cx < COLS - 1 && grid[cy][cx + 1].structure) neighbors++;
        if (cy > 0 && grid[cy - 1][cx].structure) neighbors++;
        if (cy < rows - 1 && grid[cy + 1][cx].structure) neighbors++;
        if (neighbors >= 2) filled[cy][cx] = true;
      }
    }

    const raw = [];
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const cell = grid[cy][cx];
        const structure = filled[cy][cx];
        let tier = "structure";
        let cr = jitter(BRIDGE_RED[0]);
        let cg = jitter(BRIDGE_RED[1]);
        let cb = jitter(BRIDGE_RED[2]);
        if (!structure) {
          cr = cell.ar;
          cg = cell.ag;
          cb = cell.ab;
          tier = cr - cb > WARMTH_THRESHOLD ? "sky" : "water";
        }
        raw.push({ u: (cx + 0.5) / COLS, v: (cy + 0.5) / rows, cr, cg, cb, tier });
      }
    }

    // shuffle so the photo assembles in an organic scatter, not a scanline sweep
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]];
    }

    particles = raw.map((p, i) => ({
      u: p.u,
      v: p.v,
      color: `${p.cr}, ${p.cg}, ${p.cb}`,
      revealAt: i / raw.length,
      size: TIER_STYLE[p.tier].size(),
      alpha: TIER_STYLE[p.tier].alpha(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
      amp: TIER_STYLE[p.tier].amp(),
    }));

    requestAnimationFrame(draw);
  }

  function computeScrollBounds() {
    // anchor the reveal to the ascii portrait itself (not the viewport), so
    // the bridge only starts appearing once that block is actually
    // scrolling out of view — guaranteeing the two never overlap regardless
    // of viewport height or how the ascii canvas ends up sized
    const ascii = document.querySelector(".ascii-portrait");
    const anchor = ascii ? ascii.getBoundingClientRect().bottom + window.scrollY : window.innerHeight * 0.5;

    // clamp to the page's actual scrollable range — on a short page there
    // may not be 380px of scroll room to spare, and the reveal still needs
    // to finish by the time you hit the bottom
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    fadeStart = clamp(anchor - 120, 0, maxScroll * 0.85);
    fadeEnd = clamp(anchor + 260, fadeStart + 40, maxScroll);
  }

  function draw(now) {
    const t = now / 1000;

    computeScrollBounds();
    ctx.clearRect(0, 0, w, h);

    const dispH = Math.min(h * 0.7, (w * 0.7) / imgAspect);
    const dispW = dispH * imgAspect;
    const offsetX = (w - dispW) / 2;
    const offsetY = (h - dispH) / 2;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollProgress = clamp((scrollY - fadeStart) / (fadeEnd - fadeStart), 0, 1);

    particles.forEach((p) => {
      const local = (scrollProgress - p.revealAt) / SCROLL_FADE;
      const reveal = reduceMotion ? (local >= 0 ? 1 : 0) : clamp(local, 0, 1);
      if (reveal <= 0) return;
      const ease = 1 - Math.pow(1 - reveal, 3);

      const bx = offsetX + p.u * dispW;
      const by = offsetY + p.v * dispH;
      let dx = 0;
      let dy = 0;
      let twinkle = 1;
      if (!reduceMotion) {
        dx = Math.sin(t * p.speed + p.phase) * p.amp * ease;
        dy = Math.cos(t * p.speed * 0.85 + p.phase * 1.3) * p.amp * 0.5 * ease;
        twinkle = 0.85 + 0.15 * Math.sin(t * p.speed * 1.6 + p.phase * 2.2);
      }

      ctx.beginPath();
      ctx.arc(bx + dx, by + dy, p.size * (0.4 + 0.6 * ease), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${(p.alpha * ease * twinkle).toFixed(3)})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function scheduleResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  }

  resize();
  window.addEventListener("resize", scheduleResize);

  const img = new Image();
  img.onload = () => buildParticles(img);
  img.src = IMG_SRC;
})();

// shared helper: resample any image-like source (an <img> or a canvas) into
// monospace ascii, each character colored to match its sampled pixel, drawn
// into a target <canvas> and printed in top-to-bottom like a terminal

function renderAsciiArt(source, canvasEl, opts) {
  const { cols, charAspect = 0.55, ramp = "@%#*+=-:. ", rowStagger = 22, fontSizePx, reduceMotion = false } = opts;
  const FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
  const ctx = canvasEl.getContext("2d");

  const srcW = source.naturalWidth || source.width;
  const srcH = source.naturalHeight || source.height;
  const rows = Math.max(1, Math.round(cols * (srcH / srcW) * charAspect));

  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d");
  octx.drawImage(source, 0, 0, cols, rows);
  const data = octx.getImageData(0, 0, cols, rows).data;

  const cells = [];
  for (let y = 0; y < rows; y++) {
    const rowCells = [];
    for (let x = 0; x < cols; x++) {
      const idx = (y * cols + x) * 4;
      const a = data[idx + 3];
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = a < 10 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
      const ci = Math.min(ramp.length - 1, Math.floor((lum / 255) * ramp.length));
      rowCells.push({ ch: ramp[ci], color: `rgb(${r}, ${g}, ${b})` });
    }
    cells.push(rowCells);
  }

  const size = fontSizePx();
  const cellW = size * 0.6;
  const cellH = size;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const cssW = cols * cellW;
  const cssH = rows * cellH;
  canvasEl.style.width = `${cssW}px`;
  canvasEl.style.height = `${cssH}px`;
  canvasEl.width = Math.round(cssW * dpr);
  canvasEl.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `${size}px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  function drawRow(y) {
    const rowCells = cells[y];
    for (let x = 0; x < rowCells.length; x++) {
      const cell = rowCells[x];
      if (cell.ch === " ") continue;
      ctx.fillStyle = cell.color;
      ctx.fillText(cell.ch, x * cellW + cellW / 2, y * cellH + cellH / 2);
    }
  }

  if (reduceMotion) {
    for (let y = 0; y < rows; y++) drawRow(y);
    return;
  }

  let revealed = 0;
  const printRow = () => {
    drawRow(revealed);
    revealed++;
    if (revealed < rows) setTimeout(printRow, rowStagger);
  };
  printRow();
}

// ascii portrait — a personal photo resampled into monospace characters in
// the photo's own colors, printed in top-to-bottom like a terminal drawing
// it out

(function () {
  const mount = document.querySelector(".ascii-portrait");
  if (!mount) return;
  const canvas = mount.querySelector("canvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const img = new Image();
  img.onload = () => {
    renderAsciiArt(img, canvas, {
      cols: 84,
      fontSizePx: () => clamp(window.innerWidth * 0.008, 4.5, 6.5),
      reduceMotion,
    });
  };
  img.src = "assets/images/ryan.png";
})();
