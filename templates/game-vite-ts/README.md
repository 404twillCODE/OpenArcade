# Vite + TypeScript game template

Copy this folder into `games/<your-game-id>/` and edit:

- **manifest.json** — Set `id` (must match folder name), `name`, `description`, `author`, etc.
- **client-src/** — Your source. Build outputs to `../client`.

Important:

- **vite.config.ts** must keep `base: "./"` and `outDir: "../client"` so the game works when served at `/game/<id>/`.
- Run `npm install` and `npm run build` inside `client-src/`, or from repo root run `npm run build:games`.

The hub serves `client/` at `/game/<id>/`. After building, your game appears there.

**Multiplayer / storage:** Add a `server/` folder with `index.js` exporting `register({ wss, pathPrefix, storage, broadcast, log })`. The hub loads it on first connection to `/ws/<id>`. Use `storage.getActiveGameId()` / `setActiveGameId()` sparingly; use `broadcast(msg)` to push to all clients. See CONTRIBUTING.md and docs/ARCHITECTURE.md.
