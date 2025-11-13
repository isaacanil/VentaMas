import React from 'react';
import QRCode from 'react-qr-code';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../../../constants/icons/icons';
import { setProduct } from '../../../../../../features/updateProduct/updateProductSlice';
import { InputV4 } from '../../../../../templates/system/Inputs/GeneralInput/InputV4';

export const QRCodeControl = ({ product, value }) => {
  const dispatch = useDispatch();
  return (
    <Container>
      <InputV4
        label={'Codigo QR'}
        value={value}
        onChange={(e) =>
          dispatch(setProduct({ ...product, qrCode: e.target.value }))
        }
      />
      {value ? (
        <StyledQRCode size={100} value={value || ''} />
      ) : (
        <Icon>{icons.inventory.qrcode}</Icon>
      )}
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  gap: 0.6em;
  place-items: center center;
  justify-content: center;
  width: 100%;
`;
const StyledQRCode = styled(QRCode)`
  /* Estilos CSS aquí */

  border: 2px solid black;
  border-radius: 10px;
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 6.3em;

  svg {
    font-size: 4em;
  }
`;
