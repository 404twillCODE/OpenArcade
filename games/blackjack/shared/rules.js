/**
 * Blackjack rules (shared). Dealer stands on soft 17. Shoe = 4 decks.
 */

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

function createShoe(deckCount = 4) {
  const shoe = [];
  for (let i = 0; i < deckCount; i++) {
    shoe.push(...createDeck());
  }
  return shoe;
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

/** Dealer stands on soft 17 (value 17 with ace as 11 = stand). */
function dealerShouldHit(value) {
  return value < 17;
}

module.exports = {
  createDeck,
  createShoe,
  shuffle,
  handValue,
  isBlackjack,
  dealerShouldHit,
  SUITS,
  VALUES,
};
