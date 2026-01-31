# Blackjack

Multiplayer blackjack for OpenArcade. Real-time, authoritative server; clean dark UI.

## Structure

- `manifest.json` — Game metadata
- `client/` — Built client (served by hub at `/game/blackjack/`). Generated from `client-src/` by `npm run build` in `client-src/` or `npm run build:games` from repo root.
- `client-src/` — Vite + TypeScript source; build outputs to `../client`.
- `server/` — Game logic (loaded by hub at `/ws/blackjack`)
- `shared/` — Protocol types (message contract)

## How to run and test locally

1. If you changed `client-src/`, build the client: from repo root run `npm run build:games`, or from `games/blackjack/client-src/` run `npm run build`.
2. From the repo root, start the hub (e.g. run `start.bat` or `cd hub && npm start`).
3. Open the Play URL (e.g. `http://localhost:3000/play`).
4. Ensure Blackjack is the active game (Admin → set active game if needed).
5. Open the game in two browser tabs (or two devices on the same LAN).
6. In each tab: enter a display name → **Join table**.
7. In the first tab (host): click **Start round**. Play: **Hit** / **Stand** when it’s your turn.
8. After the round, host can **Start round** again or **Reset table**.

## Reconnecting

Your display name and player id are stored in `localStorage`. If you disconnect, reconnect (refresh or reopen) and **Join table** again with the same name; you rejoin the same seat when the server matches your stored player id.

## Protocol (summary)

- **Client → server:** `join` (name, optional playerId), `action` (hit/stand), `startRound`, `reset`
- **Server → client:** `state` (full game state), `toast`, `error`, `you` (your playerId after join)
