import { LazyMotion, domAnimation, m } from 'framer-motion';
import React, {
  Fragment,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectIsRow } from '@/features/setting/settingSlice';
import useScroll from '@/hooks/useScroll';
import ROUTES_NAME from '@/router/routes/routesName';
import { Carrusel } from '@/modules/products/components/Carrusel/Carrusel';
import { CategoriesGrouped } from '@/modules/sales/pages/Sale/components/CategoriesProductsGrouped/CategoriesGrouped';
import { ShoppingItemsCounter } from '@/modules/sales/pages/Sale/components/ShoppingItemsCounter/ShoppingItemsCounter';
import { CenteredText } from '@/components/ui/CentredText';
import { Grid } from '@/components/ui/Grid/Grid';
import Loader from '@/components/ui/loader/Loader';
import { CustomProduct } from '@/components/ui/Product/CustomProduct';
import { Product } from '@/components/ui/Product/Product/Product';
import type { ProductRecord } from '@/types/products';

type ProductWrapper = {
  product: ProductRecord;
};

type ProductControlProps = {
  products: ProductWrapper[];
  isProductGrouped: boolean;
  productsLoading: boolean;
  setProductsLoading?: unknown;
};

export const ProductControl = ({
  products,
  isProductGrouped,
  productsLoading,
}: ProductControlProps) => {
  const navigate = useNavigate();

  const viewRowModeRef = useSelector(selectIsRow) as boolean;
  const loadingMessage = 'Cargando los Productos';
  const productsContainerRef = useRef<HTMLDivElement | null>(null);
  const isScrolled = useScroll(productsContainerRef);
  const productLength = products.length;
  const groupedProducts = useMemo(() => {
    if (!products.length) return {};

    return products.reduce<Record<string, ProductRecord[]>>(
      (result, { product }) => {
        const category = product?.category ?? 'Sin categoría';
        if (!result[category]) {
          result[category] = [];
        }
        result[category].push(product);
        return result;
      },
      {},
    );
  }, [products]);
  const isGroupedEmpty = Object.keys(groupedProducts).length === 0;

  const handleGridScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    e.currentTarget.style.scrollBehavior = 'smooth';
  }, []);

  const handlerProducts = () => {
    const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM;
    navigate(INVENTORY_ITEMS);
  };

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 1, scale: 0 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          delayChildren: 0.3,
          staggerChildren: 0.2,
        },
      },
    }),
    [],
  );
  return (
    <LazyMotion features={domAnimation}>
      <Fragment>
        <Carrusel themeColor={null} />
        <Container>
          <Wrapper ref={productsContainerRef} isScrolled={isScrolled}>
            <Loader
              useRedux={false}
              show={productsLoading}
              message={loadingMessage}
              theme={'light'}
            />
            {productsLoading ? null : isProductGrouped ? (
              <CategoriesGrouped
                products={products}
                viewRowModeRef={viewRowModeRef}
              />
            ) : products.length > 0 ? (
              <Grid
                padding="bottom"
                columns="4"
                isRow={viewRowModeRef ? true : false}
                onScroll={handleGridScroll}
                variants={containerVariants}
              >
                {products.map(({ product }, index) =>
                  product.custom ? (
                    <CustomProduct
                      key={product?.id ? String(product.id) : `product-${index}`}
                      product={product}
                    />
                  ) : (
                    <Product
                      key={product?.id ? String(product.id) : `product-${index}`}
                      product={product}
                    />
                  ),
                )}
              </Grid>
            ) : null}
            {(products.length === 0 || (isProductGrouped && isGroupedEmpty)) &&
            !productsLoading ? (
              <CenteredText
                text="No hay Productos"
                buttonText={'Gestionar Productos'}
                handleAction={handlerProducts}
              />
            ) : null}
          </Wrapper>
          <ShoppingItemsCounter itemLength={productLength} />
        </Container>
      </Fragment>
    </LazyMotion>
  );
};

type ContainerStyleProps = {
  theme: { bg: { color2: string } };
};

const Container = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  background-color: ${(props: ContainerStyleProps) => props.theme.bg.color2};
  border-radius: var(--border-radius-light);
  border-top-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
`;
type WrapperProps = {
  isScrolled: boolean;
};

const Wrapper = styled(m.div)<WrapperProps>`
  height: 100%;
  padding: 0.5em;
  width: 100%;
  position: relative;

  /* padding-top: 1em; */
  overflow-y: scroll;

  ${({ isScrolled }: WrapperProps) =>
    isScrolled
      ? `
    border-top: 1px solid #e0e0e08b;
    box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
    border-radius: var(--border-radius-light);
    
   
    `
      : null}
`;
