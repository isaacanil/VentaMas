import React, { Fragment, useEffect } from 'react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
//import component
import {
  MenuApp as Menu,
  MenuComponents,
  Cart
} from '../../'
import { SelectCategoryList, SelectCategoryStatus } from '../../../features/category/categorySlicer'
import { getProducts, QueryByCategory } from '../../../firebase/firebaseconfig'
import { useSearchFilterX } from '../../../hooks/useSearchFilter'
import { ProductControl } from './ProductControl.jsx'
import { ShoppingItemsCounter } from './ShoppingItemsCounter'
//import { useBilling } from '../../../hooks/useBilling'
import Style from './Venta.module.scss'
export const Ventas = () => {
  const [queryByCategoryList, setQueryByCategory] = useState([])
  const categoryStatus = useSelector(SelectCategoryStatus)
  const categoryArrayData = useSelector(SelectCategoryList)
  const [products, setProducts] = useState([])
  const [searchData, setSearchData] = useState('')
  useEffect(() => {
    if (categoryStatus) {
      QueryByCategory(setProducts, categoryArrayData, categoryStatus)
    }
    if (categoryStatus === false) {
      getProducts(setProducts)
    }
  }, [categoryArrayData, categoryStatus])

  const productFiltered = useSearchFilterX(products, searchData, 'product.productName')
  return (
    <Fragment>
      <main className={Style.AppContainer}>
        {/* <MultiDisplayControl></MultiDisplayControl> */}
        <div className={Style.ProductsContainer}>
          <Menu borderRadius={'bottom-right'} searchData={searchData} setSearchData={setSearchData}></Menu>
          <ProductControl products={productFiltered}></ProductControl>
          <MenuComponents></MenuComponents>
          <ShoppingItemsCounter></ShoppingItemsCounter>
        </div>
        <Cart></Cart>
      </main>

    </Fragment>
  )
}
const Container = styled.div`
  
`