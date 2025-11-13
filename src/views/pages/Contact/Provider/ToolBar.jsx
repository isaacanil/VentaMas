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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 2.5em;
  margin-bottom: 1em;
  background-color: rgb(255 255 255);
`;
const Wrapper = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1000px;
  padding: 0 1em;
`;
