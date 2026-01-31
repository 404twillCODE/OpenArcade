const STORAGE_NAME = "openarcade_blackjack_name";
const STORAGE_PLAYER_ID = "openarcade_blackjack_playerId";

const proto = location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${proto}//${location.host}/ws/blackjack`;

interface Card {
  suit: string;
  value: string;
}

interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  status: string | null;
  connected: boolean;
  isHost?: boolean;
}

interface GameState {
  phase: string;
  players: PlayerState[];
  dealerHand: Card[];
  dealerScore: number;
  currentTurn: string | null;
  results: Record<string, string> | null;
}

const $ = (id: string): HTMLElement | null => document.getElementById(id);
const joinScreen = $("join-screen")!;
const gameScreen = $("game-screen")!;
const nameInput = $("name-input") as HTMLInputElement | null;
const joinBtn = $("join-btn")!;
const statusPill = $("status-pill")!;
const dealerScoreEl = $("dealer-score")!;
const dealerCardsEl = $("dealer-cards")!;
const playersArea = $("players-area")!;
const hitBtn = $("hit-btn")!;
const standBtn = $("stand-btn")!;
const startRoundBtn = $("start-round-btn")!;
const resetBtn = $("reset-btn")!;
const resultBanner = $("result-banner")!;

let ws: WebSocket | null = null;
let myPlayerId: string | null = null;
let state: GameState | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let joined = false;

function setStatus(className: string, text: string): void {
  statusPill.className = "status-pill " + (className || "");
  statusPill.textContent = text;
}

function connect(): void {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  setStatus("", "Connecting…");
  const socket = new WebSocket(wsUrl);
  socket.onopen = () => {
    setStatus("connected", "Connected");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (joined) {
      send({ type: "join", name: getName(), playerId: myPlayerId ?? undefined });
    }
  };
  socket.onclose = () => {
    setStatus("disconnected", "Disconnected");
    ws = null;
    if (joined) {
      setStatus("reconnecting", "Reconnecting…");
      reconnectTimer = setTimeout(connect, 2000);
    }
  };
  socket.onerror = () => {
    setStatus("disconnected", "Error");
  };
  socket.onmessage = (ev: MessageEvent) => {
    let msg: { type: string; state?: GameState; message?: string; playerId?: string };
    try {
      msg = JSON.parse(ev.data as string);
    } catch {
      return;
    }
    if (msg.type === "state" && msg.state) {
      state = msg.state;
      render();
    } else if (msg.type === "toast" && msg.message) {
      showToast(msg.message);
    } else if (msg.type === "error" && msg.message) {
      showToast(msg.message, "error");
    } else if (msg.type === "you" && msg.playerId) {
      myPlayerId = msg.playerId;
      try {
        localStorage.setItem(STORAGE_PLAYER_ID, myPlayerId);
      } catch {
        /* ignore */
      }
    }
  };
  ws = socket;
}

function send(msg: object): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function getName(): string {
  return (nameInput?.value.trim()) || "Player";
}

function showToast(message: string, kind?: string): void {
  const el = document.createElement("div");
  el.className = "toast " + (kind || "");
  el.setAttribute("role", "alert");
  el.textContent = message;
  el.style.cssText =
    "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 20px;background:var(--surface-elevated);border:1px solid var(--border);border-radius:8px;font-size:14px;z-index:1000;animation:fadeIn 0.2s ease;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function cardEl(card: Card): HTMLElement {
  const div = document.createElement("div");
  div.className = "card";
  if (card.suit === "back" || card.value === "hidden") {
    div.classList.add("back");
    div.textContent = "🂠";
    return div;
  }
  const red = card.suit === "hearts" || card.suit === "diamonds";
  if (red) div.classList.add("red");
  const value =
    card.value === "ace"
      ? "A"
      : card.value === "jack"
        ? "J"
        : card.value === "queen"
          ? "Q"
          : card.value === "king"
            ? "K"
            : card.value;
  div.textContent = value;
  return div;
}

