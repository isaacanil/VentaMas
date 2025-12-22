import React from 'react';
import styled from 'styled-components';


import { formatNumber } from '@/utils/format';
import { formatPrice } from '@/utils/format';

import {
  getAmountBackground,
  getAmountColor,
  getPriceColor,
} from '../utils/stockTheme';

// Styled components
const FooterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 0.4em;
  pointer-events: none;
  border-top-left-radius: ${({ $imageHiddenRef }) =>
    $imageHiddenRef === false ? '10px' : '0'};
  transition: 0.8s border-radius ease-in-out;
`;

const Group = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;

const AmountToBuy = styled.div`
  display: flex;
  align-items: center;
  width: min-content;
  height: 1.6em;
  padding: 0 0.4em;
  margin-left: 1.6em;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => getAmountColor(props)};
  letter-spacing: 0.2px;
  white-space: nowrap;
  background-color: ${(props) => getAmountBackground(props)};
  border-radius: 4px;
  transition:
    background-color 0.4s ease-in-out,
    color 0.4s ease-in-out;
`;

const Price = styled.div`
  display: block;
  height: 100%;
  font-size: 16px;
  font-weight: 550;
  color: ${(props) => getPriceColor(props)};
  transition: color 0.4s ease-in-out;
`;

/**
 * Muestra la sección inferior de cantidad y precio de un producto
 * @param {object} props
 * @param {{ imageHidden: boolean }} props.productState
 * @param {{ amountToBuy?: number, stock?: number }} props.productInCart
 * @param {{ stock: number, weightDetail?: { isSoldByWeight: boolean, weightUnit: string }, restrictSaleWithoutStock?: boolean }} props.product
 * @param {number} props.price
 * @param {boolean} props.isProductInCart
 * @param {boolean} props.isLowStock
 * @param {boolean} props.isOutOfStock
 */
export const ProductFooter = ({
  productState,
  productInCart,
  product,
  price,
  isProductInCart,
  isLowStock,
  isCriticalStock,
  isOutOfStock,
}) => {
  const isDisabled = isOutOfStock || isCriticalStock || isLowStock;
  const hasSelectedProductStock = Boolean(productInCart?.productStockId);
  const stockValue = hasSelectedProductStock
    ? typeof productInCart?.stock === 'number'
      ? productInCart.stock
      : typeof product?.stock === 'number'
        ? product.stock
        : undefined
    : typeof product?.stock === 'number'
      ? product.stock
      : typeof productInCart?.stock === 'number'
        ? productInCart.stock
        : undefined;
  const hasValidStock =
    typeof stockValue === 'number' && !Number.isNaN(stockValue);
  const formattedStock =
    hasValidStock && stockValue !== 0 ? formatNumber(stockValue) : '-';

  return (
    <FooterWrapper $imageHiddenRef={productState.imageHidden}>
      <Group>
        <AmountToBuy
          $isDisabled={isDisabled}
          $isOutOfStock={isOutOfStock}
          $isCriticalStock={isCriticalStock}
          $isLowStock={isLowStock}
          $isSelected={isProductInCart}
          $hasStrictStock={product.restrictSaleWithoutStock}
        >
          {isProductInCart &&
            `${formatNumber(productInCart.amountToBuy)} / `}
          {formattedStock}

        </AmountToBuy>
      </Group>

      <Group>
        {product.weightDetail?.isSoldByWeight ? (
          <Price
            $isDisabled={isDisabled}
            $isOutOfStock={isOutOfStock}
            $isCriticalStock={isCriticalStock}
            $isLowStock={isLowStock}
            $isSelected={isProductInCart}
            $hasStrictStock={product.restrictSaleWithoutStock}
          >
            {formatPrice(price)} / {product.weightDetail.weightUnit}
          </Price>
        ) : (
          <Price
            $isDisabled={isDisabled}
            $isOutOfStock={isOutOfStock}
            $isCriticalStock={isCriticalStock}
            $isLowStock={isLowStock}
            $isSelected={isProductInCart}
            $hasStrictStock={product.restrictSaleWithoutStock}
          >
            {formatPrice(price)}
          </Price>
        )}
      </Group>
    </FooterWrapper>
  );
};
