import React from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { Button } from '@/views/templates/system/Button/Button';
import Typography from '@/views/templates/system/Typografy/Typografy';

export const Header = () => {
  return (
    <Container>
      <Typography variant="h3" disableMargins>
        Pago de Factura
      </Typography>
      <Button startIcon={icons.operationModes.close}></Button>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4em 0.8em;
`;
