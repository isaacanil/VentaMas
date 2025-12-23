import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// import { Button } from '@/views/templates/system/Button/Button'

import { togglePurchaseChartModal } from '@/features/purchase/purchaseUISlice';
import routesName from '@/router/routes/routesName';
import { ButtonGroup } from '@/views/templates/system/Button/ButtonGroup';

export const PurchaseToolbar = ({ side = 'left' }) => {
  const { PURCHASES, PURCHASES_CREATE } = routesName.PURCHASE_TERM;
  const matchWithCashReconciliation = useMatch(PURCHASES);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleOpenPurchaseChart = () => dispatch(togglePurchaseChartModal());
  // const openModal = () => {dispatch(toggleAddPurchaseModal())}
  const openModal = () => navigate(PURCHASES_CREATE);

  return matchWithCashReconciliation ? (
    <Container>
      {side === 'right' && (
        <ButtonGroup>
          <Button onClick={handleOpenPurchaseChart}>Reporte</Button>
          <Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={openModal}>
            Comprar
          </Button>
        </ButtonGroup>
      )}
    </Container>
  ) : null;
};

const Container = styled.div``;
