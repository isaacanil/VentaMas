import { Button, Tooltip } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import { useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { useDialog } from '@/Context/Dialog';
import { selectCashReconciliation } from '@/features/cashCount/cashStateSlice';

export const CashReconciliationToolbar = ({ side = 'left' }) => {
  const matchWithCashReconciliation = useMatch('/cash-reconciliation');
  const navigate = useNavigate();
  const { setDialogConfirm } = useDialog();
  const { state } = useSelector(selectCashReconciliation);

  const handleSwitchToCashRegisterOpening = () => {
    if (state === 'open') {
      setDialogConfirm({
        isOpen: true,
        title: 'Caja ya abierta',
        type: 'warning',
        message:
          'Ya existe una caja abierta en el sistema. Debe cerrar la caja actual antes de abrir una nueva.',
        onConfirm: null,
      });
      return;
    }
    if (state === 'closing') {
      setDialogConfirm({
        isOpen: true,
        title: 'Cierre en proceso',
        type: 'warning',
        message:
          'Se está procesando el cierre de caja actual. Espere a que termine antes de abrir una nueva caja.',
        onConfirm: null,
      });
      return;
    }
    navigate('/cash-register-opening');
  };
  return matchWithCashReconciliation ? (
    <Container>
      {side === 'right' && (
        <Tooltip title="Crear cuadre de caja" placement="bottomRight">
          <Button
            onClick={handleSwitchToCashRegisterOpening}
            icon={icons.operationModes.add}
          >
            Cuadre
          </Button>
        </Tooltip>
      )}
    </Container>
  ) : null;
};

const Container = styled.div``;
