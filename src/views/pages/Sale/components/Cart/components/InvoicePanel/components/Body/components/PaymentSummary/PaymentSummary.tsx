// @ts-nocheck
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCart } from '@/features/cart/cartSlice';
import { Showcase } from '@/views/templates/system/ShowCase/ShowCase';

export const PaymentSummary = () => {
  const cart = useSelector(selectCart);
  const cartData = cart.data;
  const total = cartData?.payment?.value;
  const change = cartData?.change?.value;
  const isChangeNegative = change < 0;
  return (
    <Container>
      <Showcase title="Total Pagado" valueType="price" value={total} />
      <Showcase
        title={isChangeNegative ? 'Faltante' : 'Devuelta'}
        valueType="price"
        value={change}
        color={true}
      />
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
`;
