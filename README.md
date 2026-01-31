# OpenArcade

OpenArcade is a GitHub-first open source arcade. It includes a local "hub"
that hosts an admin UI and serves playable games, plus a simple website that
can be published via GitHub Pages.

## Quick Start

### Windows

1. Download the repo (ZIP or clone) and extract.
2. **Double-click `start.bat`** in the repo root.
3. Follow the prompts (press Enter for defaults). The launcher will check Node.js, install dependencies, build the UI, and start the hub.
4. Open the URLs it prints: **Landing**, **Admin**, **Play**.

To stop the hub, press **Ctrl+C** in the launcher window.

### macOS

1. Download the repo and extract.
2. **Double-click `start.command`** (or in Terminal run `./start.sh` from the repo root).
3. First time: you may need to right‑click `start.command` → Open, or run `chmod +x start.sh start-dev.sh start.command` in Terminal.
4. Follow the prompts; open the URLs printed.

To stop the hub, press **Ctrl+C**.

### Linux

1. Download the repo and extract.
2. In a terminal, from the repo root run: `./start.sh`
3. If needed: `chmod +x start.sh start-dev.sh start.command`
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

## Developer notes

- **Hub UI (React) dev:**  
  `cd hub && npm run dev:ui` — runs the Vite dev server for the hub app (hot reload). You still need the hub server running to serve the API; run the server separately (e.g. after a one-time build: `npm run build:ui && node src/index.js`).

- **Hub server:**  
  From `hub/`: `node src/index.js` (after building the UI once with `npm run build:ui`). Uses `PORT` and optional `PLAY_URL` env vars.

- **Build commands:**  
  - Hub UI: `cd hub && npm run build:ui`  
  - Website: `cd website && npm run build` (if applicable)

## Monorepo

- `website/` — Static site for GitHub Pages
- `hub/` — Node.js hub (Express + React UI in `hub/app`)
- `games/` — Plugin-style game folders
- `start.bat` — Windows launcher (double-click)
- `start.sh` / `start-dev.sh` / `start.command` — macOS/Linux launchers

## Adding a new game

1. Create a folder in `games/` using the game id as the folder name.
2. Add `manifest.json` and a `client/` folder with `index.html`, `style.css`, and `main.js`.
3. Keep the game client lightweight and free to run.

Manifest example:

```json
{
  "id": "blackjack",
  "name": "Blackjack",
  "version": "0.1.0",
  "description": "A simple card game. (WIP)",
  "author": "OpenArcade Contributors",
  "wip": true
}
```

## GitHub Pages deploy

The static site in `website/` is deployed automatically to GitHub Pages when you push to `main`. The workflow (`.github/workflows/pages.yml`) uses the official Pages actions.

**Enabling Pages:** In your repo go to **Settings → Pages**. Under "Build and deployment", set **Source** to "GitHub Actions" and use the `github-pages` environment.

## CI checks

On every push to `main` and on pull requests, the CI workflow (`.github/workflows/ci.yml`) runs on `ubuntu-latest` with Node.js LTS (20.x). It:

- Installs hub dependencies (`npm ci` in `hub/`)
- Installs hub app dependencies (`npm ci` in `hub/app`)
- Validates game manifests (`npm run validate:manifests`)
- Builds the hub UI (`npm run build:ui`)
- Runs the health check (`npm run healthcheck`): starts the server on a test port and verifies `/api/state` and `/api/games` respond correctly.

## Project links

- Website docs: `website/README.md`
- Sample game: `games/blackjack/README.md`
