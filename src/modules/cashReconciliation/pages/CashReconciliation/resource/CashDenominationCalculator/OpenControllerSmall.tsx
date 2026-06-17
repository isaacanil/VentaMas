import React from 'react';
import styled from 'styled-components';
import { icons } from '@/constants/icons/icons';

interface OpenControllerSmallProps {
  isExpanded?: boolean | null;
  onClick?: () => void;
}

export const OpenControllerSmall: React.FC<OpenControllerSmallProps> = ({
  isExpanded,
  onClick,
}) => {
  return (
    <Container
      type="button"
      onClick={onClick}
      aria-expanded={Boolean(isExpanded)}
      aria-label={isExpanded ? 'Contraer calculadora' : 'Expandir calculadora'}
    >
      {isExpanded ? icons.arrows.chevronUp : icons.arrows.chevronDown}
    </Container>
  );
};

const Container = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  color: inherit;
  font: inherit;
  background: transparent;
  cursor: pointer;
`;
