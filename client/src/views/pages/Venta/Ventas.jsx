import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import {
  MenuApp,
  MenuComponents,
  Cart,
  MultiDisplayControl
} from '../../'

import { selectCategoryGrouped } from '../../../features/setting/settingSlice'
import { useGetProducts } from '../../../firebase/products/fbGetProducts'
import { filterData } from '../../../hooks/search/useSearch'
import { ProductControl } from './ProductControl.jsx'
import { ShoppingItemsCounter } from './ShoppingItemsCounter'
import { Transition } from '../../templates/system/Transition'
import { addProduct, setChange, totalPurchase, totalPurchaseWithoutTaxes, totalShoppingItems, totalTaxes } from '../../../features/cart/cartSlice'
import useBarcodeScanner from '../../../hooks/barcode/usebarcodescanner'
export const Ventas = () => {

  const [searchData, setSearchData] = useState('')
  const categoryGrouped = useSelector(selectCategoryGrouped)

  const { products, loading, setLoading } = useGetProducts()

  console.log(products, 'products-------------------------------')

  const dispatch = useDispatch()

  const checkBarcode = (products, barcode) => {

    if (products.length <= 0) return;
    const product = products.find(({ product }) => product?.barCode === barcode);


    if (product?.product?.barCode === barcode) {
      dispatch(addProduct(product.product))
      dispatch(totalShoppingItems())
      dispatch(totalPurchaseWithoutTaxes())
      dispatch(totalShoppingItems())
      dispatch(totalTaxes())
      dispatch(totalPurchase())
      // dispatch(addPaymentMethodAutoValue())
      dispatch(setChange())
    }
  }
  useBarcodeScanner(products, checkBarcode);

  const productFiltered = filterData(products, searchData)

  return (
    <Transition>
      <Container>
        {/* <MultiDisplayControl></MultiDisplayControl> */}
        <ProductContainer>
          <MenuApp
            borderRadius={'bottom-right'}
            searchData={searchData}
            setSearchData={setSearchData}
          />
          <ProductControl
            setProductsLoading={setLoading}
            productsLoading={loading}
            products={productFiltered}
            isProductGrouped={categoryGrouped}
          />
          <MenuComponents />
          <ShoppingItemsCounter />
        </ProductContainer>
        <Cart></Cart>
      </Container>
    </Transition>



  )
}

const Container = styled.div`
   width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-template-rows: 1fr;
  gap: 1em;
  margin-right: 0;
  padding-right: 0;
  @media(max-width: 800px) {
 
    width: 100vw;
    height: calc(100vh);
    display: grid; 
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    gap: 0;
 
  
}
  `
const ProductContainer = styled.div`
 
    gap: 0;
    margin-right: 0;
    padding-right: 0;
    height: 100%;
    overflow-y: hidden;
    display: grid;
    grid-template-rows: min-content min-content 1fr;
    @media(max-width: 800px) {
   
      position: relative;
      gap: 0;
      margin-right: 0;
      padding-right: 0;
      height: 100%;
      overflow-y: hidden;
      display: grid;
      grid-template-rows: min-content min-content 1fr;
  
    
  
}`