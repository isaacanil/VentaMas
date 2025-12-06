import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { toggleAddCategory } from '../../../features/modals/modalSlice';
import { Button } from '../../templates/system/Button/Button';

export const ToolBar = () => {
  const dispatch = useDispatch();

  const openModal = () => dispatch(toggleAddCategory({ isOpen: true }));

  return (
    <Container>
      <Wrapper>
        <Button
          borderRadius="normal"
          bgcolor="primary"
          title="Agregar Categoría"
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
  background-color: rgb(255 255 255);
`;
const Wrapper = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: right;
  width: 100%;
  max-width: 1000px;
  padding: 0 1em;
`;
