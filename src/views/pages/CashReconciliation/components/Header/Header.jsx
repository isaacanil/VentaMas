import React from 'react';
import styled from 'styled-components';

import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

export const Header = () => {
  return (
    <Container>
      <MenuApp sectionName={'Cuadre de Caja'} />
    </Container>
  );
};
const Container = styled.div``;
