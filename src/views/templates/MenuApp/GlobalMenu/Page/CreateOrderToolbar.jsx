import React from 'react';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import routesName from '@/router/routes/routesName';
import { AddProductButton } from '@/views/templates/system/Button/AddProductButton';
import { ButtonGroup } from '@/views/templates/system/Button/Button';

export const CreateOrderToolbar = ({ side = 'left' }) => {
  const { ORDERS_CREATE } = routesName.ORDER_TERM;

  const matchWithCashReconciliation = useMatch(ORDERS_CREATE);

  return matchWithCashReconciliation ? (
    <Container>
      {side === 'right' && (
        <ButtonGroup>
          <AddProductButton />
        </ButtonGroup>
      )}
    </Container>
  ) : null;
};

const Container = styled.div``;
