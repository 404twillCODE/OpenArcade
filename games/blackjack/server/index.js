const { parseMessage, serializeMessage } = require("../shared/protocol");
const {
  createShoe,
  shuffle,
  handValue,
  isBlackjack,
  dealerShouldHit,
} = require("../shared/rules");

const SHOE_DECKS = 4;
const ROOM_CODE_LENGTH = 4;

function shortId() {
  return Math.random().toString(36).slice(2, 10);
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) {
    ws.send(serializeMessage(msg));
  }
}

function register({ wss, pathPrefix, storage, broadcast, log }) {
  const rooms = new Map();
  const connections = new Map(); // ws -> { roomCode, playerId }

  function createRoomState(roomCode) {
    return {
      roomCode,
      phase: "lobby",
      players: [],
      dealerHand: [],
      dealerScore: 0,
      currentTurn: null,
      results: null,
      deck: [],
    };
  }

  function createRoom() {
    let code = "";
    do {
      code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
        Math.random().toString(36).slice(2, 3).toUpperCase()
      ).join("");
    } while (rooms.has(code));

    const state = createRoomState(code);
    rooms.set(code, state);
    return state;
  }

  function getStatePayload(gameState) {
    const players = gameState.players.map((p) => ({
      id: p.id,
      name: p.name,
      hand: p.hand,
      score: p.score,
      status: p.status,
      connected: p.connected,
      isHost: p.isHost,
    }));
    const hideHole =
      (gameState.phase === "lobby" || gameState.phase === "playing") &&
      gameState.dealerHand.length >= 2;
    const dealerHand =
      hideHole && gameState.dealerHand.length >= 2
        ? [gameState.dealerHand[0], { suit: "back", value: "hidden" }]
        : gameState.dealerHand;
    const dealerValue =
      gameState.phase === "dealer" || gameState.phase === "results"
        ? gameState.dealerScore
        : gameState.dealerHand[0]
          ? handValue([gameState.dealerHand[0]])
          : 0;
    const phaseMap = {
      lobby: "lobby",
      playing: "playerTurn",
      dealer: "dealerTurn",
      results: "roundOver",
    };
    return {
      roomCode: gameState.roomCode,
      phase: phaseMap[gameState.phase] || gameState.phase,
      players,
      dealerHand,
      dealerScore: dealerValue,
      currentTurn: gameState.currentTurn,
      results: gameState.results,
    };
  }

  function broadcastState(gameState) {
    const payload = getStatePayload(gameState);
    gameState.players.forEach((p) => {
      if (!p.connected) return;
      const entry = [...connections.entries()].find(
        ([, info]) => info.playerId === p.id && info.roomCode === gameState.roomCode
      );
      if (entry) {
        const [ws] = entry;
        send(ws, { type: "state", state: payload });
      }
    });
  }

  function startRound(gameState) {
    if (gameState.phase !== "lobby") return false;
    const active = gameState.players.filter((p) => p.connected);
    if (active.length === 0) return false;
    gameState.deck = shuffle(createShoe(SHOE_DECKS));
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
    const first = toDeal.find((p) => !p.status || p.status !== "blackjack");
    gameState.currentTurn = first ? first.id : null;
    if (!gameState.currentTurn) {
      gameState.phase = "dealer";
      gameState.currentTurn = "dealer";
      runDealer();
    }
    broadcastState(gameState);
    return true;
  }

  function runDealer(gameState) {
    gameState.phase = "dealer";
    gameState.currentTurn = "dealer";
    while (dealerShouldHit(gameState.dealerScore)) {
      const card = gameState.deck.pop();
      gameState.dealerHand.push(card);
      gameState.dealerScore = handValue(gameState.dealerHand);
    }
    settle(gameState);
  }

  function settle(gameState) {
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
    broadcastState(gameState);
  }

  function nextTurn(gameState) {
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
      broadcastState(gameState);
    } else {
      runDealer(gameState);
    }
  }

  wss.on("connection", (ws) => {
    log("connection");

    ws.on("message", (data) => {
      const msg = parseMessage(data.toString());
      if (!msg || !msg.type) return;

      if (msg.type === "createRoom" || msg.type === "joinRoom") {
        const name = (msg.name || "").trim().slice(0, 32) || "Player";
        const existingId = msg.playerId || null;
        let gameState;
        if (msg.type === "createRoom") {
          gameState = createRoom();
        } else {
          const code = String(msg.roomCode || "").trim().toUpperCase();
          gameState = rooms.get(code);
          if (!gameState) {
            send(ws, { type: "error", message: "Room not found." });
            return;
          }
        }

        let player = existingId ? gameState.players.find((p) => p.id === existingId) : null;
        if (player) {
          if (player.connected) {
            send(ws, { type: "error", message: "Already in game." });
            return;
          }
          player.connected = true;
          player.name = name;
          connections.set(ws, { roomCode: gameState.roomCode, playerId: player.id });
          log(`rejoin: ${name} (${player.id}) in ${gameState.roomCode}`);
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
          connections.set(ws, { roomCode: gameState.roomCode, playerId: id });
          log(`join: ${name} (${id}) in ${gameState.roomCode}`);
        }
        send(ws, { type: "you", playerId: player.id });
        send(ws, { type: "room", roomCode: gameState.roomCode });
        send(ws, { type: "state", state: getStatePayload(gameState) });
        send(ws, { type: "toast", message: "Joined the table." });
        broadcastState(gameState);
        return;
      }

      const info = connections.get(ws);
      if (!info) {
        send(ws, { type: "error", message: "Create or join a room first." });
        return;
      }

      const gameState = rooms.get(info.roomCode);
      if (!gameState) {
        send(ws, { type: "error", message: "Room not found." });
        return;
      }

      const player = gameState.players.find((p) => p.id === info.playerId);
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
        if (startRound(gameState)) {
          gameState.players.forEach((p) => {
            if (!p.connected) return;
            const entry = [...connections.entries()].find(
              ([, c]) => c.playerId === p.id && c.roomCode === gameState.roomCode
            );
            if (entry) send(entry[0], { type: "toast", message: "Round started." });
          });
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
        gameState.players.forEach((p) => {
          if (!p.connected) return;
          const entry = [...connections.entries()].find(
            ([, c]) => c.playerId === p.id && c.roomCode === gameState.roomCode
          );
          if (entry) send(entry[0], { type: "toast", message: "Table reset." });
        });
        broadcastState(gameState);
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
          broadcastState(gameState);
          if (player.status === "busted") nextTurn(gameState);
        } else {
          player.status = "stood";
          broadcastState(gameState);
          nextTurn(gameState);
        }
      }
    });

    ws.on("close", () => {
      const info = connections.get(ws);
      connections.delete(ws);
      if (!info) return;
      const gameState = rooms.get(info.roomCode);
      if (!gameState) return;
      const player = gameState.players.find((p) => p.id === info.playerId);
      if (player) {
        player.connected = false;
        log(`disconnect: ${player.name} in ${gameState.roomCode}`);
        broadcastState(gameState);
      }
    });
  });

  log(`registered at ${pathPrefix}`);
}

module.exports = { register };
