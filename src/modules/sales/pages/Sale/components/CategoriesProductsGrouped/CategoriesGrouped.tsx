import { LazyMotion, domAnimation, m } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

import { Grid } from '@/components/ui/Grid/Grid';
import { CustomProduct } from '@/components/ui/Product/CustomProduct';
import { Product } from '@/components/ui/Product/Product/Product';
import type { ProductRecord } from '@/types/products';

type ProductWrapper = {
  product: ProductRecord;
};

type CategoriesGroupedProps = {
  products: ProductWrapper[];
  viewRowModeRef?: React.MutableRefObject<boolean> | boolean | null;
};

export const CategoriesGrouped = ({
  products,
  viewRowModeRef,
}: CategoriesGroupedProps) => {
  const productsByCategory = products.reduce<Record<string, ProductRecord[]>>(
    (result, { product }) => {
      const category = product.category;
      if (!result[category]) {
        result[category] = [];
      }
      result[category].push(product);
      return result;
    },
    {},
  );
  const containerVariants = {
    hidden: { opacity: 1, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };
  const categoryGroupVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
    },
  };
  return (
    <LazyMotion features={domAnimation}>
      <>
        {Object.keys(productsByCategory)
          .sort((a, b) => (a < b ? 1 : -1))
          .map((category, index) => (
            <CategoryGroup
              key={category}
              variants={categoryGroupVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 1, delay: index * 0.5 }}
            >
              <Title>{category}</Title>
              <Grid
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                padding="bottom"
                columns="4"
                isRow={viewRowModeRef ? true : false}
              >
                {productsByCategory[category].map((product) =>
                  product.custom ? (
                    <CustomProduct
                      key={product?.id ?? product.name}
                      product={product}
                    ></CustomProduct>
                  ) : (
                    <Product key={product?.id ?? product.name} product={product} />
                  ),
                )}
              </Grid>
            </CategoryGroup>
          ))}
      </>
    </LazyMotion>
  );
};

const CategoryGroup = styled(m.div)`
  &:first-child {
    margin-top: 0;
  }

  margin-bottom: 2em;

  span {
    margin: 1em;
    margin-bottom: 2em;
    font-size: 1em;
    font-weight: 550;
    color: var(--gray-8);
  }
`;
const Title = styled.div`
  margin: 1em;
  margin-bottom: 1em;
  font-size: 1em;
  font-weight: 550;
  color: var(--gray-8);
`;
