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
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  border-radius: 14px;
  background: var(--Gray8);
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CounterContent = styled.div`
  display: flex;
  align-items: center;
`;

const CounterSeparator = styled.span`
  font-weight: 600;
  margin: 0 0.25rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
`;

const UnitsText = styled.span`
  margin-left: 0.35rem;
  padding: 0.12rem 0.35rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.68rem;
  font-weight: 500;
`;
