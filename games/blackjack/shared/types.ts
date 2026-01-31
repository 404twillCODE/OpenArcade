/**
 * Shared TypeScript types for Blackjack client.
 */

export type Phase = "lobby" | "playerTurn" | "dealerTurn" | "roundOver";

export interface Card {
  suit: string;
  value: string;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  status: string | null;
  connected: boolean;
  isHost?: boolean;
}

export interface GameState {
  roomCode?: string;
  phase: Phase;
  players: PlayerState[];
  dealerHand?: Card[];
  dealerScore?: number;
  currentTurn: string | null;
  results: Record<string, string> | null;
}
