const path = require("path");
const { parseMessage, serializeMessage } = require("../shared/protocol");

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffle(deck) {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function handValue(cards) {
  if (!cards || cards.length === 0) return 0;
  let score = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.value === "ace") {
      aces++;
      score += 11;
    } else if (["king", "queen", "jack"].includes(c.value)) {
      score += 10;
    } else {
      score += parseInt(c.value, 10);
    }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards) === 21;
}

function shortId() {
  return Math.random().toString(36).slice(2, 10);
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) {
    ws.send(serializeMessage(msg));
  }
}

/**
 * Register the blackjack game with the hub.
 * @param {{ wss: import('ws').WebSocketServer, pathPrefix: string, storage: object, broadcast: (msg: object) => void, log: (msg: string) => void }} opts
 */
function register({ wss, pathPrefix, storage, broadcast, log }) {
  const gameState = {
    phase: "lobby",
    players: [],
    dealerHand: [],
    dealerScore: 0,
    currentTurn: null,
    results: null,
    deck: [],
  };

  /** @type {Map<import('ws').WebSocket, string>} ws -> playerId */
  const connections = new Map();
  /** @type {Map<string, import('ws').WebSocket>} playerId -> ws */
  const playerIdToWs = new Map();

  function getStatePayload() {
    const players = gameState.players.map((p) => ({
      id: p.id,
      name: p.name,
      hand: p.hand,
      score: p.score,
      status: p.status,
      connected: p.connected,
      isHost: p.isHost,
    }));
    const dealerHand =
      gameState.phase === "lobby" || gameState.phase === "playing"
        ? gameState.dealerHand.length > 0
          ? [gameState.dealerHand[0], { suit: "back", value: "hidden" }]
          : []
        : gameState.dealerHand;
    return {
      phase: gameState.phase,
      players,
      dealerHand,
      dealerScore: gameState.phase === "dealer" || gameState.phase === "results" ? gameState.dealerScore : (gameState.dealerHand[0] ? handValue([gameState.dealerHand[0]]) : 0),
      currentTurn: gameState.currentTurn,
      results: gameState.results,
    };
  }

  function broadcastState() {
    broadcast({ type: "state", state: getStatePayload() });
  }

  function startRound() {
    if (gameState.phase !== "lobby") return false;
    const active = gameState.players.filter((p) => p.connected);
    if (active.length === 0) return false;
    gameState.deck = shuffle(createDeck());
    gameState.dealerHand = [];
    gameState.dealerScore = 0;
    gameState.results = null;
    gameState.phase = "playing";
    for (const p of gameState.players) {
      p.hand = [];
      p.score = 0;
      p.status = null;
    }
    const toDeal = gameState.players.filter((p) => p.connected);
    for (let i = 0; i < 2; i++) {
      for (const p of toDeal) {
        const card = gameState.deck.pop();
        p.hand.push(card);
        p.score = handValue(p.hand);
        if (p.hand.length === 2 && isBlackjack(p.hand)) p.status = "blackjack";
      }
      const card = gameState.deck.pop();
      gameState.dealerHand.push(card);
      gameState.dealerScore = handValue(gameState.dealerHand);
    }
    const firstToAct = toDeal.find((p) => !p.status || p.status !== "blackjack");
    gameState.currentTurn = firstToAct ? firstToAct.id : null;
    if (!gameState.currentTurn) {
      gameState.phase = "dealer";
      gameState.currentTurn = "dealer";
      runDealerTurn();
    }
    broadcastState();
    return true;
  }

  function runDealerTurn() {
    gameState.phase = "dealer";
    gameState.currentTurn = "dealer";
    while (gameState.dealerScore < 17) {
      const card = gameState.deck.pop();
      gameState.dealerHand.push(card);
      gameState.dealerScore = handValue(gameState.dealerHand);
    }
    settle();
  }

  function settle() {
    gameState.phase = "results";
    gameState.currentTurn = null;
    const dealerBJ = isBlackjack(gameState.dealerHand);
    const dealerBust = gameState.dealerScore > 21;
    const results = {};
    for (const p of gameState.players) {
      if (p.status === "blackjack") {
        results[p.id] = dealerBJ ? "push" : "blackjack";
      } else if (p.status === "busted") {
        results[p.id] = "bust";
      } else if (dealerBJ) {
        results[p.id] = "lose";
      } else if (dealerBust) {
        results[p.id] = "win";
      } else if (p.score > gameState.dealerScore) {
        results[p.id] = "win";
      } else if (p.score < gameState.dealerScore) {
        results[p.id] = "lose";
      } else {
        results[p.id] = "push";
      }
    }
    gameState.results = results;
    broadcastState();
  }

  function nextTurn() {
    const order = gameState.players.filter((p) => p.connected);
    const idx = order.findIndex((p) => p.id === gameState.currentTurn);
    let next = null;
    for (let i = 1; i <= order.length; i++) {
      const p = order[(idx + i) % order.length];
      if (p.status !== "stood" && p.status !== "busted" && p.status !== "blackjack") {
        next = p;
        break;
      }
    }
    if (next) {
      gameState.currentTurn = next.id;
      broadcastState();
    } else {
      runDealerTurn();
    }
  }

  wss.on("connection", (ws, request) => {
    log("connection");

    ws.on("message", (data) => {
      const msg = parseMessage(data.toString());
      if (!msg || !msg.type) return;

      if (msg.type === "join") {
        const name = (msg.name || "").trim().slice(0, 32) || "Player";
        const existingId = msg.playerId || null;
        let player = existingId ? gameState.players.find((p) => p.id === existingId) : null;
        if (player) {
          if (player.connected) {
            send(ws, { type: "error", message: "Already in game." });
            return;
          }
          player.connected = true;
          player.name = name;
          playerIdToWs.set(player.id, ws);
          connections.set(ws, player.id);
          log(`rejoin: ${name} (${player.id})`);
        } else {
          const id = shortId();
          const isHost = gameState.players.length === 0;
          player = {
            id,
            name,
            hand: [],
            score: 0,
            status: null,
            connected: true,
            isHost,
          };
          gameState.players.push(player);
          playerIdToWs.set(id, ws);
          connections.set(ws, id);
          log(`join: ${name} (${id})`);
        }
        send(ws, { type: "you", playerId: player.id });
        send(ws, { type: "state", state: getStatePayload() });
        send(ws, { type: "toast", message: "Joined the table." });
        broadcastState();
        return;
      }

      const playerId = connections.get(ws);
      if (!playerId) {
        send(ws, { type: "error", message: "Send join first." });
        return;
      }

      const player = gameState.players.find((p) => p.id === playerId);
      if (!player) return;

      if (msg.type === "startRound") {
        if (gameState.phase !== "lobby") {
          send(ws, { type: "error", message: "Round already started." });
          return;
        }
        if (!player.isHost) {
          send(ws, { type: "error", message: "Only host can start." });
          return;
        }
        if (startRound()) {
          broadcast({ type: "toast", message: "Round started." });
        } else {
          send(ws, { type: "error", message: "Could not start round." });
        }
        return;
      }

      if (msg.type === "reset") {
        if (!player.isHost) {
          send(ws, { type: "error", message: "Only host can reset." });
          return;
        }
        gameState.phase = "lobby";
        gameState.players.forEach((p) => {
          p.hand = [];
          p.score = 0;
          p.status = null;
        });
        gameState.dealerHand = [];
        gameState.dealerScore = 0;
        gameState.currentTurn = null;
        gameState.results = null;
        gameState.deck = [];
        broadcast({ type: "toast", message: "Table reset." });
        broadcastState();
        return;
      }

      if (msg.type === "action") {
        if (gameState.phase !== "playing") {
          send(ws, { type: "error", message: "Not in play phase." });
          return;
        }
        if (gameState.currentTurn !== playerId) {
          send(ws, { type: "error", message: "Not your turn." });
          return;
        }
        const action = msg.action === "hit" ? "hit" : "stand";
        if (action === "hit") {
          const card = gameState.deck.pop();
          player.hand.push(card);
          player.score = handValue(player.hand);
          if (player.score > 21) player.status = "busted";
          broadcastState();
          if (player.status === "busted") {
            nextTurn();
          }
        } else {
          player.status = "stood";
          broadcastState();
          nextTurn();
        }
      }
    });

    ws.on("close", () => {
      const playerId = connections.get(ws);
      connections.delete(ws);
      if (playerId) {
        playerIdToWs.delete(playerId);
        const player = gameState.players.find((p) => p.id === playerId);
        if (player) {
          player.connected = false;
          log(`disconnect: ${player.name}`);
          broadcastState();
        }
      }
    });
  });

  log(`registered at ${pathPrefix}`);
}

module.exports = { register };
