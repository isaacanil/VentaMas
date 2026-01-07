// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';

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
  gap: 0.5em;
  align-items: center;
  justify-content: space-between;
  padding: 0.65em 0.9em;
  background: linear-gradient(#fff, #fcfcfc);
  border-bottom: 1px solid #f0f0f0;
`;
const Title = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #222;
  letter-spacing: 0.5px;
`;
const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  color: #666;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: 0.15s;

  &:hover {
    color: #222;
    background: #f2f2f2;
  }

  svg {
    font-size: 1.05rem;
  }
`;
