import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {MenuApp,} from '../../../../index';
import styled from 'styled-components';
import { useGetProducts } from '../../../../../firebase/products/fbGetProducts.js';
import { ProductsTable } from './components/ProductTable/ProductsTable';

export const Inventory = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const { products } = useGetProducts();

  return (
    <Container>
      <MenuApp
        displayName='Productos'
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <ProductsTable
        products={products}
        searchTerm={searchTerm}
      />
    </Container>

  );
};

const Container = styled.div`
   display: grid;
    position: relative;
    grid-template-columns: auto;
    background-color: var(--White);
    grid-template-rows:  min-content 1fr;

    height: calc(100vh );
   overflow: hidden;
`
