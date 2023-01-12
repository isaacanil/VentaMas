import React, { Fragment, useEffect, useState } from 'react'
import Style from './Inventario.module.scss'
//import { useModal } from '../../../hooks/useModal'
import noImg from '../../../assets/producto/noimg.png'
import { getProducts, deleteProduct, getProduct } from '../../../firebase/firebaseconfig.js'
import { useDispatch } from 'react-redux'
import {
  MenuApp as Menu,
  MultiDisplayControl,
  Button,
  AddProductButton,
  ControlSearchProduct as SearchBar,
  SearchList
} from '../../index'

import { openModalUpdateProd } from '../../../features/modals/modalSlice'
import { ChangeProductData } from '../../../features/updateProduct/updateProductSlice'
import { handleDeleteProductAlert } from '../../../features/Alert/AlertSlice'
import { IoMdTrash } from 'react-icons/io'
import { ProductInventoryCard } from './ProductCard'

export const Inventario = () => {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [searchData, setSearchData] = useState('')
  const [product, setProduct] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  useEffect(() => {
    //getProducts(setProducts);
    getProducts(setProducts)
  }, []);
  const handleDeleteProduct = (id) => {
    dispatch(
      handleDeleteProductAlert(id)
    )
  }

  useEffect(() => {
    const filtered = products.filter((e) => e.product.productName.toLowerCase().includes(searchData.toLowerCase()));
    setFilteredProducts(filtered)
  }, [searchData, products])

  const handleUpdateProduct = (product) => {
    console.log(product)

    dispatch(
      openModalUpdateProd(),
    )
    dispatch(
      ChangeProductData(product)
    )

  }
  return (
    <Fragment>
      <Menu></Menu>
      <div className={Style.AppContainer}>

        <SearchBar searchData={searchData} setSearchData={setSearchData}></SearchBar>

        <ul className={Style.products}>
          {
            searchData === '' ? (
              products.length !== 0 ?
                (
                  products.map(({ product }, index) => (
                    <ProductInventoryCard key={index} product={product} handleUpdateProduct={handleUpdateProduct} handleDeleteProduct={handleDeleteProduct} />
                  ))
                )
                :
                (<h2>No Hay Productos</h2>)
            ) : (
              filteredProducts.length > 0 ? (
                filteredProducts.map(({ product, id }, index) => (
                  <ProductInventoryCard key={index} product={product} handleUpdateProduct={handleUpdateProduct} handleDeleteProduct={handleDeleteProduct} />
                ))

              ) : null
            )
          }
        </ul>
      </div>

    </Fragment>
  )
}

