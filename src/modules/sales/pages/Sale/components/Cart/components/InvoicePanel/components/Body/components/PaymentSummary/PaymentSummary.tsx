import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCart } from '@/features/cart/cartSlice';
import { Showcase } from '@/components/ui/ShowCase/ShowCase';

export const PaymentSummary = () => {
  const cart = useSelector(selectCart) as {
    data?: {
      payment?: { value?: number };
      change?: { value?: number };
    };
  };
  const cartData = cart.data;
  const total = cartData?.payment?.value ?? 0;
  const change = cartData?.change?.value ?? 0;
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
