/**
 * Blackjack WebSocket protocol (shared contract).
 * Client -> server: join, action, startRound, reset.
 * Server -> client: state, toast, error.
 */

/** @typedef {'hearts'|'diamonds'|'clubs'|'spades'} Suit */
/** @typedef {'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'jack'|'queen'|'king'|'ace'} CardValue */
/**
 * @typedef {Object} Card
 * @property {Suit} suit
 * @property {CardValue} value
 */

/**
 * @typedef {Object} PlayerState
 * @property {string} id - connection/session id
 * @property {string} name - display name
 * @property {Card[]} hand
 * @property {number} score
 * @property {string|null} status - 'stood'|'busted'|'blackjack'|null
 * @property {boolean} connected
 * @property {boolean} [isHost]
 */

/**
 * @typedef {Object} GameStatePayload
 * @property {string} phase - 'lobby'|'playing'|'dealer'|'results'
 * @property {PlayerState[]} players
 * @property {Card[]} dealerHand - may hide second card until dealer phase
 * @property {number} dealerScore
 * @property {string|null} currentTurn - player id or 'dealer' or null
 * @property {Object|null} results - { playerId: 'win'|'lose'|'push'|'bust'|'blackjack' } or null
 */

// --- Client -> Server ---

/** join: { type: 'join', name: string } */
/** action: { type: 'action', action: 'hit'|'stand' } */
/** startRound: { type: 'startRound' } (host only) */
/** reset: { type: 'reset' } (host only) */

// --- Server -> Client ---

/** state: { type: 'state', state: GameStatePayload } */
/** toast: { type: 'toast', message: string } */
/** error: { type: 'error', message: string } */

function parseMessage(raw) {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function serializeMessage(msg) {
  return JSON.stringify(msg);
}

module.exports = {
  parseMessage,
  serializeMessage,
};
