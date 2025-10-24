import React from 'react';
import styled from 'styled-components';

import { useFormatNumber } from '../../../../../../hooks/useFormatNumber';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
import {
  getAmountBackground,
  getAmountColor,
  getPriceColor,
} from '../utils/stockTheme';

// Styled components
const FooterWrapper = styled.div`
  padding: 0 0.4em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  pointer-events: none;
  transition: 0.8s border-radius ease-in-out;
  border-top-left-radius: ${({ imageHiddenRef }) =>
    imageHiddenRef === false ? '10px' : '0'};
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
`;

const AmountToBuy = styled.div`
  padding: 0 0.4em;
  height: 1.6em;
  margin-left: 1.6em;
  width: min-content;
  border-radius: 4px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  transition: background-color 0.4s ease-in-out, color 0.4s ease-in-out;

  background-color: ${(props) => getAmountBackground(props)};
  color: ${(props) => getAmountColor(props)};

  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const Price = styled.div`
  display: block;
  height: 100%;
  font-weight: 550;
  font-size: 16px;
  transition: color 0.4s ease-in-out;

  color: ${(props) => getPriceColor(props)};
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
  const stockValue =
    typeof productInCart?.stock === 'number'
      ? productInCart.stock
      : typeof product?.displayStock === 'number'
        ? product.displayStock
        : product?.stock;
  const formattedStock =
    typeof stockValue === 'number' && !Number.isNaN(stockValue)
      ? useFormatNumber(stockValue)
      : '-';

  return (
    <FooterWrapper imageHiddenRef={productState.imageHidden}>
      <Group>
        <AmountToBuy
          isDisabled={isDisabled}
          isOutOfStock={isOutOfStock}
          isCriticalStock={isCriticalStock}
          isLowStock={isLowStock}
          isSelected={isProductInCart}
          hasStrictStock={product.restrictSaleWithoutStock}
        >
          {isProductInCart && `${useFormatNumber(productInCart.amountToBuy)} / `}
          {stockValue === 0 ? '-' : formattedStock}
        </AmountToBuy>
      </Group>

      <Group>
        {product.weightDetail?.isSoldByWeight ? (
          <Price
            isDisabled={isDisabled}
            isOutOfStock={isOutOfStock}
            isCriticalStock={isCriticalStock}
            isLowStock={isLowStock}
            isSelected={isProductInCart}
            hasStrictStock={product.restrictSaleWithoutStock}
          >
            {useFormatPrice(price)} / {product.weightDetail.weightUnit}
          </Price>
        ) : (
          <Price
            isDisabled={isDisabled}
            isOutOfStock={isOutOfStock}
            isCriticalStock={isCriticalStock}
            isLowStock={isLowStock}
            isSelected={isProductInCart}
            hasStrictStock={product.restrictSaleWithoutStock}
          >
            {useFormatPrice(price)}
          </Price>
        )}
      </Group>
    </FooterWrapper>
  );
};
