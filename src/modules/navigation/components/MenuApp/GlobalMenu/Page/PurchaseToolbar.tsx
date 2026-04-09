import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// import { Button } from '@/components/ui/Button/Button'

import routesName from '@/router/routes/routesName';
import { ButtonGroup } from '@/components/ui/Button/ButtonGroup';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

export const PurchaseToolbar = ({ side = 'left' }: ToolbarComponentProps) => {
  const { PURCHASES, PURCHASES_ANALYTICS, PURCHASES_CREATE } =
    routesName.PURCHASE_TERM;
  const matchWithCashReconciliation = useMatch(PURCHASES);

  const navigate = useNavigate();

  const handleOpenPurchaseChart = () => navigate(PURCHASES_ANALYTICS);
  // const openModal = () => {dispatch(toggleAddPurchaseModal())}
  const openModal = () => navigate(PURCHASES_CREATE);

  return matchWithCashReconciliation ? (
    <Container>
      {side === 'right' && (
        <ButtonGroup>
          <Button onClick={handleOpenPurchaseChart}>Analisis</Button>
          <Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={openModal}>
            Comprar
          </Button>
        </ButtonGroup>
      )}
    </Container>
  ) : null;
};

const Container = styled.div``;
