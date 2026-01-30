async function fetchGames() {
  const response = await fetch("/api/games");
  return response.json();
}

async function fetchActiveGame() {
  const response = await fetch("/api/active-game");
  return response.json();
}

async function setActiveGame(gameId) {
  const response = await fetch("/api/active-game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to set active game.");
  }
  return response.json();
}

function renderGames(games, activeGameId) {
  const container = document.getElementById("games");
  container.innerHTML = "";

  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = game.name;

    if (game.wip) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = "Work in progress";
      title.appendChild(tag);
    }

    const desc = document.createElement("p");
    desc.textContent = game.description;

    const meta = document.createElement("p");
    meta.textContent = `Version: ${game.version}`;

    const button = document.createElement("button");
    button.textContent = game.id === activeGameId ? "Active" : "Set Active";
    button.disabled = game.id === activeGameId;
    button.addEventListener("click", async () => {
      await setActiveGame(game.id);
      await load();
    });

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(button);
    container.appendChild(card);
  });
}

async function load() {
  const [games, active] = await Promise.all([fetchGames(), fetchActiveGame()]);
  const activeLabel = document.getElementById("active-game");
  activeLabel.textContent = active.activeGameId || "none";
  renderGames(games, active.activeGameId);
}

load().catch((error) => {
  const activeLabel = document.getElementById("active-game");
  activeLabel.textContent = "error";
  console.error(error);
});
