const express = require("express");
const path = require("path");
const os = require("os");

const { loadGames, gamesRoot } = require("./gameLoader");
const { ensureStateFile, getActiveGameId, setActiveGameId } = require("./storage");

const PORT = process.env.PORT || 3000;

/** Detect a LAN IPv4 address for the startup banner. */
function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return null;
}

function getDefaultActiveGameId(games) {
  const blackjack = games.find((game) => game.id === "blackjack");
  if (blackjack) {
    return blackjack.id;
  }
  return games.length > 0 ? games[0].id : null;
}

/** True if request is from loopback (127.0.0.1, ::1, ::ffff:127.0.0.1). Does not use X-Forwarded-For. */
function isLoopback(req) {
  const addr = req.socket.remoteAddress || req.ip || "";
  return (
    addr === "127.0.0.1" ||
    addr === "::1" ||
    addr === "::ffff:127.0.0.1"
  );
}

/** Middleware: allow only host (loopback). Others get 403. */
function adminOnly(req, res, next) {
  if (isLoopback(req)) return next();
  res.status(403).json({
    error: "Admin is only available on the host machine.",
  });
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

  app.post("/api/active-game", adminOnly, async (req, res) => {
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

  // --- Admin SPA: host-only; serve index.html for /admin and /admin/ ---
  const indexHtml = path.join(publicAppPath, "index.html");
  app.get(["/admin", "/admin/"], adminOnly, (req, res, next) => {
    res.sendFile(indexHtml, (err) => (err ? next(err) : undefined));
  });

  // --- SPA fallback: serve index.html for remaining app routes (/, /play, /play/) ---
  const spaRoutes = ["/", "/play", "/play/"];
  app.get("*", (req, res, next) => {
    if (!spaRoutes.includes(req.path)) return next();
    res.sendFile(indexHtml, (err) => (err ? next(err) : undefined));
  });

  app.listen(PORT, async () => {
    const base = `http://localhost:${PORT}`;
    const lanIp = getLanIp();
    const playUrl = process.env.PLAY_URL || "";
    let activeGameId = "unknown";
    try {
      activeGameId = (await getActiveGameId()) || "unknown";
    } catch {
      // ignore
    }
    console.log("");
    console.log("  OpenArcade Hub");
    console.log("  —");
    console.log(`  Landing (local):  ${base}/`);
    if (lanIp) console.log(`  Landing (LAN):    http://${lanIp}:${PORT}/`);
    console.log(`  Admin (local):    ${base}/admin  (host-only)`);
    console.log(`  Play (local):     ${base}/play`);
    if (playUrl) console.log(`  Play (share):     ${playUrl}`);
    console.log(`  Active game:      ${activeGameId}`);
    console.log("");
  });
}

start().catch((error) => {
  console.error("Failed to start OpenArcade Hub:", error);
  process.exit(1);
});
