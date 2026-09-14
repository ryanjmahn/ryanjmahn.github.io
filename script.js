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
