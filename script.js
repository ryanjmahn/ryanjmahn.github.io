// auto-updating local time, seoul timezone.

(function () {
  const el = document.getElementById("local-time");
  if (!el) return;

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function tick() {
    const now = new Date();
    el.textContent = formatter.format(now);
    el.setAttribute("datetime", now.toISOString());
  }

  tick();
  setInterval(tick, 15000);
})();

// light/dark mode toggle

(function () {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  function render(theme) {
    btn.textContent = theme === "dark" ? "light" : "dark";
    btn.setAttribute("aria-pressed", String(theme === "dark"));
  }

  render(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    render(next);
  });
})();
