/**
 * Game client — served at /game/<id>/ by the hub.
 * Use relative paths (e.g. "./", "main.js"). You may call GET /api/games and GET /api/state.
 * For multiplayer, add server/index.js and connect to ws://.../ws/<id>. See CONTRIBUTING.md.
 */
(function () {
  "use strict";

  const btn = document.getElementById("action-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      console.log("Game action");
      btn.textContent = "Clicked";
    });
  }
})();
