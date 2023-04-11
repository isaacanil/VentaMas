import React, { Fragment, useEffect } from 'react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
//import component
import {
  MenuApp,
  MenuComponents,
  Cart
} from '../../'
import { SelectCategoryList, SelectCategoryStatus } from '../../../features/category/categorySlicer'
import { selectCategoryGrouped } from '../../../features/setting/settingSlice'
import { QueryByCategory } from '../../../firebase/firebaseconfig'
import { fbGetProducts } from '../../../firebase/products/fbGetProducts'
import { filterData } from '../../../hooks/search/useSearch'
import { searchAndFilter, useSearchFilterX } from '../../../hooks/useSearchFilter'
import { ProductControl } from './ProductControl.jsx'
import { ShoppingItemsCounter } from './ShoppingItemsCounter'
import { motion } from 'framer-motion'
//import { useBilling } from '../../../hooks/useBilling'
import Style from './Venta.module.scss'
import { Transition } from '../../templates/system/Transition'
export const Ventas = () => {

  const [queryByCategoryList, setQueryByCategory] = useState([])
  const categoryStatus = useSelector(SelectCategoryStatus)
  const categoryArrayData = useSelector(SelectCategoryList)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [searchData, setSearchData] = useState('')
  const categoryGrouped = useSelector(selectCategoryGrouped)

  useEffect(() => {
    if (categoryStatus) {
      QueryByCategory(setProducts, categoryArrayData, categoryStatus)
    }
    if (categoryStatus === false) {
      fbGetProducts(setProducts, false, setProductsLoading)
    }
  }, [categoryArrayData, categoryStatus])

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
          setProductsLoading={setProductsLoading}
          productsLoading={productsLoading}
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