/**
 * Blackjack WebSocket protocol (shared). Server and client use this contract.
 */

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

module.exports = { parseMessage, serializeMessage };
