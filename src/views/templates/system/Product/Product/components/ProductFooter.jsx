import React from 'react';
import styled from 'styled-components';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';

import {
  getAmountBackground,
  getAmountColor,
  getPriceColor,
} from '../utils/stockTheme';
import { useFormatNumber } from '../../../../../../hooks/useFormatNumber';

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
  const stock = productInCart?.stock ?? product.stock;

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
          {stock === 0 ? '-' : useFormatNumber(stock)}
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
