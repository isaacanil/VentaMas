import React from 'react';
import styled from 'styled-components';

import { ProductCardRow } from './ProductCardRow';
import type { ProductRecord } from '@/types/products';

type ProductInventoryCardProps = {
  product: ProductRecord;
  handleUpdateProduct: (product: ProductRecord) => void;
  handleDeleteProduct: (id?: string | null) => void;
};

export const ProductInventoryCard = ({
  product,
  handleUpdateProduct,
  handleDeleteProduct,
}: ProductInventoryCardProps) => {
  return (
    <Container>
      {/* <ProductCardColumn
                product={product}
                handleDeleteProduct={handleDeleteProduct}
                handleUpdateProduct={handleUpdateProduct}
            /> */}
      <ProductCardRow
        product={product}
        handleDeleteProduct={handleDeleteProduct}
        handleUpdateProduct={handleUpdateProduct}
      />
    </Container>
  );
};
const Container = styled.div`
  /* Container for the product card */
`;
