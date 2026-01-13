import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SelectTotalShoppingItems } from '@/features/cart/cartSlice';
import { formatNumber } from '@/utils/format';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber/AnimatedNumber';


type ShoppingItemsCounterProps = {
  products?: unknown[];
  itemLength?: number;
};

export const ShoppingItemsCounter = ({
  products,
  itemLength,
}: ShoppingItemsCounterProps) => {
  const productLength = itemLength ?? products?.length ?? 0;
  const totalShoppingItems = useSelector(SelectTotalShoppingItems) as number;

  return (
    <Container>
      {totalShoppingItems ? (
        <>
          <AnimatedNumber value={`${formatNumber(totalShoppingItems)}`} />
          <Separator>/</Separator>
        </>
      ) : null}
      <AnimatedNumber value={formatNumber(productLength)} />
    </Container>
  );
};

const Container = styled.div`
  position: absolute;
  right: 1.2em;
  bottom: 0.2em;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 2.2em;
  padding: 0 1em;
  font-weight: 600;
  color: white;
  background-color: var(--gray-8);
  border-radius: 100px;
`;
const Separator = styled.span`
  display: flex;
  align-items: center;
  font-weight: 600;
  color: white;
`;
export default ShoppingItemsCounter;
