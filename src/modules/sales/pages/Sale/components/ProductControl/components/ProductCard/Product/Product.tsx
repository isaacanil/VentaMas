import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Fragment, memo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  SelectSettingCart,
  selectCartTaxationEnabled,
} from '@/features/cart/cartSlice';

import ProductImage from './components/ImagenBlock';
import { ProductFooter } from './components/ProductFooter';
import ProductHeader from './components/ProductHeader';
import { StockWarning } from './components/StockWarning';
import { useProductHandling } from './hooks/useProductHandling';
import { getContainerOutline } from './utils/stockTheme';
import type { ProductRecord } from '@/types/products';
import type { ProductStockThemeProps } from './utils/stockTheme';

type ContainerProps = ProductStockThemeProps & {
  $imageHiddenRef?: boolean;
  $isDisabled?: boolean;
};

const Container = styled(m.li)<ContainerProps>`
  position: relative;
  display: flex;
  gap: 6px;
  width: 100%;
  height: ${({ $imageHiddenRef }) => ($imageHiddenRef ? '60px' : '80px')};
  overflow: hidden;

  /* El outline sólo depende de si está seleccionado o no */
  outline: ${(props) => getContainerOutline(props)};
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: 2px 2px 10px 2px rgb(0 0 0 / 2%);
  transition: outline 0.4s ease-in-out;

  &:hover {
    img {
      filter: brightness(105%);
      transition: 0.3s filter ease-in-out;
    }
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-rows: 1fr min-content;
  width: 100%;
`;

type ProductProps = {
  product: ProductRecord;
};

const ProductComponent = memo(({ product }: ProductProps) => {
  const taxationEnabled = useSelector(selectCartTaxationEnabled);
  const settingsCart = (useSelector(SelectSettingCart) || {}) as any;
  const alertsEnabled = !!settingsCart.billing?.stockAlertsEnabled;

  const {
    productState,
    setProductState,
    isProductInCart,
    productInCart,
    isLowStock,
    isCriticalStock,
    isOutOfStock,
    price,
    handleGetThisProduct,
    deleteProductFromCart,
    isFirebaseLoading, // Agregar esta línea
  } = useProductHandling(product, taxationEnabled);

  const isDisabled = isOutOfStock || isCriticalStock || isLowStock;

  return (
    <LazyMotion features={domAnimation}>
      <Fragment>
        <Container
          onClick={handleGetThisProduct}
          $imageHiddenRef={productState.imageHidden}
          $isSelected={isProductInCart}
          $isDisabled={isDisabled}
          $isOutOfStock={isOutOfStock}
          $isLowStock={isLowStock}
          $isCriticalStock={isCriticalStock}
          $hasStrictStock={product?.restrictSaleWithoutStock}
        >
          <ProductImage
            productState={productState}
            setProductState={setProductState}
            product={product}
            isFirebaseLoading={isFirebaseLoading}
          />

          <StockWarning
            message="Sin stock"
            position="bottom"
            isSelected={isProductInCart}
            show={alertsEnabled && isOutOfStock}
            variant="outOfStock"
          />

          <StockWarning
            message="Stock crítico"
            position="bottom"
            isSelected={isProductInCart}
            show={alertsEnabled && !isOutOfStock && isCriticalStock}
            variant="criticalStock"
          />

          <StockWarning
            message="Stock bajo"
            position="bottom"
            isSelected={isProductInCart}
            show={
              alertsEnabled && isLowStock && !isOutOfStock && !isCriticalStock
            }
            variant="lowStock"
          />

          <Content>
            <ProductHeader
              product={product}
              isProductInCart={isProductInCart}
              deleteProductFromCart={deleteProductFromCart}
            />
            <ProductFooter
              productState={productState}
              productInCart={productInCart}
              product={product}
              price={price}
              isProductInCart={isProductInCart}
              isLowStock={isLowStock}
              isCriticalStock={isCriticalStock}
              isOutOfStock={isOutOfStock}
            />
          </Content>
        </Container>
      </Fragment>
    </LazyMotion>
  );
});

ProductComponent.displayName = 'Product';
export const Product = ProductComponent;
