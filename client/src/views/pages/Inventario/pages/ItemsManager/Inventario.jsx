import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  MenuApp as Menu,
} from '../../../../index';
import styled from 'styled-components';
import { useGetProducts } from '../../../../../firebase/products/fbGetProducts.js';
import { filterData } from '../../../../../hooks/search/useSearch';
import { PendingItemsTable } from './components/ProductTable/ProductsTable';

export const Inventory = () => {
  const dispatch = useDispatch();
  const [searchData, setSearchData] = useState('');
  const [currentProducts, setCurrentProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const { products } = useGetProducts();

  useEffect(() => {
    const productsFiltered = filterData(products, searchData);
    setFilteredProducts(productsFiltered);
  }, [products, searchData]);

  const totalProductsCount = products.length

  return (
    <Fragment>
      <Menu searchData={searchData} setSearchData={setSearchData} />
      <Container>
        <PendingItemsTable
          productsArray={currentProducts}
          setCurrentProducts={setCurrentProducts}
          filteredProducts={filteredProducts}
          totalProductsCount={totalProductsCount}
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
