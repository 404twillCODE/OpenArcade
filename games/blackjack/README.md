# Blackjack

Multiplayer blackjack for OpenArcade. Join with a display name, play full rounds with hit/stand, dealer follows house rules.

## How to run via hub

1. From repo root: `npm run start` (or use `scripts/start.ps1` on Windows).
2. Open `http://localhost:3000/play` and select Blackjack, or go directly to `http://localhost:3000/game/blackjack/`.
3. Enter a display name, then **Create table** to get a room code. Share that code or open a second tab and **Join table** with the code.

## How to dev the game client

1. From repo root, build once: `npm run build:games` (builds all games with `client-src`).
2. To work on the blackjack client with live reload, from `games/blackjack/client-src` run: `npm run dev`. Point your browser to the Vite dev server (e.g. `http://localhost:5173`). For multiplayer you still need the hub running so the dev client can connect to `ws://localhost:3000/ws/blackjack`. You can proxy in `vite.config.ts` or run the hub and use the play page with the built client at `http://localhost:3000/game/blackjack/`.

## How multiplayer works

- **WebSocket endpoint:** `ws://<host>/ws/blackjack` (same origin as the hub, e.g. `ws://localhost:3000/ws/blackjack`).
- The hub loads `games/blackjack/server/index.js` and calls its `register({ wss, pathPrefix, storage, broadcast, log })`. The game server is **server-authoritative**: clients send intents (`createRoom`, `joinRoom`, `startRound`, `action: hit|stand`, `reset`); the server holds the deck, deals cards, runs dealer logic, and broadcasts `state` to all clients in that room.

## Rules (V1)

- **Dealer stands on soft 17** (dealer does not hit when total is 17 with an ace counting as 11). Documented here; implementation in `shared/rules.js` (`dealerShouldHit(value)` returns `value < 17`).
- Shoe: 4 decks, shuffled at start of each round.
- Each player and dealer get 2 cards; dealer’s second card is hidden until dealer turn.
- Turn-based: each player can **Hit** or **Stand**. After all players act, dealer reveals hole card and hits until total ≥ 17.
- Outcomes: **win**, **lose**, **push**, **blackjack**, **bust**. Win/loss/push shown in a result banner after the round.

## Host-only controls

- **Start round:** only the host (first joiner) can start a round when phase is `lobby`.
- **Reset table:** only the host can reset the table back to lobby (clears hands and results, does not remove players).

## File layout

- `client/` — Built static client (output of `npm run build` in `client-src`). Served by hub at `/game/blackjack/`.
- `client-src/` — React + TypeScript (Vite) source; build target is `../client`.
- `shared/` — `protocol.js`, `rules.js` (used by server); `types.ts` (used by client for types).
- `server/index.js` — Node module with `register()` for the hub’s WebSocket runtime.
