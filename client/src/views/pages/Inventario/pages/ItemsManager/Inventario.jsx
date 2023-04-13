import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  MenuApp as Menu,
} from '../../../../index';

import { openModalUpdateProd } from '../../../../../features/modals/modalSlice';
import { ChangeProductData } from '../../../../../features/updateProduct/updateProductSlice';
import { handleDeleteProductAlert } from '../../../../../features/Alert/AlertSlice';
import styled from 'styled-components';
import { useSearchFilterX } from '../../../../../hooks/useSearchFilter';
import { PendingItemsTable } from './PendingItemsTable';
import { fbGetProducts } from '../../../../../firebase/products/fbGetProducts.js';
import { Pagination } from '@mui/material';
import { filterData } from '../../../../../hooks/search/useSearch';

export const Inventario = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [searchData, setSearchData] = useState('');
  const [currentProducts, setCurrentProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fbGetProducts(setProducts);
  }, []);

  useEffect(() => {
    const productsFiltered = filterData(products, searchData);
    setFilteredProducts(productsFiltered);
  }, [products, searchData]);

  useEffect(() => {
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    setCurrentProducts(filteredProducts.slice(start, end));
  }, [filteredProducts, currentPage]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // const handleDeleteProduct = (id) => {
  //   dispatch(handleDeleteProductAlert(id));
  // };

  // const handleUpdateProduct = (product) => {
  //   dispatch(openModalUpdateProd());
  //   dispatch(ChangeProductData(product));
  // };

  return (
    <Fragment>
      <Menu searchData={searchData} setSearchData={setSearchData} />
      <Container>
        <PendingItemsTable productsArray={currentProducts} />
        <Footer>
          <Pagination
            count={Math.ceil((filteredProducts.length / productsPerPage))}
            page={currentPage}
            onChange={handlePageChange}
            siblingCount={1}
            boundaryCount={1}
            color="primary"
            style={{ marginTop: '16px' }}
          />
        </Footer>
      </Container>
    </Fragment>
  );
};

{/* <ProductsList>
          {
            products.length > 0 ?
              (
                filteredProducts.map(({ product }, index) => (
                  <ProductInventoryCard
                    key={index}
                    product={product}
                    setFilteredProducts={setFilteredProducts}
                    handleUpdateProduct={handleUpdateProduct}
                    handleDeleteProduct={handleDeleteProduct}
                  />
                ))
              )
              :
              (<h2>No Hay Productos</h2>)
          }
        </ProductsList> */}
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
const ProductsList = styled.div`
  display: grid;
        //grid-template-columns: repeat( auto-fill, minmax(200px, 1fr));     
          
        grid-auto-rows: min-content;
        gap: 0.3em;
        overflow-y: auto;
        
        list-style: none;
        padding: 1em;
        margin: 0;
`
const Footer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 4px;

`