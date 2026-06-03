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
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        onClick?.();
      }}
      role="button"
      tabIndex={0}
      aria-expanded={Boolean(isExpanded)}
      aria-label={isExpanded ? 'Contraer calculadora' : 'Expandir calculadora'}
    >
      {isExpanded ? icons.arrows.chevronUp : icons.arrows.chevronDown}
    </Container>
  );
};

const Container = styled.div``;
