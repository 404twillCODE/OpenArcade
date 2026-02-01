const express = require("express");
const fs = require("fs");
const http = require("http");
const path = require("path");
const os = require("os");
const { WebSocketServer } = require("ws");

const { loadGames, gamesRoot } = require("./gameLoader");
const { ensureStateFile, getActiveGameId, setActiveGameId } = require("./storage");

const PORT = process.env.PORT || 3000;

/** Map gameId -> { wss } for per-game WebSocket servers. */
const gameServers = new Map();
/** Set of gameIds that have no server (log once per id to avoid spam). */
const noServerLogged = new Set();

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

/** Default active game: first by id (stable order). No hardcoded game ids. */
function getDefaultActiveGameId(games) {
  if (games.length === 0) return null;
  const sorted = [...games].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[0].id;
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

  // If persisted active game is no longer in the list (e.g. game removed), reset to default.
  let activeGameId = await getActiveGameId();
  const gameIds = new Set(games.map((g) => g.id));
  if (activeGameId && !gameIds.has(activeGameId)) {
    await setActiveGameId(defaultActiveGameId);
    console.warn("[hub] Active game", activeGameId, "not in games list; reset to", defaultActiveGameId);
  }

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

  // --- SPA fallback: serve index.html for app routes (/, /admin, /play). Admin API remains host-only. ---
  const indexHtml = path.join(publicAppPath, "index.html");
  const spaRoutes = ["/", "/admin", "/admin/", "/play", "/play/"];
  app.get("*", (req, res, next) => {
    if (!spaRoutes.includes(req.path)) return next();
    res.sendFile(indexHtml, (err) => (err ? next(err) : undefined));
  });

  // --- WebSocket: HTTP server for upgrade ---
  const server = http.createServer(app);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error("[hub] Port", PORT, "is already in use. Try a different port (e.g. PORT=3001).");
    } else {
      console.error("[hub] Server error:", err.message);
    }
    process.exit(1);
  });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", "http://localhost").pathname;
    const match = pathname.match(/^\/ws\/([^/]+)\/?$/);
    if (!match) {
      socket.destroy();
      return;
    }
    const gameId = match[1];
    let entry = gameServers.get(gameId);
    if (!entry) {
      const gameServerPath = path.join(gamesRoot, gameId, "server", "index.js");
      if (!fs.existsSync(gameServerPath)) {
        if (!noServerLogged.has(gameId)) {
          noServerLogged.add(gameId);
          console.warn("[hub] Game", gameId, "has no server/; WebSocket connections to /ws/" + gameId + " will close. Add server/index.js for multiplayer.");
        }
        socket.destroy();
        return;
      }
      try {
        // eslint-disable-next-line global-require
        const gameModule = require(gameServerPath);
        if (typeof gameModule.register !== "function") {
          console.warn("[hub] Game", gameId, "server/index.js must export register().");
          socket.destroy();
          return;
        }
        const gameWss = new WebSocketServer({ noServer: true });
        const pathPrefix = `/ws/${gameId}`;
        const storage = { getActiveGameId, setActiveGameId };
        const broadcast = (msg) => {
          const payload = typeof msg === "string" ? msg : JSON.stringify(msg);
          gameWss.clients.forEach((c) => {
            if (c.readyState === 1) c.send(payload);
          });
        };
        const log = (message) => console.log(`[${gameId}]`, message);
        gameModule.register({ wss: gameWss, pathPrefix, storage, broadcast, log });
        entry = { wss: gameWss };
        gameServers.set(gameId, entry);
      } catch (err) {
        console.error("[hub] Failed to load game server", gameId + ":", err.message);
        socket.destroy();
        return;
      }
    }
    entry.wss.handleUpgrade(request, socket, head, (ws) => {
      entry.wss.emit("connection", ws, request);
    });
  });

  server.listen(PORT, async () => {
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
    console.log("  [hub] OpenArcade Hub");
    console.log("  —");
    console.log(`  Landing (local):  ${base}/`);
    if (lanIp) console.log(`  Landing (LAN):    http://${lanIp}:${PORT}/`);
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
