import React from 'react';
import { useDispatch } from 'react-redux';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { OPERATION_MODES } from '../../../../../constants/modes';
import { toggleClientModal } from '../../../../../features/modals/modalSlice';
import routesName from '../../../../../routes/routesName';
import { Button, ButtonGroup } from '../../../system/Button/Button';

export const ClientControlToolbar = ({ side = 'left' }) => {
  const { CLIENTS } = routesName.CONTACT_TERM;
  const matchWithCashReconciliation = useMatch(CLIENTS);

  const dispatch = useDispatch();

  const createMode = OPERATION_MODES.CREATE.id;
  const openModal = () =>
    dispatch(toggleClientModal({ mode: createMode, data: null }));
  return matchWithCashReconciliation ? (
    <Container>
      {side === 'right' && (
        <ButtonGroup>
          <Button
            borderRadius="normal"
            startIcon={icons.mathOperations.add}
            title="Nuevo Cliente"
            onClick={openModal}
          />
        </ButtonGroup>
      )}
    </Container>
  ) : null;
};

const Container = styled.div``;
