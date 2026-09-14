// particle/network field — vector-space-style point cloud, canvas-based.
// used as a background accent in the hero, works header, and contact corner.

(function () {
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

      if (REDUCE_MOTION) {
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
      this.points = Array.from({ length: count }, () => ({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.6 + 0.6,
        o: Math.random() * 0.5 + 0.3,
      }));
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
      const { ctx, w, h, points, color } = this;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i], b = points[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < this.linkDist) {
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - dist / this.linkDist) * 0.18;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of points) {
        let r = p.r;
        if (this.mouse.x != null) {
          const dx = p.x - this.mouse.x, dy = p.y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) r += (1 - dist / 140) * 1.8;
        }
        ctx.globalAlpha = p.o;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
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
})();
