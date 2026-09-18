// status line — live Seoul time, updated once a minute. Progressive
// enhancement: the line already reads correctly without this (see C5).

(function () {
  const el = document.querySelector(".status-time");
  if (!el) return;

  function update() {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    el.textContent = ` ${time} KST`;
  }

  update();
  setInterval(update, 60000);
})();
