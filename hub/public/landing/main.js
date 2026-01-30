async function loadActiveGame() {
  const response = await fetch("/api/active-game");
  const data = await response.json();
  const label = document.getElementById("active-game");
  label.textContent = data.activeGameId || "none";
}

loadActiveGame().catch((error) => {
  const label = document.getElementById("active-game");
  label.textContent = "error";
  console.error(error);
});
