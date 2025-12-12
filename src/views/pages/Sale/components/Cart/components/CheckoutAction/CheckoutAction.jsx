import { Button as AntdButton, Modal, message } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { ButtonGroup } from '../../../../../../templates/system/Button/Button';
import { Receipt } from '../../../../../checkout/Receipt';

import { formatPrice } from '@/utils/format';

const antd = { Button: AntdButton, message };
export const CheckoutAction = ({
  TotalPurchaseRef,
  ProductSelected,
  handleCancelShipping,
  handleInvoice,
  componentToPrintRef,
  bill,
}) => {
  const showCancelSaleConfirm = () => {
    Modal.confirm({
      title: 'Cancelar Venta',
      content:
        'Si cancelas, se perderán todos los datos de la venta actual. ¿Deseas continuar?',
      okText: 'Cancelar Venta',
      zIndex: 999999999999,
      okType: 'danger',
      cancelText: 'Continuar Venta',

      onOk() {
        // Aquí manejas la confirmación de la cancelación
        antd.message.success('Venta cancelada', 2.5);

        handleCancelShipping();
      },
      onCancel() {
        // Aquí manejas el caso en que el usuario decide no cancelar la venta
      },
    });
  };
  return (
    <Container>
      <PriceContainer>{formatPrice(TotalPurchaseRef)}</PriceContainer>
      <Receipt ref={componentToPrintRef} data={bill}></Receipt>
      <ButtonGroup>
        <Button
          borderRadius="normal"
          title="Cancelar"
          onClick={showCancelSaleConfirm}
          disabled={ProductSelected.length >= 1 ? false : true}
        >
          Cancelar
        </Button>

        <Button
          type="primary"
          borderRadius="normal"
          title="Facturar"
          onClick={handleInvoice}
          color="primary"
          disabled={ProductSelected.length >= 1 ? false : true}
        >
          Facturar
        </Button>
      </ButtonGroup>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2.6em;
  padding: 0 0.4em;
  overflow: hidden;
  color: white;
  background-color: var(--gray-8);
  border-top-left-radius: var(--border-radius-light);

  h3 {
    display: flex;
    gap: 0.4em;
    width: 100%;

    .price {
      letter-spacing: 1px;
    }
  }
`;

const PriceContainer = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
  font-size: 1.4em;
  font-weight: 700;
  letter-spacing: 1px;
`;
const Button = styled(antd.Button)`
  align-items: center;
  display: flex;
  font-size: 1em;
  font-weight: 600;
  justify-content: center;
  padding: 0.4em;
  ${(props) => (props.disabled ? 'background-color: #8f8e8e !important' : null)}
`;
