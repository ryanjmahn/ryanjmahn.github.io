// particle/network field — vector-space-style point cloud, canvas-based.
// used as a background accent in the hero, works header, and contact corner.

(function () {
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const instances = [];

  function densityFor(el) {
    const density = Number(el.dataset.density || 1);
    const isSmall = window.innerWidth < 720;
    return isSmall ? density * 0.4 : density;
  }

  class ParticleField {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.color = canvas.dataset.color || "#4640de";
      this.linkDist = Number(canvas.dataset.linkDist || 110);
      this.baseCount = Number(canvas.dataset.count || 70);
      this.points = [];
      this.mouse = { x: null, y: null };
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.resize();
      this.seed();

      instances.push(this);

      window.addEventListener("resize", () => this.resize());

      if (!REDUCE_MOTION && window.innerWidth >= 720) {
        canvas.addEventListener("mousemove", (e) => {
          const rect = canvas.getBoundingClientRect();
          this.mouse.x = e.clientX - rect.left;
          this.mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener("mouseleave", () => {
          this.mouse.x = null;
          this.mouse.y = null;
        });
      }

      const staticOnly = REDUCE_MOTION || window.innerWidth < 480;

      if (staticOnly) {
        this.draw();
      } else {
        this.tick = this.tick.bind(this);
        requestAnimationFrame(this.tick);
      }
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.w = rect.width;
      this.h = rect.height;
      this.canvas.width = this.w * this.dpr;
      this.canvas.height = this.h * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    seed() {
      const count = Math.round(this.baseCount * densityFor(this.canvas));

      // organic point-cloud shape: most points cluster (denser core, soft
      // falloff) toward one corner, the rest scatter sparsely across the
      // rest of the canvas — not a uniform grid/scatter.
      const clusterX = this.w * 0.78;
      const clusterY = this.h * 0.16;
      const clusterR = Math.max(this.w, this.h) * 0.34;

      this.points = Array.from({ length: count }, () => {
        let x, y;
        if (Math.random() < 0.62) {
          const angle = Math.random() * Math.PI * 2;
          const radius = clusterR * Math.sqrt(Math.random());
          x = clusterX + Math.cos(angle) * radius;
          y = clusterY + Math.sin(angle) * radius;
        } else {
          x = Math.random() * this.w;
          y = Math.random() * this.h;
        }
        return {
          x: Math.min(Math.max(x, 0), this.w),
          y: Math.min(Math.max(y, 0), this.h),
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          r: Math.random() * 2.2 + 1.3,
          o: Math.random() * 0.3 + 0.4,
        };
      });
    }

    step() {
      for (const p of this.points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > this.w) p.vx *= -1;
        if (p.y < 0 || p.y > this.h) p.vy *= -1;
      }
    }

    draw() {
      const { ctx, w, h, points } = this;
      const color = this.canvas.dataset.color || this.color;
      const HOVER_RADIUS = 170;
      const HOVER_PUSH = 24;
      ctx.clearRect(0, 0, w, h);

      // particles near the cursor are displaced radially outward (and grow
      // slightly), tapering to zero at HOVER_RADIUS — a live repel effect
      // rather than a static field, à la exa's homepage.
      const rendered = points.map((p) => {
        let x = p.x, y = p.y, r = p.r;
        if (this.mouse.x != null) {
          const dx = p.x - this.mouse.x, dy = p.y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < HOVER_RADIUS && dist > 0.01) {
            const t = 1 - dist / HOVER_RADIUS;
            x += (dx / dist) * t * HOVER_PUSH;
            y += (dy / dist) * t * HOVER_PUSH;
            r += t * 1.6;
          }
        }
        return { x, y, r, o: p.o };
      });

      for (let i = 0; i < rendered.length; i++) {
        for (let j = i + 1; j < rendered.length; j++) {
          const a = rendered[i], b = rendered[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < this.linkDist) {
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - dist / this.linkDist) * 0.5;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of rendered) {
        ctx.globalAlpha = p.o;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    tick() {
      this.step();
      this.draw();
      requestAnimationFrame(this.tick);
    }
  }

  function init() {
    document.querySelectorAll("canvas.particle-field").forEach((canvas) => new ParticleField(canvas));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.__particles = {
    refresh() {
      instances.forEach((f) => f.draw());
    },
  };
})();
