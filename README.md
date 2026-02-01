# OpenArcade

OpenArcade is a GitHub-first open source arcade. It includes a local **hub**
that hosts an admin UI and serves playable games, a **desktop app** (Windows)
that wraps the hub for a one-click experience, and a **website** for
marketing/docs (e.g. GitHub Pages).

## Quick Start

### Desktop app (Windows, easiest)

1. Open the **desktop/** app (build or run from the repo).
2. Download OpenArcade (or choose an existing repo folder), install dependencies, then start the hub.
3. Use the in-app Admin to set the active game and share the Play link.

### Windows (hub only, from repo)

1. Download the repo (ZIP or clone) and extract.
2. **Double-click `start.bat`** in the repo root.
3. Follow the prompts (press Enter for defaults). The launcher will check Node.js, install dependencies, build the UI, and start the hub.
4. Open the URLs it prints: **Landing**, **Admin**, **Play**.

To stop the hub, press **Ctrl+C** in the launcher window.

### macOS

1. Download the repo and extract.
2. **Double-click `start.command`** (or in Terminal run `./start.sh` from the repo root).
3. First time: you may need to right‑click `start.command` → Open, or run `chmod +x start.sh start.command` in Terminal.
4. Follow the prompts; open the URLs printed.

To stop the hub, press **Ctrl+C**.

### Linux

1. Download the repo and extract.
2. In a terminal, from the repo root run: `./start.sh`
3. If needed: `chmod +x start.sh start.command`
4. Follow the prompts; open the URLs printed.

To stop the hub, press **Ctrl+C**.

---

### Manual start (any OS)

```bash
cd hub
npm install
npm start
```

Open the URLs printed in the terminal (Landing, Admin, Play).

## Troubleshooting

- **Port in use (EADDRINUSE)**  
  Another process is using the hub port (default 3000). Either stop that process, or choose a different port when the launcher asks, or set `PORT=3001` (or another free port) before running.

- **Node.js not found**  
  Install Node.js LTS from [nodejs.org](https://nodejs.org), then run the launcher again.

- **Admin is “host-only”**  
  The Admin page is only available when you open it from the same machine that is running the hub (localhost). This is intentional so only the host can change the active game. Players should use the **Play** link you share with them.

For roles, boundaries, and the game contract, see **docs/ARCHITECTURE.md**.

## Developer notes

- **Dev launcher (Windows, contributors):**  
  Double-click **`start-dev.bat`** in the repo root to run both the hub and the website together (no prompts). It frees ports 3000 and 5173, installs and builds hub + website, starts both in the background, opens the browser, and shows a clean summary. Press **R** to relaunch (full run again) or any other key to close. Same friendly style as `start.bat`.

- **Hub UI (React) dev:**  
  `cd hub && npm run dev:ui` — runs the Vite dev server for the hub app (hot reload). You still need the hub server running to serve the API; run the server separately (e.g. after a one-time build: `npm run build:ui && node src/index.js`).

- **Hub server:**  
  From `hub/`: `node src/index.js` (after building the UI once with `npm run build:ui`). Uses `PORT` and optional `PLAY_URL` env vars.

- **Build commands:**  
  - Hub UI: `cd hub && npm run build:ui`  
  - Games (with client-src): from repo root, `npm run build:games`  
  - Website: `cd website && npm run build` (if applicable)

## Monorepo

- `desktop/` — Electron desktop app (Windows); wraps the hub, download/install/start from the UI
- `hub/` — Node.js hub (Express + React UI in `hub/app`)
- `games/` — Plugin-style game folders
- `website/` — Static site for GitHub Pages
- `start.bat` — Windows launcher (double-click) for hub only
- `start-dev.bat` — Windows dev launcher (hub + website, double-click)
- `start.sh` / `start.command` — macOS/Linux launchers

## Making games

Games are served at **`/game/<id>/`** — the hub serves the contents of **`games/<id>/client/`** at that path. You can add games in two ways.

### Two modes

- **A) Static game** — Hand-author **`games/<id>/client/`** with `index.html`, `style.css`, `main.js` (or similar). No build step. The hub serves these files as-is.
- **B) Built game** — Add **`games/<id>/client-src/`** with a build pipeline (e.g. Vite + TypeScript). The build **outputs into `../client`**. The hub always serves from `client/`; run the build so `client/` is populated.

### Commands

- **Build all built games:** From repo root, run `npm run build:games`. This builds every game that has `client-src/` and writes output into each game’s `client/`.
- **Run a single game dev server (if available):** e.g. `npm run dev:game:blackjack` runs the Vite dev server for the blackjack client (hot reload). For full E2E (hub + game), build the game and start the hub, then open `/play` and select the game.

### PR checklist (game authors)

Before opening a pull request for a new or updated game:

- [ ] `manifest.json` has required keys: `id`, `name`, `version`, `description`, `author`, `wip`; `id` matches the folder name.
- [ ] **Static:** `client/` contains `index.html` (and assets). **Built:** `client-src/` exists, build outputs to `../client`, and you ran `npm run build:games` so `client/` is populated.
- [ ] From repo root: `cd hub && npm run validate:manifests` passes; `npm run build:games` passes (if any built games); `cd hub && npm run validate:games` passes.
- [ ] Hub runs and your game loads at `/game/<id>/` and in the Play page.
- [ ] Screenshot or short demo in the PR; mobile tested if applicable.

## GitHub Pages deploy

The static site in `website/` is deployed automatically to GitHub Pages when you push to `main`. The workflow (`.github/workflows/pages.yml`) uses the official Pages actions.

**Enabling Pages:** In your repo go to **Settings → Pages**. Under "Build and deployment", set **Source** to "GitHub Actions" and use the `github-pages` environment.

## CI checks

On every push to `main` and on pull requests, the CI workflow (`.github/workflows/ci.yml`) runs on `ubuntu-latest` with Node.js LTS (20.x). It:

- Installs hub dependencies (`npm ci` in `hub/`)
- Installs hub app dependencies (`npm ci` in `hub/app`)
- Builds the hub UI (`npm run build:ui`)
- Validates game manifests (`npm run validate:manifests`)
- Builds games with `client-src/` (`npm run build:games`)
- Validates game packages (`npm run validate:games` — client layout and entry)
- Runs the health check (`npm run healthcheck`): starts the server on a test port and verifies `/api/state` and `/api/games` respond correctly.

See `CONTRIBUTING.md` for the full **Create a New Game** guide and templates (`templates/game-static/`, `templates/game-vite-ts/`). Blackjack is a full example with `client-src/` (Vite + TS) and `server/` (WebSocket).

## Roadmap (Phase 2 — planned, not implemented)

Future options for extending the SDK beyond JS/TS clients and Node server modules:

- **Option A — WebAssembly client logic:** Game client logic written in Rust/Go (or other languages) compiled to WASM and shipped inside `client/`. The hub would still serve static (or built) HTML/JS that loads and runs the WASM module. No hub changes required beyond current static serving.
- **Option B — External server modules:** Game server logic in Python/Go/etc. launched by the hub via `child_process` with a defined JSON message protocol over stdin/stdout (or a small RPC layer). The hub would route WebSocket traffic to/from the external process. Allows authors to use their preferred language for authoritative game logic without rewriting the hub.

Phase 2 is **documentation only**; implementation is not yet scheduled.

## Project links

- Website docs: `website/README.md`
- Sample game: `games/blackjack/README.md`
