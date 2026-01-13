import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCart } from '@/features/cart/cartSlice';
import { Showcase } from '@/components/ui/ShowCase/ShowCase';

export const ChargedSection = () => {
  const cart = useSelector(selectCart) as {
    data?: { totalPurchase?: { value?: number } };
  };
  const cartData = cart.data;
  const total = cartData?.totalPurchase?.value ?? 0;
  return (
    <Container>
      <Showcase title="Total a cobrar" valueType="price" value={total} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  background-color: var(--white-2);
`;
