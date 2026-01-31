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

  const publicAppPath = path.join(__dirname, "..", "public", "app");

  // --- API routes (unchanged contract) ---
  app.get("/api/games", async (_req, res) => {
    res.json(games);
  });

  app.get("/api/state", async (_req, res) => {
    const activeGameId = await getActiveGameId();
    res.json({ activeGameId });
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

  // --- Game client: /game/:id/* serves that game's client folder (for React /play iframe) ---
  app.use("/game/:id", (req, res, next) => {
    const gameId = req.params.id;
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      return res.status(404).send("Game not found.");
    }
    const clientPath = path.join(gamesRoot, gameId, "client");
    return express.static(clientPath)(req, res, next);
  });

  // --- React SPA: static assets from hub/public/app ---
  app.use(express.static(publicAppPath));

  // --- SPA fallback: serve index.html for app routes so client-side routing works ---
  const spaRoutes = ["/", "/admin", "/admin/", "/play", "/play/"];
  app.get("*", (req, res, next) => {
    if (!spaRoutes.includes(req.path)) return next();
    const indexHtml = path.join(publicAppPath, "index.html");
    res.sendFile(indexHtml, (err) => (err ? next(err) : undefined));
  });

  app.listen(PORT, async () => {
    const activeGameId = await getActiveGameId();
    console.log("OpenArcade Hub running");
    console.log(`Landing: http://localhost:${PORT}/`);
    console.log(`Admin: http://localhost:${PORT}/admin`);
    console.log(`Play: http://localhost:${PORT}/play`);
    console.log(`Active game: ${activeGameId || "none"}`);
  });
}

start().catch((error) => {
  console.error("Failed to start OpenArcade Hub:", error);
  process.exit(1);
});
