/* eslint-disable no-undef */
import React, { Fragment, useState, useEffect } from 'react'
import Style from './Products.module.scss'
import { Button, ErrorMessage, PlusIconButton } from '../../../index'
import { UploadProdImg, UploadProdData, getCat } from '../../../../firebase/firebaseconfig.js'
import { Modal } from '../../../index';
import { Navigate } from 'react-router-dom'
import { Input, InputGroup } from '../../../templates/system/Inputs/InputV2';
import { nanoid } from 'nanoid'
//template
import { useSelector, useDispatch } from 'react-redux';
import { getTaxes } from '../../../../firebase/firebaseconfig.js';
import styled from 'styled-components';
import { separator } from '../../../../hooks/separator';
import { addProductData } from '../../../../features/Firestore/products/addProductSlice';
import { selectProduct, priceTotal } from '../../../../features/Firestore/products/addProductSlice';

export const ProductModal = ({ title, btnSubmitName, closeModal, isOpen }) => {

   const [taxesList, setTaxesList] = useState([])
   const [catList, setCatList] = useState([])

   useEffect(() => {
      getTaxes(setTaxesList)
      getCat(setCatList)
   }, [])

   //declarando las variables
   const [productImage, setProductImage] = useState(null)
   const [product, setProduct] = useState({
      productName: '',
      price: {

      },
      cost: {
         unit: undefined,
         total: undefined,
      },
      amountToBuy: {
         unit: 1,
         amount: 1,
      },
      type: '',
      productImageURL: '',
      netContent: '',
      category: '',
      tax: {
         ref: '',
         value: undefined,
         unit: '',
         total: ''
      },
      stock: '',
      id: '',

   })
   const [errorMassage, setErrorMassage] = useState('')
   const BtnFiles = (e) => {
      e.preventDefault()
      document.getElementById('file').click()
   }
   const handleSubmit = async () => {
      if (productImage !== null) {
         console.log('img')
         const extentionsFile = /.jpg| .jpeg| .webp| .git|/i;
         if (!extentionsFile.exec(productImage.name)) {
            setErrorMassage('Solo se permiten imagenes')
         }
         else {
            UploadProdImg(productImage)
               .then(async (url) => {
                  setProduct({
                     ...product,
                     productImageURL: url,
                  })         
               })   
         }
      }
      else {
         UploadProdData(product)
      }
   }
   useEffect(()=>{
      product.productImageURL !== '' ? UploadProdData(product) : null
   }, [product.productImageURL])
   useEffect(() => {
      if (product.cost.unit !== undefined && product.tax.value !== undefined) {
         setProduct({
            ...product,
            price: {
               unit: product.cost.unit * product.tax.value + product.cost.unit,
               total: product.cost.unit * product.tax.value + product.cost.unit,
            },
            id: nanoid(6)
         })
      }
   }, [product.cost, product.tax])

   console.log(product)

   return (
      <Modal nameRef={title} btnSubmitName={btnSubmitName} isOpen={isOpen} close={closeModal} handleSubmit={handleSubmit} >
         <div className={Style.Container} >
            <form className={Style.Form}>
               <div className={Style.Group}>
                  <Input
                     title='Nombre del producto'
                     required
                     type="text"
                     onChange={(e) => setProduct({
                        ...product,
                        productName: e.target.value
                     })}
                  />
                  <input
                     className={Style.Input}
                     type="file" id='file'
                     onChange={(e) => setProductImage(e.target.files[0])}
                  />
                  <Button
                     title='Agregar Imagen'
                     onClick={BtnFiles}
                  />
               </div>
               <div className={Style.Group}>
                  <Input
                     title={'Tipo de Producto'}
                     type="text"
                     onChange={(e) => setProduct({
                        ...product,
                        type: e.target.value
                     })}

                  />
                  <Input
                     title={'Cantidad'}
                     type="number"
                     placeholder='stock'
                     onChange={(e) => setProduct({
                        ...product,
                        stock: e.target.value
                     })}
                  />
                  <select
                     name="select"
                     id=""
                     onChange={(e) => setProduct({
                        ...product,
                        category: e.target.value
                     })}>
                     <option value="">Categoría</option>
                     {
                        catList.length > 0 ? (
                           catList.map((item, index) => (
                              <option value={item.name} key={index}>{item.category.name}</option>
                           ))
                        ) : null
                     }
                  </select>

               </div>
               <div className={Style.Group}>

                  <Input
                     title={'Contenido Neto'}
                     type="text"
                     placeholder='Contenido Neto:'
                     onChange={(e) => setProduct({
                        ...product,
                        netContent: e.target.value
                     })}
                  />
                  <Input
                     title={'Tamaño'}
                     type="text"
                     placeholder='Contenido Neto:'
                     onChange={(e) => setProduct({
                        ...product,
                        netContent: e.target.value
                     })}
                  />
                  <Input
                     type="number"
                     title={'Costo'}
                     placeholder='Costo:'
                     onChange={(e) => setProduct({
                        ...product,
                        cost: {
                           unit: Number(e.target.value),
                           total: Number(e.target.value)
                        }
                     })}
                  />


               </div>
               <div className={Style.Group}>
                  <select id="" onChange={(e) => {
                     const { ref, unit, value, total } = JSON.parse(e.target.value)
                     setProduct({
                        ...product,
                        tax: {
                           ref: ref,
                           unit: unit,
                           value: Number(value),
                           total: total
                        }
                     })
                  }}>
                     <option value="">Impuesto</option>
                     {
                        taxesList.length > 0 ? (
                           taxesList.map(({ tax }, index) => (
                              <option
                                 value={JSON.stringify(tax)}
                                 key={index}
                              >
                                 ITBIS {tax.ref}
                              </option>
                           ))
                        ) : null
                     }
                  </select>

                  <Input
                     title={'Costo + Impuesto'}
                     type="text"

                     value={
                        product.price.total !== undefined ? product.price.total : ''
                     }
                     readOnly

                  />
               </div>
               {errorMassage}
            </form>


         </div>
      </Modal>
   )
}


const Characteristic = styled.div`
   padding: 1em;
   display: grid;
   gap: 1em;
`
const CharacteristicHead = styled.div`
   h2{
      margin: 0.6em 0;
   }
`
const Bar = styled.div`
   display: flex;
   gap: 1em;
`
const CharacteristicBody = styled.div`
   
   max-height: 10em;
   height: 10em;
   width: 100%;
   background-color: #e9e9e9;
   overflow-y: scroll;
`