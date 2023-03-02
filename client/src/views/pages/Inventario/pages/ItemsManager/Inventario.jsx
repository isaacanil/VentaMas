import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  MenuApp as Menu,
} from '../../../../index'

import { openModalUpdateProd } from '../../../../../features/modals/modalSlice'
import { ChangeProductData } from '../../../../../features/updateProduct/updateProductSlice'
import { handleDeleteProductAlert } from '../../../../../features/Alert/AlertSlice'
import styled from 'styled-components'
import { useSearchFilterX } from '../../../../../hooks/useSearchFilter'
import { PaginationBar } from './PaginationBar/PaginationBar'
import { PendingItemsTable } from './PendingItemsTable'
import { fbGetProducts } from '../../../../../firebase/products/fbGetProducts.js'

export const Inventario = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [searchData, setSearchData] = useState('');
  const [currentProducts, setCurrentProducts] = useState([]);
  const productsFiltered = useSearchFilterX(products, searchData, 'product.productName');

  useEffect(() => {
    fbGetProducts(setProducts);
  }, []);

  useEffect(() => {
    setCurrentProducts(productsFiltered.slice(0, 10));
  }, [productsFiltered]);

  const handleDeleteProduct = (id) => {
    dispatch(handleDeleteProductAlert(id));
  };

  const handleUpdateProduct = (product) => {
    dispatch(openModalUpdateProd());
    dispatch(ChangeProductData(product));
  };
  
  return (
    <Fragment>
      <Menu searchData={searchData} setSearchData={setSearchData} />
      <Container>
        <PendingItemsTable productsArray={currentProducts} />
        <PaginationBar products={productsFiltered} setFilteredProducts={setCurrentProducts} productsPerPage={10} />
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