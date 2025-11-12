import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { OPERATION_MODES } from '../../../../constants/modes';
import { toggleProviderModal } from '../../../../features/modals/modalSlice';
import { Button } from '../../../templates/system/Button/Button';

import { OrderFilter } from './components/OrderFilter/OrderFilter';

export const ToolBar = () => {
  const createMode = OPERATION_MODES.CREATE.id;
  const dispatch = useDispatch();

  const openModal = () => {
    dispatch(toggleProviderModal({ mode: createMode, data: null }));
  };

  return (
    <Container>
      <Wrapper>
        <OrderFilter></OrderFilter>{' '}
        <Button
          borderRadius="normal"
          bgcolor="primary"
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          title={` Proveedores`}
          onClick={openModal}
        />
      </Wrapper>
    </Container>
  );
};
const Container = styled.div`
  height: 2.5em;
  width: 100vw;
  background-color: rgb(255, 255, 255);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1em;
`;
const Wrapper = styled.div`
  max-width: 1000px;
  width: 100%;
  padding: 0 1em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1em;
`;
