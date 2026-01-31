import { useEffect, useState } from "react";
import styled from "styled-components";
import { GameProvider, useGame } from "./context/GameContext";
import DealerArea from "./components/DealerArea";
import PlayerSeat from "./components/PlayerSeat";
import PlayerControls from "./components/PlayerControls";

const GameRoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: white;
  overflow: hidden;
  position: relative;
`;

const GameHeader = styled.header<{ $hidden?: boolean }>`
  display: ${(p) => (p.$hidden ? "none" : "flex")};
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background: rgba(12, 14, 18, 0.92);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 10;
`;

const RoomTitle = styled.h1`
  font-size: 20px;
  color: #e5e7eb;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const StatusPill = styled.div<{ $connected: boolean }>`
  background: ${(p) => (p.$connected ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.06)")};
  color: ${(p) => (p.$connected ? "#22c55e" : "rgba(255, 255, 255, 0.7)")};
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RoomCodeBadge = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e5e7eb;
  font-weight: 600;
  cursor: pointer;
`;

const HeaderButton = styled.button`
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e5e7eb;
  font-weight: 600;
  cursor: pointer;
`;

const GameContent = styled.div<{ $fullscreen?: boolean }>`
  display: flex;
  height: ${(p) => (p.$fullscreen ? "100vh" : "calc(100vh - 56px)")};
`;

const GameTable = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 20px;
  overflow: hidden;
`;

const DealerSection = styled.div`
  height: 30%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const PlayersSection = styled.div`
  height: 50%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
`;

const ControlsSection = styled.div`
  height: 20%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 20px;
`;

const JoinScreen = styled.div<{ $fullscreen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${(p) => (p.$fullscreen ? "100vh" : "calc(100vh - 56px)")};
`;

const JoinCard = styled.div`
  background: rgba(15, 18, 24, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  min-width: 320px;
`;

const JoinLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #cbd5f5;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const JoinInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  font-size: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.3);
  }
`;

const JoinButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
  }
`;

const SecondaryJoinButton = styled(JoinButton)`
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
  border: 1px solid rgba(255, 255, 255, 0.16);
`;

const RoomCodeInput = styled(JoinInput)`
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const HostControls = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 10px;
`;

const HostButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid rgba(212, 175, 55, 0.5);
  background: linear-gradient(135deg, rgba(10, 34, 25, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%);
  color: #d4af37;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WaitingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 15;
  pointer-events: none;
`;

const WaitingMessage = styled.div`
  text-align: center;
  color: #d4af37;
  z-index: 15;
  margin-bottom: 20px;

  h2 {
    font-size: 32px;
    margin: 0 0 15px 0;
    font-weight: 700;
    text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  p {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    max-width: 400px;
    margin: 0;
  }
`;

const StartRoundButton = styled.button`
  padding: 18px 40px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  background: #fbbf24;
  color: #0b0f19;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 8px 30px rgba(251, 191, 36, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
  pointer-events: auto;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(212, 175, 55, 0.6);
  }
`;

const ResultBanner = styled.div<{ $variant: "win" | "lose" | "push" }>`
  position: absolute;
  bottom: 50%;
  left: 50%;
  transform: translate(-50%, 50%);
  padding: 24px 48px;
  border-radius: 20px;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  z-index: 200;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.4);
  border: 3px solid #d4af37;
  background: linear-gradient(135deg, rgba(10, 34, 25, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%);
  backdrop-filter: blur(10px);
  color: white;

  ${(p) =>
    p.$variant === "win" &&
    `
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.95) 0%, rgba(67, 160, 71, 0.95) 100%);
    border-color: rgba(255, 255, 255, 0.3);
  `}
  ${(p) =>
    p.$variant === "lose" &&
    `
    background: linear-gradient(135deg, rgba(244, 67, 54, 0.95) 0%, rgba(211, 47, 47, 0.95) 100%);
    border-color: rgba(255, 255, 255, 0.2);
  `}
  ${(p) =>
    p.$variant === "push" &&
    `
    background: linear-gradient(135deg, rgba(158, 158, 158, 0.95) 0%, rgba(97, 97, 97, 0.95) 100%);
    border-color: rgba(255, 255, 255, 0.2);
  `}
`;

const Toast = styled.div`
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: rgba(15, 18, 24, 0.95);
  color: #e5e7eb;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  z-index: 1000;
`;

const ErrorMessage = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(211, 47, 47, 0.95) 0%, rgba(183, 28, 28, 0.95) 100%);
  color: white;
  padding: 14px 24px;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(211, 47, 47, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  font-weight: 600;
`;

function GameUI() {
  const {
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
  } = useGame();

  const [draftName, setDraftName] = useState(name);
  const [draftRoomCode, setDraftRoomCode] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  const isHost = players.some((p) => p.id === myId && p.isHost);
  const canAct = phase === "playerTurn" && currentTurn === myId;

  const outcome = myId && results ? results[myId] : null;
  const variant = outcome === "win" || outcome === "blackjack" ? "win" : outcome === "lose" || outcome === "bust" ? "lose" : "push";

  if (!joined) {
    return (
      <GameRoomContainer>
        <GameHeader $hidden={isFullscreen}>
          <RoomTitle>Blackjack</RoomTitle>
          <HeaderActions>
            <StatusPill $connected={connected}>{connected ? "Connected" : "Disconnected"}</StatusPill>
            <HeaderButton onClick={toggleFullscreen}>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</HeaderButton>
          </HeaderActions>
        </GameHeader>
        <JoinScreen $fullscreen={isFullscreen}>
          <JoinCard>
            <JoinLabel htmlFor="name-input">Display name</JoinLabel>
            <JoinInput
              id="name-input"
              maxLength={32}
              placeholder="Your name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
            <JoinLabel htmlFor="room-code">Room code (optional)</JoinLabel>
            <RoomCodeInput
              id="room-code"
              maxLength={8}
              placeholder="ABCD"
              value={draftRoomCode}
              onChange={(e) => setDraftRoomCode(e.target.value.toUpperCase())}
            />
            <JoinButton onClick={() => createRoom(draftName)}>Create table</JoinButton>
            <SecondaryJoinButton onClick={() => joinRoom(draftName, draftRoomCode)}>
              Join table
            </SecondaryJoinButton>
          </JoinCard>
        </JoinScreen>
      </GameRoomContainer>
    );
  }

  return (
    <GameRoomContainer>
      <GameHeader $hidden={isFullscreen}>
        <RoomTitle>Blackjack Table</RoomTitle>
        <HeaderActions>
          {roomCode && (
            <RoomCodeBadge
              onClick={() => {
                if (!roomCode) return;
                try {
                  navigator.clipboard?.writeText(roomCode);
                } catch {
                  /* ignore */
                }
              }}
              title="Copy room code"
            >
              Code: {roomCode}
            </RoomCodeBadge>
          )}
          <StatusPill $connected={connected}>{connected ? "Connected" : "Disconnected"}</StatusPill>
          <HeaderButton onClick={toggleFullscreen}>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</HeaderButton>
        </HeaderActions>
      </GameHeader>

      <GameContent $fullscreen={isFullscreen}>
        <GameTable>
          <DealerSection>
            <DealerArea
              dealer={{ cards: dealerHand, score: dealerScore }}
              phase={phase}
              currentTurn={currentTurn}
              players={players}
            />
          </DealerSection>

          <PlayersSection>
            {players.map((player) => (
              <PlayerSeat
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === myId}
                isPlayerTurn={player.id === currentTurn}
              />
            ))}
          </PlayersSection>

          <ControlsSection>
            {phase === "playerTurn" && <PlayerControls canAct={canAct} onHit={hit} onStand={stand} />}
            {phase === "roundOver" && outcome && (
              <ResultBanner $variant={variant}>
                {outcome === "blackjack"
                  ? "Blackjack!"
                  : outcome === "win"
                    ? "You win"
                    : outcome === "lose" || outcome === "bust"
                      ? "You lose"
                      : "Push"}
              </ResultBanner>
            )}
          </ControlsSection>

          {phase === "lobby" && (
            <WaitingOverlay>
              <WaitingMessage>
                <h2>Waiting for players…</h2>
                <p>{isHost ? "You can start the round when ready." : "Waiting for the host to start the game."}</p>
              </WaitingMessage>
              {isHost && <StartRoundButton onClick={startRound}>Start round</StartRoundButton>}
              {isHost && (
                <HostControls>
                  <HostButton onClick={startRound} disabled={!connected}>
                    Start round
                  </HostButton>
                  <HostButton onClick={reset} disabled={!connected}>
                    Reset table
                  </HostButton>
                </HostControls>
              )}
            </WaitingOverlay>
          )}
        </GameTable>
      </GameContent>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {toasts.map((toast) => (
        <Toast key={toast.id}>{toast.message}</Toast>
      ))}
    </GameRoomContainer>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameUI />
    </GameProvider>
  );
}
