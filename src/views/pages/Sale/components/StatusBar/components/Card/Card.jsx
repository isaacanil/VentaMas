import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SelectTotalShoppingItems } from '../../../../../../../features/cart/cartSlice';
import { useFormatNumber } from '../../../../../../../hooks/useFormatNumber';
import { AnimatedNumber } from '../../../../../../templates/system/AnimatedNumber/AnimatedNumber';

export const ProductCounter = ({
  productCount = 0,
  visibleStockTotal = 0,
  filterActive = false,
}) => {
  const totalShoppingItems = useSelector(SelectTotalShoppingItems);
  const formattedProductCount = useFormatNumber(productCount);
  const formattedCartItems = totalShoppingItems
    ? useFormatNumber(totalShoppingItems)
    : null;
  const showStockBadge = filterActive && Number.isFinite(visibleStockTotal);
  const formattedVisibleStock = showStockBadge
    ? useFormatNumber(visibleStockTotal)
    : null;

  return (
    <Tooltip title="Productos en el carrito">
      <Container>
        <FontAwesomeIcon icon={faShoppingCart} size="sm" />
        <CounterContent>
          {formattedCartItems ? (
            <>
              <AnimatedNumber value={formattedCartItems} />
              <CounterSeparator>/</CounterSeparator>
            </>
          ) : null}
          <AnimatedNumber value={formattedProductCount} />
          {showStockBadge && formattedVisibleStock ? (
            <UnitsText>{formattedVisibleStock} uds</UnitsText>
          ) : null}
        </CounterContent>
      </Container>
    </Tooltip>
  );
};

const Container = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  background: var(--gray8);
  border-radius: 14px;
  transition: all 0.2s ease;

    &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    transform: translateY(-1px);
  }
`;

const CounterContent = styled.div`
  display: flex;
  align-items: center;
`;

const CounterSeparator = styled.span`
  margin: 0 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgb(255 255 255 / 70%);
`;

const UnitsText = styled.span`
  padding: 0.12rem 0.35rem;
  margin-left: 0.35rem;
  font-size: 0.68rem;
  font-weight: 500;
  color: rgb(255 255 255 / 85%);
  background: rgb(255 255 255 / 18%);
  border-radius: 10px;
`;
