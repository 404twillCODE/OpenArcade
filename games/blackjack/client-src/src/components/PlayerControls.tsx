import styled from "styled-components";

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(10, 34, 25, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%);
  border: 2px solid rgba(212, 175, 55, 0.5);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.2);
  backdrop-filter: blur(10px);
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
`;

const ActionButton = styled.button`
  padding: 1rem 0;
  border-radius: 12px;
  border: 2px solid transparent;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const HitButton = styled(ActionButton)`
  background: linear-gradient(135deg, #4caf50 0%, #43a047 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #43a047 0%, #4caf50 100%);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
  }
`;

const StandButton = styled(ActionButton)`
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
    box-shadow: 0 6px 20px rgba(244, 67, 54, 0.6);
  }
`;

const Icon = styled.span`
  font-size: 1.5rem;
  margin-bottom: 5px;
`;

const ButtonText = styled.span`
  font-size: 0.9rem;
`;

export default function PlayerControls({
  canAct,
  onHit,
  onStand,
}: {
  canAct: boolean;
  onHit: () => void;
  onStand: () => void;
}) {
  return (
    <ControlsContainer>
      <ActionsGrid>
        <HitButton onClick={onHit} disabled={!canAct}>
          <Icon>👆</Icon>
          <ButtonText>Hit</ButtonText>
        </HitButton>
        <StandButton onClick={onStand} disabled={!canAct}>
          <Icon>✋</Icon>
          <ButtonText>Stand</ButtonText>
        </StandButton>
      </ActionsGrid>
    </ControlsContainer>
  );
}
