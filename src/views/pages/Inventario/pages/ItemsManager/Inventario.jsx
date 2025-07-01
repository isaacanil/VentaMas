import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {MenuApp,} from '../../../../index';
import styled from 'styled-components';
import { useGetProducts } from '../../../../../firebase/products/fbGetProducts.js';
import { ProductsTable } from './components/ProductTable/ProductsTable';
import { ProductRecordList } from './components/ProductTable/ProductRecordList';
import useViewportWidth from '../../../../../hooks/windows/useViewportWidth';

export const Inventory = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const { products } = useGetProducts();
  const vw = useViewportWidth();

  return (
    <Container>
      <MenuApp
        displayName='Productos'
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      {vw > 900 ? (
        <ProductsTable
          products={products}
          searchTerm={searchTerm}
        />
      ) : (
        <ProductRecordList
          products={products}
          searchTerm={searchTerm}
        />
      )}
    </Container>

  );
};

const Container = styled.div`
   display: grid;
    position: relative;
    grid-template-columns: auto;
    background-color: var(--White);
    grid-template-rows:  min-content 1fr;

    height: 100%;
   overflow: hidden;
`
