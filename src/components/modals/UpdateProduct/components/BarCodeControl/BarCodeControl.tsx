// @ts-nocheck
import React from 'react';
import Barcode from 'react-barcode';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { setProduct } from '@/features/updateProduct/updateProductSlice';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';

export const BarCodeControl = ({ product, value }) => {
  const dispatch = useDispatch();
  return (
    <Container>
      <InputV4
        label={'Codigo de Barra'}
        value={value}
        onChange={(e) =>
          dispatch(setProduct({ ...product, barCode: e.target.value }))
        }
      />
      {value ? (
        <StyledBarcode height={60} width={1.4} value={value || ''} />
      ) : (
        <Icon>{icons.inventory.barcode}</Icon>
      )}
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  place-items: center center;
  justify-content: center;
  width: 100%;
`;

const StyledBarcode = styled(Barcode)`
  width: 100%;

  /* Estilos CSS aquí */
  height: 3em;
`;
const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 6.4em;

  svg {
    font-size: 4em;
  }
`;
