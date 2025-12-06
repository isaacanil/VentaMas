import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { toggleAddProductOutflow } from '../../../../../../../features/modals/modalSlice';
import { MenuApp } from '../../../../../../templates/MenuApp/MenuApp';
import { Button } from '../../../../../../templates/system/Button/Button';
import { FormattedValue } from '../../../../../../templates/system/FormattedValue/FormattedValue';

export const Header = () => {
  const dispatch = useDispatch();
  const handleClick = () => {
    dispatch(toggleAddProductOutflow());
  };
  return (
    <span>
      <MenuApp sectionName={'Salida de Producto'} />
      <Container>
        <HeaderWrapper>
          {/* <Title>Registro de salida de productos</Title> */}
          <FormattedValue
            type={'subtitle'}
            value={'Registro de salida de productos'}
          />
          <Button
            aria-label="Nueva Salida"
            bgcolor={'primary'}
            title={'Nueva Salida'}
            borderRadius={'normal'}
            onClick={handleClick}
          />
        </HeaderWrapper>
      </Container>
    </span>
  );
};
const Container = styled.div`
  width: 100%;
  padding: 16px;
  background-color: var(--white);
`;

const HeaderWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
`;
