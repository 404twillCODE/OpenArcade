const express = require("express");
const path = require("path");

const { loadGames, gamesRoot } = require("./gameLoader");
const { ensureStateFile, getActiveGameId, setActiveGameId } = require("./storage");

const PORT = process.env.PORT || 3000;

function getDefaultActiveGameId(games) {
  const blackjack = games.find((game) => game.id === "blackjack");
  if (blackjack) {
    return blackjack.id;
  }
  return games.length > 0 ? games[0].id : null;
}

async function start() {
  const games = await loadGames();
  const defaultActiveGameId = getDefaultActiveGameId(games);

  await ensureStateFile({ activeGameId: defaultActiveGameId });

  const app = express();
  app.use(express.json());

  const adminPath = path.join(__dirname, "..", "public", "admin");
  const landingPath = path.join(__dirname, "..", "public", "landing");

  app.use("/admin", express.static(adminPath));
  app.use("/", express.static(landingPath));

  app.get("/api/games", async (_req, res) => {
    res.json(games);
  });

  app.get("/api/active-game", async (_req, res) => {
    const activeGameId = await getActiveGameId();
    res.json({ activeGameId });
  });

  app.post("/api/active-game", async (req, res) => {
    const { gameId } = req.body || {};
    const exists = games.some((game) => game.id === gameId);
    if (!exists) {
      return res.status(400).json({ error: "Unknown game id." });
    }

    const activeGameId = await setActiveGameId(gameId);
    return res.json({ activeGameId });
  });

  app.get("/play", (_req, res) => {
    res.redirect("/play/");
  });

  app.use("/play", async (req, res, next) => {
    const activeGameId = await getActiveGameId();
    const game = games.find((g) => g.id === activeGameId);
    if (!game) {
      return res.status(404).send("No active game.");
    }

    const clientPath = path.join(gamesRoot, game.id, "client");
    return express.static(clientPath)(req, res, next);
  });

  app.listen(PORT, async () => {
    const activeGameId = await getActiveGameId();
    console.log("OpenArcade Hub running");
    console.log(`Admin: http://localhost:${PORT}/admin`);
    console.log(`Players: http://localhost:${PORT}/`);
    console.log(`Active game: ${activeGameId || "none"}`);
  });
}

start().catch((error) => {
  console.error("Failed to start OpenArcade Hub:", error);
  process.exit(1);
});
