/* eslint-disable no-undef */
import React, { Fragment, useState, useEffect, useRef } from 'react'
import Style from './Products.module.scss'
import { Button, ErrorMessage, PlusIconButton } from '../../../index'
import { UploadProdImg, UploadProdData, getCat } from '../../../../firebase/firebaseconfig.js'
import { Modal } from '../../../index';
import { Navigate } from 'react-router-dom'
import { Input, InputGroup } from '../../../templates/system/Inputs/InputV2';
import { nanoid } from 'nanoid'
import noimg from '../../../../assets/producto/noimg.png'
//template
import { useSelector, useDispatch } from 'react-redux';
import { getTaxes } from '../../../../firebase/firebaseconfig.js';
import styled from 'styled-components';
import { separator } from '../../../../hooks/separator';
import { selectProduct, priceTotal } from '../../../../features/Firestore/products/addProductSlice';
import { UploadImg } from '../../UploadImg';
import { clearImg, SaveImg } from '../../../../features/uploadImg/uploadImageSlice';
import { selectImg } from '../../../../features/uploadImg/uploadImageSlice';
import { firstLetter } from '../../../../hooks/firstLetter';
import { parseToString } from '../../../../hooks/parseToString';
export const ProductModal = ({ title, btnSubmitName, closeModal, isOpen }) => {
   const dispatch = useDispatch();
   const ImgSelected = useSelector(selectImg);
   const [imgController, setImgController] = useState(false)
   const [taxesList, setTaxesList] = useState([])
   const [catList, setCatList] = useState([])
   useEffect(() => {
      getTaxes(setTaxesList)
      getCat(setCatList)
   }, [])
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
         total: 1,
      },
      type: '',
      productImageURL: 'NoImage/NoImage.png',
      netContent: '',
      category: '',
      size: '',
      order: 1,
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
   //img
   const handleImgController = (e) => {
      e.preventDefault()
      setImgController(!imgController)
   }
   const HandleSaveImg = (img) => {
      dispatch(SaveImg(img))
   }
   useEffect(() => {
      setProduct({
         ...product,
         productImageURL: ImgSelected
      })
   }, [ImgSelected])
   const handleSubmit = async () => {
      UploadProdData(product)
      setProduct({
         productName: '',
         price: {
            unit: undefined,
            total: undefined,
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
         size: '',
         tax: {
            ref: '',
            value: undefined,
            unit: '',
            total: ''
         },
         stock: '',
         id: '',

      })
      dispatch(clearImg())
   }
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
   //console.log(product)
   return (
      <Modal
         nameRef={title}
         isOpen={isOpen}
         close={closeModal}
         btnSubmitName={btnSubmitName}
         handleSubmit={handleSubmit}
         subModal={<UploadImg isOpen={imgController} setIsOpen={setImgController} fnAddImg={HandleSaveImg} />}
      >
         <Container>
            <Group column='2'>
               <Input
                  required
                  title={'Nombre del producto'}
                  type="text"
                  onChange={(e) => setProduct({
                     ...product,
                     productName: e.target.value
                  })} />
            </Group>
            <Group orientation='vertical'>
               <Input
                  title={'Tipo de Producto'}
                  type="text"
                  
                  onChange={(e) => setProduct({
                     ...product,
                     type: firstLetter(e.target.value)
                  })}
               />
               <Input
                  title={'Stock'}
                  type="number"
                  placeholder='stock'
                  onChange={(e) => setProduct({
                     ...product,
                     stock: e.target.value
                  })} />
            </Group>
            <Group orientation='vertical'>
               <Input
                  title={'Contenido neto'}
                  type="text"
                  placeholder='Contenido Neto:'
                  onChange={(e) => setProduct({
                     ...product,
                     netContent: e.target.value
                  })} />
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
                           <option
                              key={index}
                              value={item.category.name}
                           >
                              {item.category.name}
                           </option>
                        ))
                     ) : null
                  }
               </select>
            </Group>
            <Group>
               <img src={product.productImageURL} alt="" onError={({ currentTarget }) => {
                          currentTarget.onerror = null;
                          currentTarget.src = noimg;
                          currentTarget.style.objectFit = 'contain'
                        }}/>
               <Button
                  title='Agregar Imagen'
                  onClick={handleImgController}
               />
            </Group>
            <Group orientation='vertical'>
               <Input
                  title={'Tamaño'}
                  type="text"
                  placeholder='Contenido Neto:'
                  text="capitalize"
                  onChange={(e) => setProduct({
                     ...product,
                     size: parseToString(firstLetter(e.target.value))
                  })}
               />
               <Input
                  title={'Costo'}
                  type="number"
                  onChange={(e) => setProduct({
                     ...product,
                     cost: {
                        unit: Number(e.target.value),
                        total: Number(e.target.value)
                     }
                  })} />
            </Group>
            <Group orientation='vertical'>
               <Input
                  size='small'
                  title={'Order'}
               />
               <select id="" onChange={(e) => setProduct({
                  ...product,
                  tax: JSON.parse(e.target.value)
               })}>
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
                  type="number"
                  title={'Precio + ITBIS'}
                  value={product.price.total !== undefined ? product.price.total : ''}
                  readOnly
                  placeholder='Precio de Venta' />
            </Group>


         </Container>
      </Modal>
   )
}


const Container = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 2em 1em 1em;
    background-color: #fff;
    height: 100%;
    width: 100%;
    gap: 1.7em;
    align-content: flex-start;
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }    
`
const Group = styled.div`

    select{
         padding: 0.4em;
         border-radius: 8px;
         border: none;
         outline: 1px solid rgb(145, 145, 145);
      }
    &:nth-child(1){
        grid-column: 2 span;
    }
    &:nth-child(2){
        grid-column: 1 / 3;
    }
    &:nth-child(3){ 
        grid-column: 1 / 3;
    }
    &:nth-child(4){
        background-color: #cce1e9;
        padding: 6px;
        border-radius: 8px;
        border: 1px solid rgba(2, 2, 2, 0.100);
        img{
            width: 100%;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
            box-shadow: 0 0 10px 0 rgba(0,0,0,0.5);
        }
        grid-column: 3 / 4;
        grid-row: 1 / 4;
        display: grid;
        gap: 1em;
       // justify-content: center;
        justify-items: center;
    }
    &:nth-child(5){
        grid-column: 1 / 4;
    }
    &:nth-child(6){
       grid-column: 1 / 4;
   }
    ${(props) => {
      switch (props.orientation) {
         case 'vertical':
            return `
                    display: flex;
                    gap: 1em;
                `

         case 'horizontal':
            return `
                    display: grid
                `
         default:
            break;
      }
   }}
  
`