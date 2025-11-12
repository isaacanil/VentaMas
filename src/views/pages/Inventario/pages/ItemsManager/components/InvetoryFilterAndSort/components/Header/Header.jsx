import React from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../../../../../constants/icons/icons';

export const Header = ({ onClose }) => {
  return (
    <Container>
      <Title>Filtros y Orden de Ítems</Title>
      <CloseButton onClick={onClose} aria-label="Cerrar panel de filtros">
        {icons.operationModes.close}
      </CloseButton>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5em;
  padding: 0.65em 0.9em;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(#ffffff, #fcfcfc);
`;
const Title = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: #222;
  letter-spacing: 0.5px;
`;
const CloseButton = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  color: #666;
  border-radius: 8px;
  transition: 0.15s;
  &:hover {
    background: #f2f2f2;
    color: #222;
  }
  svg {
    font-size: 1.05rem;
  }
`;
