import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  MenuApp,
} from '../../../../index';
import styled from 'styled-components';
import { useGetProducts } from '../../../../../firebase/products/fbGetProducts.js';
import { ProductsTable } from './components/ProductTable/ProductsTable';


export const Inventory = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const { products } = useGetProducts();

  return (
    <Fragment>
      <MenuApp
      displayName='Productos'
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <Container>
        <ProductsTable
          products={products}
          searchTerm={searchTerm}
        />
      </Container>
    </Fragment>
  );
};

const Container = styled.div`
   display: grid;
    position: relative;
    grid-template-columns: auto;
    background-color: var(--White);
    grid-template-rows: 1fr min-content;
    max-height: calc(100vh - 2.75em);
    height: calc(100vh - 2.75em);
   overflow: hidden;
`