function renderPlayers(): void {
  if (!state?.players) return;
  playersArea.innerHTML = "";
  for (const p of state.players) {
    const seat = document.createElement("div");
    seat.className = "player-seat";
    seat.dataset.playerId = p.id;
    if (state.currentTurn === p.id) seat.classList.add("turn");
    if (!p.connected) seat.classList.add("disconnected");
    const nameEl = document.createElement("div");
    nameEl.className = "name";
    nameEl.textContent = p.name || "—";
    if (p.isHost) {
      const badge = document.createElement("span");
      badge.className = "host-badge";
      badge.textContent = "Host";
      nameEl.appendChild(badge);
    }
    seat.appendChild(nameEl);
    const scoreEl = document.createElement("div");
    scoreEl.className = "score";
    scoreEl.textContent = p.hand?.length ? "Score: " + p.score : "";
    seat.appendChild(scoreEl);
    const cardsEl = document.createElement("div");
    cardsEl.className = "cards";
    if (p.hand?.length) {
      for (const c of p.hand) {
        cardsEl.appendChild(cardEl(c));
      }
    }
    seat.appendChild(cardsEl);
    playersArea.appendChild(seat);
  }
}

function renderDealer(): void {
  if (!state) return;
  dealerScoreEl.textContent = state.dealerScore ? "Dealer: " + state.dealerScore : "";
  dealerCardsEl.innerHTML = "";
  if (state.dealerHand?.length) {
    for (const c of state.dealerHand) {
      dealerCardsEl.appendChild(cardEl(c));
    }
  }
}

function renderControls(): void {
  const isMyTurn = state?.phase === "playing" && state.currentTurn === myPlayerId;
  const canAct = isMyTurn && ws?.readyState === WebSocket.OPEN;
  (hitBtn as HTMLButtonElement).disabled = !canAct;
  (standBtn as HTMLButtonElement).disabled = !canAct;
  const isHost = state?.players?.some((p) => p.id === myPlayerId && p.isHost) ?? false;
  const inLobby = state?.phase === "lobby";
  (startRoundBtn as HTMLButtonElement).disabled = !(isHost && inLobby && ws?.readyState === WebSocket.OPEN);
  (resetBtn as HTMLButtonElement).disabled = !(isHost && ws?.readyState === WebSocket.OPEN);
}

function renderResult(): void {
  if (!state || state.phase !== "results" || !state.results || !myPlayerId) {
    resultBanner.classList.add("hidden");
    return;
  }
  const outcome = state.results[myPlayerId];
  if (!outcome) {
    resultBanner.classList.add("hidden");
    return;
  }
  resultBanner.classList.remove("hidden");
  resultBanner.className =
    "result-banner " +
    (outcome === "win" || outcome === "blackjack" ? "win" : outcome === "lose" || outcome === "bust" ? "lose" : "push");
  const text =
    outcome === "blackjack" ? "Blackjack!" : outcome === "win" ? "You win" : outcome === "lose" || outcome === "bust" ? "You lose" : "Push";
  resultBanner.textContent = text;
}

function render(): void {
  renderDealer();
  renderPlayers();
  renderControls();
  renderResult();
}

function onJoin(): void {
  const name = getName();
  if (!name) return;
  try {
    localStorage.setItem(STORAGE_NAME, name);
  } catch {
    /* ignore */
  }
  let storedId: string | null = null;
  try {
    storedId = localStorage.getItem(STORAGE_PLAYER_ID);
  } catch {
    /* ignore */
  }
  send({ type: "join", name, playerId: storedId ?? undefined });
  joined = true;
  joinScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
}

function init(): void {
  try {
    const saved = localStorage.getItem(STORAGE_NAME);
    if (saved && nameInput) nameInput.value = saved;
  } catch {
    /* ignore */
  }
  joinBtn.addEventListener("click", onJoin);
  nameInput?.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") onJoin();
  });
  hitBtn.addEventListener("click", () => send({ type: "action", action: "hit" }));
  standBtn.addEventListener("click", () => send({ type: "action", action: "stand" }));
  startRoundBtn.addEventListener("click", () => send({ type: "startRound" }));
  resetBtn.addEventListener("click", () => send({ type: "reset" }));
  connect();
}

init();
