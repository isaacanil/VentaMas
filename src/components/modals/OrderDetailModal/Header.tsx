// @ts-nocheck
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import { Button } from '@/components/ui/Button/Button';

export const Header = () => {
  return (
    <Container>
      <Title>Detalle de la orden</Title>
      <Button title={<FontAwesomeIcon icon={faTimes} />} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.5em 0.5em 0 0;
`;

const Title = styled.p`
  font-weight: 600;
`;
