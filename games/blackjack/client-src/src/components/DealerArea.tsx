import styled from "styled-components";
import Card from "./Card";
import type { Card as CardType, PlayerState } from "../../../shared/types";

const DealerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 300px;
`;

const DealerTitle = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(10, 34, 25, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%);
  border: 2px solid rgba(212, 175, 55, 0.5);
  color: #d4af37;
  border-radius: 20px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 10px rgba(212, 175, 55, 0.3);
`;

const DealerScore = styled.span<{ $score: number }>`
  margin-left: 12px;
  background: ${(p) =>
    p.$score > 21
      ? "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)"
      : p.$score >= 17
        ? "linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)"
        : "linear-gradient(135deg, #4caf50 0%, #43a047 100%)"};
  color: ${(p) => (p.$score > 21 ? "white" : p.$score >= 17 ? "#0a2219" : "white")};
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const CardArea = styled.div`
  display: flex;
  justify-content: center;
  min-height: 130px;
  position: relative;
`;

const DealerStatus = styled.div`
  margin-top: 8px;
  font-size: 0.9rem;
  color: #d4af37;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ScoreChip = styled.div<{ $score: number }>`
  position: absolute;
  top: 45px;
  right: -15px;
  background: ${(p) =>
    p.$score > 21
      ? "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)"
      : p.$score === 21
        ? "linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)"
        : "linear-gradient(135deg, rgba(10, 34, 25, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%)"};
  color: ${(p) => (p.$score > 21 ? "white" : p.$score === 21 ? "#0a2219" : "#d4af37")};
  border: 2px solid
    ${(p) => (p.$score > 21 ? "#f44336" : p.$score === 21 ? "#d4af37" : "rgba(212, 175, 55, 0.5)")};
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 10;
`;

function calculateVisibleScore(cards: CardType[], showAll: boolean): number {
  if (!cards || cards.length === 0) return 0;
  const visible = showAll ? cards : [cards[0]];
  let score = 0;
  let aces = 0;
  for (const card of visible) {
    if (card.value === "ace") {
      aces++;
      score += 11;
    } else if (["king", "queen", "jack"].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value, 10);
    }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

export default function DealerArea({
  dealer,
  phase,
  currentTurn,
  players = [],
}: {
  dealer: { cards: CardType[]; score: number };
  phase: string;
  currentTurn: string | null;
  players?: PlayerState[];
}) {
  const { cards, score } = dealer;
  const isDealerTurn = currentTurn === "dealer";
  const showAllCards = phase === "roundOver" || isDealerTurn;
  const visibleScore = calculateVisibleScore(cards, showAllCards);

  const getDealerStatus = () => {
    if (showAllCards) {
      if (score > 21) return "Dealer busts!";
      if (score >= 17) return `Dealer stands on ${score}`;
      return "Dealer hits";
    }
    return "Dealer stands on 17";
  };

  return (
    <DealerContainer>
      <DealerTitle>
        Dealer
        {cards && cards.length > 0 && <DealerScore $score={visibleScore}>{visibleScore}</DealerScore>}
      </DealerTitle>

      <CardArea>
        {cards &&
          cards.map((card, index) => {
            const isHidden = index === 1 && !showAllCards;
            const isNewCard = index === cards.length - 1;
            return (
              <Card
                key={`${card.suit}-${card.value}-${index}`}
                card={card}
                hidden={isHidden}
                isNewCard={isNewCard}
              />
            );
          })}

        {cards && cards.length > 0 && showAllCards && <ScoreChip $score={score}>{score}</ScoreChip>}
      </CardArea>

      <DealerStatus>{getDealerStatus()}</DealerStatus>
    </DealerContainer>
  );
}
