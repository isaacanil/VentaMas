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
import { ProductControl } from './ProductControl.jsx'
import { ShoppingItemsCounter } from './ShoppingItemsCounter'
//import { useBilling } from '../../../hooks/useBilling'
import Style from './Venta.module.scss'
export const Ventas = () => {
  const [queryByCategoryList, setQueryByCategory] = useState([])
    const categoryStatus = useSelector(SelectCategoryStatus)
    const categoryArrayData = useSelector(SelectCategoryList)
    const [productsArray, setProductsArray] = useState([])
    const [products, setProducts] = useState([])
    const [searchData, setSearchData] = useState('')
    const [filteredProducts, setFilteredProducts] = useState([])
  useEffect(() => {
    if (categoryStatus) {
      QueryByCategory(setProducts, categoryArrayData, categoryStatus)
    }
    if (categoryStatus === false) {
      getProducts(setProducts)
    }
  }, [categoryArrayData, categoryStatus])
  useEffect(() => {
    const filtered = products.filter((e) => e.product.productName.toLowerCase().includes(searchData.toLowerCase()));
    setFilteredProducts(filtered)
  }, [searchData, products])
  return (
    <Fragment>
      <main className={Style.AppContainer}>
        {/* <MultiDisplayControl></MultiDisplayControl> */}
        <div className={Style.ProductsContainer}>
          <Menu borderRadius={'bottom-right'} searchData={searchData} setSearchData={setSearchData}></Menu>
          <ProductControl filteredProducts={filteredProducts} products={products} searchData={searchData}></ProductControl>
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