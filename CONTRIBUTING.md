# Contributing to OpenArcade

Thanks for your interest in OpenArcade. We welcome issues, feature requests,
and new game submissions.

## Quick steps

1. Fork the repo and create a feature branch.
2. Make your changes and keep them focused.
3. Open a pull request with a clear description.

## Create a new game

### 1. Pick an id

Use **kebab-case** (e.g. `my-card-game`). The folder name must match: `games/<id>/`.

### 2. Create the folder and manifest

- Create **`games/<id>/`**.
- Add **`manifest.json`** with required keys: `id`, `name`, `version`, `description`, `author`, `wip` (boolean). The `id` must match the folder name.

Example:

```json
{
  "id": "my-game",
  "name": "My Game",
  "version": "0.1.0",
  "description": "Short description.",
  "author": "Your Name",
  "wip": true
}
```

### 3. Choose static or built

- **Static** — Hand-author **`client/`** with `index.html`, `style.css`, `main.js` (or similar). No build step. Copy from **`templates/game-static/`** and edit.
- **Built** — Use **`templates/game-vite-ts/`** as a starting point. Create **`client-src/`** in your game folder; the build must output to **`../client`** and use **`base: "./"`** in Vite so assets work under `/game/<id>/`.

If you use the built (Vite + TypeScript) template:

- Ensure **`vite.config.ts`** has `outDir: "../client"` and `base: "./"`.
- Run **`npm run build`** inside `games/<id>/client-src/` (or from repo root **`npm run build:games`**) so `client/` is populated.

### 4. Add README.md

Describe the game and how to run/test it locally.

### Optional: server and shared

- **`server/`** — WebSocket game logic loaded by the hub at `/ws/<id>`. See “Adding a multiplayer game (with server)” below.
- **`shared/`** — Shared types or protocol used by client and server.

## Testing before PR

Run these from the repo root (or as indicated):

1. **Manifests:** `cd hub && npm run validate:manifests` — must pass.
2. **Build games:** `npm run build:games` — must pass (builds all games with `client-src/`).
3. **Package rules:** `cd hub && npm run validate:games` — must pass (checks client-src and client/ layout).
4. **Hub:** Start the hub (e.g. `start.bat` or `cd hub && npm start`), open **Admin** and **Play**, and confirm your game loads at `/game/<id>/`.

## Game guidelines

- **Accessibility:** Use semantic HTML, labels, and keyboard-friendly controls where applicable.
- **Mobile-first:** Layout and touch targets should work on small screens.
- **No external CDNs:** Keep assets self-contained (no required external scripts or styles).
- **No external services:** Games should run with the hub only (no third-party APIs required for core play).
- **Optimized assets:** Compress images and keep bundles reasonable so the game loads quickly.

## Adding a multiplayer game (with server)

To add a game that uses the hub’s WebSocket runtime:

1. Add a `server/` folder with `index.js` that exports a `register` function:
   ```js
   function register({ wss, pathPrefix, storage, broadcast, log }) {
     wss.on('connection', (ws, request) => { /* handle messages */ });
   }
   module.exports = { register };
   ```
2. The hub loads it on first connection to `/ws/<gameId>` and passes:
   - `wss` — per-game WebSocket server
   - `pathPrefix` — e.g. `/ws/blackjack`
   - `storage` — hub state helpers
   - `broadcast(msg)` — send to all clients of this game
   - `log(msg)` — log with game id prefix
3. Use a `shared/` (or similar) module for the message protocol so client and server stay in sync.
4. See `games/blackjack/` for a full example.

## Local testing

- **Windows (hub only):** Double-click `start.bat` in the repo root. It installs deps, builds the UI, and starts the hub. Open the URLs it prints.
- **Windows (hub + website for contributing):** Double-click `start-dev.bat` in the repo root. It runs both the hub (port 3000) and the website dev server (port 5173) with no prompts, opens the browser, and shows a clean summary. Press **R** to relaunch (full run again) or any other key to close.
- **Other:** From the repo root, run:
  ```bash
  cd hub
  npm install
  npm start
  ```
  Then open the Admin and Player URLs printed in the terminal.

## Code of Conduct

This project follows `CODE_OF_CONDUCT.md`.
