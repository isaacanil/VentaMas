import React from 'react';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import routesName from '@/router/routes/routesName';
import { AddProductButton } from '@/components/ui/Button/AddProductButton';
import { ButtonGroup } from '@/components/ui/Button/Button';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

export const CreatePurchaseToolbar = ({
  side = 'left',
}: ToolbarComponentProps) => {
  const { PURCHASES_CREATE } = routesName.PURCHASE_TERM;
  const matchWithCashReconciliation = useMatch(PURCHASES_CREATE);
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
