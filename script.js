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
