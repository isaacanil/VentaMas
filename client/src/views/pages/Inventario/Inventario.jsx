import React, { Fragment, useEffect, useState } from 'react'
import ProductImg from '../../../assets/producto/descarga.jfif'
import Style from './Inventario.module.scss'
//import { useModal } from '../../../hooks/useModal'
import { Navigate } from 'react-router-dom'
import { PlusIcon } from '../../../assets/system/plus/plusIcon'

import { getProducts, deleteProduct, getProduct } from '../../../firebase/firebaseconfig'
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



export const Inventario = () => {
  const dispatch = useDispatch()
  const [products, setProducts] = useState('')
  const [searchData, setSearchData] = useState('')
  const [product, setProduct] = useState('')

  useEffect(() => {
    //getProducts(setProducts);
    getProducts(setProducts)
  }, []);
const handleDeleteProduct = (e) => {

  const data = e.target.dataset.id;
  deleteProduct(data)
}

const handleUpdateProduct = async (id) => {
  const doc = await getProduct(id)
  console.log(doc.data())
}

const openModal = (id) => {
  dispatch(
    openModalUpdateProd(id)
  )
}
  return (
    <Fragment>
      {/*Modals*/}
     
        {/* <AddProductModal  isOpen={isOpen} closeModal={closeModal}></AddProductModal> */}
    
      <Menu></Menu>
      {/*Interfaz de inventario*/}
      <div className={Style.AppContainer}>
      
        <div>
          <SearchBar searchData={searchData} setSearchData={setSearchData}></SearchBar>
          <AddProductButton></AddProductButton>
          {
            searchData === '' ? (
              <ul className={Style.products}>
              {
                products.length !== 0 ?
                  (
                    products.map(({product, id}, index) => (

                      <li key={index} className={Style.product} >
                        <div className={Style.product_header}>
                          <Button color='editar' onClick={() => openModal(product.id)}>Editar</Button>
                          <Button color='error' onClick={handleDeleteProduct} data-id={id}>X</Button>
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
              }
            </ul>
            ) : <SearchList dataSearch={searchData}></SearchList>
          }
           
          

        </div>
      </div>
    </Fragment>
  )
}

