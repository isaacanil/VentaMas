import React, { Fragment, useEffect, useState } from 'react'
import ProductImg from '../../../assets/producto/descarga.jfif'
import Style from './Inventario.module.scss'
//import { useModal } from '../../../hooks/useModal'
import { Navigate } from 'react-router-dom'
import { PlusIcon } from '../../../assets/system/plus/plusIcon'

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
import { async } from '@firebase/util'
import { openModalUpdateProd } from '../../../features/modals/modalSlice'
import { ChangeProductData } from '../../../features/updateProduct/updateProductSlice'
import { handleDeleteProductAlert } from '../../../features/Alert/AlertSlice'
import { IoMdTrash } from 'react-icons/io'
import { MdModeEdit } from 'react-icons/md'

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
                  products.map(({ product, id }, index) => (
                    <li key={index} className={Style.product} onClick={() => console.log(product)} >
                      <div className={Style.product_header}>
                        <Button
                          title="Editar"
                          // variant='contained'
                          bgcolor='editar'
                          onClick={() => handleUpdateProduct(product)}
                        />
                        <Button
                          title={<IoMdTrash />}
                          width='icon32'
                          bgcolor='error'
                          onClick={() => handleDeleteProduct(product.id)}
                        />
                      </div>
                      <div className={Style.product_img_container}>
                        <img className={Style.product_img} src={product.productImageURL} alt="" />
                      </div>
                      <div className={Style.product_name}>
                        <h3>{product.productName}</h3>
                      </div>
                      <div className={Style.group}>
                        <div>
                          <span>costo: {product.cost.unit}</span>
                        </div>
                        <div>
                          <span>stock: {product.stock}</span>
                        </div>
                      </div>
                      <div>
                        <span>Contenido Neto: {product.netContent}</span>
                      </div>
                      <div>
                        <span>Total: {product.price.unit}</span>
                      </div>
                    </li>
                  ))
                )
                :
                (<h2>No Hay Productos</h2>)
            ) : (
              filteredProducts.length > 0 ? (
                filteredProducts.map(({ product, id }, index) => (
                  <li key={index} className={Style.product} onClick={() => console.log(product)} >
                    <div className={Style.product_header}>
                    <Button
                          title="Editar"
                          // variant='contained'
                          bgcolor='editar'
                          onClick={() => handleUpdateProduct(product)}
                        />
                        <Button
                          title={<IoMdTrash />}
                          width='icon32'
                          bgcolor='error'
                          onClick={() => handleDeleteProduct(product.id)}
                        />
                    </div>
                    <div className={Style.product_img_container}>
                      <img className={Style.product_img} src={product.productImageURL} alt="" />
                    </div>
                    <div className={Style.product_name}>
                      <h3>{product.productName}</h3>
                    </div>
                    <div className={Style.group}>
                      <div>
                        <span>costo: {product.cost.unit}</span>
                      </div>
                      <div>
                        <span>stock: {product.stock}</span>
                      </div>
                    </div>
                    <div>
                      <span>Contenido Neto: {product.netContent}</span>
                    </div>
                    <div>
                      <span>Total: {product.price.unit}</span>
                    </div>
                  </li>
                ))

              ) : null
            )
          }
        </ul>
      </div>

    </Fragment>
  )
}

