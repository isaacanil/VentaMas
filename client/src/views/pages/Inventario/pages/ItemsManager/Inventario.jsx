import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  ButtonGroup,
  MenuApp as Menu,
} from '../../../../index';
import styled from 'styled-components';
import { useGetProducts } from '../../../../../firebase/products/fbGetProducts.js';
import { ProductsTable } from './components/ProductTable/ProductsTable';
import { AdvancedTable, Img, ImgContainer } from '../../../../controlPanel/Table/AdvancedTable';
import { Carrusel } from '../../../../component/Carrusel/Carrusel';
import StockIndicator from '../../../../templates/system/labels/StockIndicator';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import { handleDeleteProductAlert } from '../../../../../features/Alert/AlertSlice';
import { ChangeProductData } from '../../../../../features/updateProduct/updateProductSlice';
import { openModalUpdateProd } from '../../../../../features/modals/modalSlice';
import { icons } from '../../../../../constants/icons/icons';
import { OPERATION_MODES } from '../../../../../constants/modes';

export const Inventory = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const { products } = useGetProducts();

  return (
    <Fragment>
      <Menu searchData={searchTerm} setSearchData={setSearchTerm} />
      <Container>
        <ProductsTable
          products={products}
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
