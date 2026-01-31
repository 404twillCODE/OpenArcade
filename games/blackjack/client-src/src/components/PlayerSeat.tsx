import styled, { css, keyframes } from "styled-components";
import Card from "./Card";
import type { Card as CardType, PlayerState } from "../../../shared/types";

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3),
                0 0 20px rgba(76, 175, 80, 0.2);
  }
  50% {
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.4),
                0 0 25px rgba(76, 175, 80, 0.3);
  }
`;

const borderGlow = keyframes`
  0%, 100% {
    border-color: rgba(76, 175, 80, 0.5);
  }
  50% {
    border-color: rgba(76, 175, 80, 0.7);
  }
`;

const SeatContainer = styled.div<{ $isPlayerTurn?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
  position: relative;
  margin: 0 15px 20px;
  padding: 15px;
  border-radius: 20px;
  border: ${(p) => (p.$isPlayerTurn ? "2px solid rgba(76, 175, 80, 0.5)" : "2px solid transparent")};
  transition: all 0.3s ease;
  ${(p) =>
    p.$isPlayerTurn &&
    css`
      animation: ${glow} 3s ease-in-out infinite, ${borderGlow} 3s ease-in-out infinite;
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(10, 34, 25, 0.2) 100%);
    `}
`;

const UsernameDisplay = styled.div<{ $isCurrentPlayer?: boolean }>`
  font-size: 1rem;
  font-weight: 700;
  padding: 8px 16px;
  margin-bottom: 8px;
  background: ${(p) =>
    p.$isCurrentPlayer
      ? "linear-gradient(135deg, #4caf50 0%, #43a047 100%)"
      : "linear-gradient(135deg, rgba(10, 34, 25, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%)"};
  color: white;
  border: 2px solid ${(p) => (p.$isCurrentPlayer ? "#4caf50" : "rgba(212, 175, 55, 0.5)")};
  border-radius: 20px;
  text-align: center;
  min-width: 100px;
  z-index: 5;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
`;

const CardArea = styled.div`
  display: flex;
  justify-content: center;
  min-height: 130px;
  margin-bottom: 10px;
  position: relative;
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const StatusBadge = styled.div<{ $status?: string }>`
  background-color: ${(p) => {
    if (p.$status === "busted") return "#f44336";
    if (p.$status === "blackjack") return "#e2b714";
    if (p.$status === "stood") return "#2196f3";
    return "transparent";
  }};
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  z-index: 10;
`;

const getStatusLabel = (status: string | null) => {
  switch (status) {
    case "busted":
      return "Busted!";
    case "blackjack":
      return "Blackjack!";
    case "stood":
      return "Stand";
    default:
      return "";
  }
};

export default function PlayerSeat({
  player,
  isCurrentPlayer,
  isPlayerTurn,
}: {
  player: PlayerState;
  isCurrentPlayer: boolean;
  isPlayerTurn: boolean;
}) {
  const { name, hand, status, score } = {
    name: player.name,
    hand: player.hand as CardType[],
    status: player.status,
    score: player.score,
  };

  return (
    <SeatContainer $isPlayerTurn={isPlayerTurn}>
      <UsernameDisplay $isCurrentPlayer={isCurrentPlayer}>{name}</UsernameDisplay>

      <CardArea>
        {hand &&
          hand.map((card, index) => {
            const isNewCard = index === hand.length - 1;
            return <Card key={`${card.suit}-${card.value}-${index}`} card={card} isNewCard={isNewCard} />;
          })}
        {score > 0 && <ScoreChip $score={score}>{score}</ScoreChip>}
      </CardArea>

      {status && <StatusBadge $status={status}>{getStatusLabel(status)}</StatusBadge>}
    </SeatContainer>
  );
}
