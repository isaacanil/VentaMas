import React, { useState } from 'react';
import styled from 'styled-components';

import { useGetProducts } from '@/firebase/products/fbGetProducts.js';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type { ProductRecord } from '@/types/products';

import { ProductRecordList } from './components/ProductTable/ProductRecordList';
import { ProductsTable } from './components/ProductTable/ProductsTable';

export const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { products = [] } = useGetProducts();
  const vw = useViewportWidth();
  const productList = products as ProductRecord[];

  return (
    <Container>
      <MenuApp
        displayName="Productos"
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      {vw > 900 ? (
        <ProductsTable products={productList} searchTerm={searchTerm} />
      ) : (
        <ProductRecordList products={productList} searchTerm={searchTerm} />
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: min-content 1fr;
  grid-template-columns: auto;
  height: 100%;
  overflow: hidden;
  background-color: var(--white);
`;

