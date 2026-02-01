# OpenArcade architecture

This document defines roles, boundaries, and the game contract so the hub and games stay aligned without coupling.

## What OpenArcade is

- **Local-first arcade hub.** One Node.js hub runs on the host. It serves a React UI (Landing, Admin, Play), serves static or built game clients, and optionally runs per-game WebSocket servers.
- **No central gameplay servers.** Players connect to the host (LAN or tunnel). The website is marketing/docs only. The **desktop app** (`desktop/`) is an Electron app (Windows) that runs the hub and provides its own UI (including Admin); it is the easiest way for Windows users to host without using the terminal.

## Monorepo layout (unchanged)

| Area | Responsibility |
|------|----------------|
| **hub/** | Node + Express server; React UI (Landing, Admin, Play); serves games and APIs; loads game servers on demand. |
| **games/** | One folder per game: `manifest.json`, `client/`, optional `server/`, optional `client-src/`. |
| **website/** | Static marketing/docs (e.g. GitHub Pages). |
| **desktop/** | Electron app (Windows); runs the hub, download/install/start from the UI; shows Admin and Play. Easiest way to host on Windows. |
| **templates/** | game-static, game-vite-ts — starting points for new games. |
| **scripts/** | build-games.mjs, platform launchers. |

## Roles and boundaries

### Hub core

- **Serves:** Hub UI (SPA), game client files at `/game/<id>/`, REST API (`/api/games`, `/api/state`, `/api/active-game`), WebSocket upgrade at `/ws/<id>`.
- **Owns:** Active game state (persisted in hub data dir), which game server is mounted where.
- **Does not:** Expose hub internals to games. Games get a fixed API and, if they have a server, a fixed `register({ wss, pathPrefix, storage, broadcast, log })` contract.
- **Host vs player:** Admin API (`POST /api/active-game`) is host-only (loopback). Play and game client routes are safe for remote users.

### Game client

- **Served at:** `/game/<id>/` (e.g. `/game/poker/`). All asset paths must be relative or root-relative from that base (e.g. `./`, `index.html`, `main.js`).
- **Assumes:** It is loaded in a browser (hub UI iframe or direct). It may call the hub only via:
  - **REST:** Same origin; `GET /api/games`, `GET /api/state` (or `/api/active-game`) to know the active game.
  - **WebSocket (optional):** `ws://.../ws/<id>` if the game has a server; protocol is defined by the game.
- **Must not:** Depend on hub internals, file paths, or undocumented APIs. No direct Node or hub process access.

### Game server (optional)

- **Loaded when:** First WebSocket connection to `/ws/<id>`. Hub requires `games/<id>/server/index.js` with `module.exports = { register }`.
- **Contract:** `register({ wss, pathPrefix, storage, broadcast, log })`
  - `wss` — per-game WebSocket server (Node `EventEmitter`; listen for `connection`).
  - `pathPrefix` — e.g. `/ws/poker`.
  - `storage` — `{ getActiveGameId, setActiveGameId }` (hub state; use sparingly).
  - `broadcast(msg)` — send to all connected clients of this game (string or object, JSON-serialized).
  - `log(msg)` — log with game id prefix (hub stdout).
- **Must not:** Require hub internals or other games’ state. Shared protocol with client lives in the game (e.g. `shared/`).

## Game contract (summary)

1. **Games are self-contained.** One folder under `games/<id>/` with `manifest.json` and `client/`. Optional `server/`, optional `client-src/` (build outputs to `client/`).
2. **Manifest:** Required keys `id`, `name`, `version`, `description`, `author`, `wip`. `id` must match the folder name.
3. **Client:** Must work when served at `/game/<id>/` (relative or `./` base). No reliance on hub internals.
4. **Multiplayer:** Optional `server/index.js` with `register(...)`. Client connects to `/ws/<id>`. Protocol and persistence (if any) are the game’s responsibility; hub provides `broadcast` and `storage` helpers.
5. **Loadable without hub code changes.** Adding a game = adding a folder and, if built, running `npm run build:games`. No edits to hub source.

## Host / player separation

- **Admin:** Changing the active game is allowed only from the host (loopback). The hub rejects `POST /api/active-game` from non-loopback with 403.
- **Play and game clients:** Served to anyone. No sensitive actions; the active game is read-only for players.
- **Active game state:** Stored and updated only by the hub; games read it via API or `storage.getActiveGameId()` in the server context.

## Logging

- **Hub:** Use `[hub]` prefix for server-wide messages (e.g. startup, port, load errors).
- **Game server:** Use the `log()` passed to `register()` so messages are prefixed with `[<gameId>]`.
- **Developer-facing:** Invalid or skipped games (e.g. bad manifest, missing client) are logged at startup so authors can fix them.
