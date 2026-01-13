import React from 'react';
import styled from 'styled-components';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

export const Header: React.FC = () => {
  return (
    <Container>
      <MenuApp sectionName={'Cuadre de Caja'} />
    </Container>
  );
};

const Container = styled.div``;

