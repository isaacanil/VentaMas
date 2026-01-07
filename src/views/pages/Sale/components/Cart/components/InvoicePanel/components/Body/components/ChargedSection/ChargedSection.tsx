// @ts-nocheck
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCart } from '@/features/cart/cartSlice';
import { Showcase } from '@/views/templates/system/ShowCase/ShowCase';

export const ChargedSection = () => {
  const cart = useSelector(selectCart);
  const cartData = cart.data;
  const total = cartData.totalPurchase.value;
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
