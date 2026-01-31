import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GameState, PlayerState, Card } from "../../../shared/types";

type Toast = { id: string; message: string };

type GameContextValue = {
  connected: boolean;
  joined: boolean;
  name: string;
  roomCode: string;
  myId: string | null;
  phase: GameState["phase"];
  players: PlayerState[];
  dealerHand: Card[];
  dealerScore: number;
  currentTurn: string | null;
  results: GameState["results"];
  error: string | null;
  toasts: Toast[];
  createRoom: (name: string) => void;
  joinRoom: (name: string, roomCode: string) => void;
  hit: () => void;
  stand: () => void;
  startRound: () => void;
  reset: () => void;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

const STORAGE_NAME = "openarcade_blackjack_name";
const STORAGE_PLAYER_ID = "openarcade_blackjack_playerId";
const STORAGE_ROOM_CODE = "openarcade_blackjack_roomCode";

const proto = location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${proto}//${location.host}/ws/blackjack`;

function safeGet(key: string): string {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState(safeGet(STORAGE_NAME));
  const [roomCode, setRoomCode] = useState(safeGet(STORAGE_ROOM_CODE));
  const [myId, setMyId] = useState<string | null>(safeGet(STORAGE_PLAYER_ID) || null);
  const [phase, setPhase] = useState<GameState["phase"]>("lobby");
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [dealerScore, setDealerScore] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [results, setResults] = useState<GameState["results"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const send = useCallback((msg: object) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  }, []);

  const applyState = useCallback((state: GameState) => {
    setPhase(state.phase);
    setPlayers(state.players || []);
    setDealerHand(state.dealerHand || []);
    setDealerScore(state.dealerScore || 0);
    setCurrentTurn(state.currentTurn);
    setResults(state.results || null);
    if (state.roomCode) {
      setRoomCode(state.roomCode);
      safeSet(STORAGE_ROOM_CODE, state.roomCode);
    }
  }, []);

  const connect = useCallback(() => {
    const existing = socketRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setError(null);
      pushToast("Connected");
      if (joined) {
        const storedName = safeGet(STORAGE_NAME) || name || "Player";
        const storedRoom = safeGet(STORAGE_ROOM_CODE) || roomCode;
        if (storedRoom) {
          send({ type: "joinRoom", roomCode: storedRoom, name: storedName, playerId: myId ?? undefined });
        } else {
          send({ type: "createRoom", name: storedName, playerId: myId ?? undefined });
        }
      }
    };

    socket.onclose = () => {
      setConnected(false);
      pushToast("Disconnected");
      if (joined) {
        reconnectTimer.current = setTimeout(connect, 2000);
      }
    };

    socket.onerror = () => {
      setConnected(false);
      setError("Connection error");
    };

    socket.onmessage = (ev: MessageEvent) => {
      let msg: { type: string; state?: GameState; message?: string; playerId?: string; roomCode?: string };
      try {
        msg = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      if (msg.type === "state" && msg.state) {
        applyState(msg.state);
      } else if (msg.type === "toast" && msg.message) {
        pushToast(msg.message);
      } else if (msg.type === "error" && msg.message) {
        setError(msg.message);
        pushToast(msg.message);
      } else if (msg.type === "room" && msg.roomCode) {
        setRoomCode(msg.roomCode);
        safeSet(STORAGE_ROOM_CODE, msg.roomCode);
      } else if (msg.type === "you" && msg.playerId) {
        setMyId(msg.playerId);
        safeSet(STORAGE_PLAYER_ID, msg.playerId);
      }
    };
  }, [applyState, joined, myId, name, pushToast, send]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  const createRoom = useCallback(
    (displayName: string) => {
      const trimmed = displayName.trim().slice(0, 32) || "Player";
      setName(trimmed);
      safeSet(STORAGE_NAME, trimmed);
      setJoined(true);
      send({ type: "createRoom", name: trimmed, playerId: myId ?? undefined });
    },
    [myId, send]
  );

  const joinRoom = useCallback(
    (displayName: string, code: string) => {
      const trimmed = displayName.trim().slice(0, 32) || "Player";
      const normalizedCode = code.trim().toUpperCase();
      if (!normalizedCode) {
        setError("Enter a room code to join.");
        return;
      }
      setName(trimmed);
      safeSet(STORAGE_NAME, trimmed);
      setJoined(true);
      send({ type: "joinRoom", roomCode: normalizedCode, name: trimmed, playerId: myId ?? undefined });
    },
    [myId, send]
  );

  const hit = useCallback(() => send({ type: "action", action: "hit" }), [send]);
  const stand = useCallback(() => send({ type: "action", action: "stand" }), [send]);
  const startRound = useCallback(() => send({ type: "startRound" }), [send]);
  const reset = useCallback(() => send({ type: "reset" }), [send]);

  const value = useMemo(
    () => ({
      connected,
      joined,
      name,
      roomCode,
      myId,
      phase,
      players,
      dealerHand,
      dealerScore,
      currentTurn,
      results,
      error,
      toasts,
      createRoom,
      joinRoom,
      hit,
      stand,
      startRound,
      reset,
    }),
    [
      connected,
      joined,
      name,
      roomCode,
      myId,
      phase,
      players,
      dealerHand,
      dealerScore,
      currentTurn,
      results,
      error,
      toasts,
      createRoom,
      joinRoom,
      hit,
      stand,
      startRound,
      reset,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
