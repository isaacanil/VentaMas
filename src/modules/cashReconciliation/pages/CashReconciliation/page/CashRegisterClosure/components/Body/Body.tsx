import { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { DateTime } from 'luxon';
import { LeftSide } from './LeftSide/LeftSide';
import { RightSide } from './RightSide/RightSide';

interface BodyProps {
  closingDate: DateTime;
}

export const Body: React.FC<BodyProps> = ({ closingDate }) => {
  const [calculationIsOpen, setCalculationIsOpen] = useState(true);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const [activeSide, setActiveSide] = useState<'leftSide' | 'rightSide'>(
    'leftSide',
  );

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth < 768);
    };

    checkScreenWidth();
    window.addEventListener('resize', checkScreenWidth);
    return () => {
      window.removeEventListener('resize', checkScreenWidth);
    };
  }, []);

  return (
    <Container>
      {isNarrowScreen && (
        <PillToggle>
          <ToggleButton
            $active={activeSide === 'leftSide'}
            onClick={() => setActiveSide('leftSide')}
          >
            Apertura
          </ToggleButton>
          <ToggleButton
            $active={activeSide === 'rightSide'}
            onClick={() => setActiveSide('rightSide')}
          >
            Cierre
          </ToggleButton>
        </PillToggle>
      )}
      <Group $narrow={isNarrowScreen}>
        {(!isNarrowScreen || activeSide === 'leftSide') && (
          <LeftSide
            calculationIsOpen={calculationIsOpen}
            setCalculationIsOpen={setCalculationIsOpen}
          />
        )}
        {(!isNarrowScreen || activeSide === 'rightSide') && (
          <RightSide
            calculationIsOpen={calculationIsOpen}
            setCalculationIsOpen={setCalculationIsOpen}
          />
        )}
      </Group>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 0.4em;
`;

const Group = styled.div<{ $narrow: boolean }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.$narrow ? '1fr' : 'repeat(2, 1fr)'};
  gap: 3em;
  justify-content: space-between;
`;

const PillToggle = styled.div`
  display: flex;
  width: fit-content;
  padding: 4px;
  margin: 0 auto;
  background: #fff;
  border-radius: 30px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  color: ${(props) => (props.$active ? 'white' : '#333')};
  cursor: pointer;
  background: ${(props) => (props.$active ? '#4285F4' : 'transparent')};
  border: none;
  border-radius: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => (props.$active ? '#4285F4' : '#e0e0e0')};
  }

  &:focus {
    outline: none;
  }
`;
