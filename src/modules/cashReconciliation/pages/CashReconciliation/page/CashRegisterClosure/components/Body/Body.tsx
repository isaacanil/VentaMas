import { useState } from 'react';
import styled from 'styled-components';
import type { DateTime } from 'luxon';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LeftSide } from './LeftSide/LeftSide';
import { ClosureSidePanel } from './ClosureSidePanel/ClosureSidePanel';

interface BodyProps {
  closingDate: DateTime;
}

export const Body: React.FC<BodyProps> = ({ closingDate: _closingDate }) => {
  const [calculationIsOpen, setCalculationIsOpen] = useState(true);
  const isNarrowScreen = useMediaQuery('(max-width: 767px)');
  const [activeSide, setActiveSide] = useState<'leftSide' | 'rightSide'>(
    'leftSide',
  );

  return (
    <Container>
      {isNarrowScreen && (
        <PillToggle>
          <ToggleButton
            $active={activeSide === 'leftSide'}
            type="button"
            onClick={() => setActiveSide('leftSide')}
          >
            Apertura
          </ToggleButton>
          <ToggleButton
            $active={activeSide === 'rightSide'}
            type="button"
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
          <ClosureSidePanel
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
  grid-template-columns: ${({ $narrow }) =>
    $narrow ? '1fr' : 'repeat(2, 1fr)'};
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
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active }) => ($active ? 'white' : '#333')};
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#4285F4' : 'transparent')};
  border: none;
  border-radius: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $active }) => ($active ? '#4285F4' : '#e0e0e0')};
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 2px;
  }
`;
