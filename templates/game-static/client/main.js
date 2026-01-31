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
