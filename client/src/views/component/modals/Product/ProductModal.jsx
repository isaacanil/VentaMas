/* eslint-disable no-undef */
import React, { Fragment, useState, useEffect } from 'react'
import Style from './Products.module.scss'
import { Button, ErrorMessage, PlusIconButton } from '../../../index'
import { UploadProdImg, UploadProdData, getCat } from '../../../../firebase/firebaseconfig.js'
import { Modal } from '../../../index';
import { Navigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
//template
import { useSelector, useDispatch } from 'react-redux';
import { getTaxes } from '../../../../firebase/firebaseconfig.js';
import styled from 'styled-components';
export const ProductModal = ({ title, btnSubmitName, closeModal, isOpen }) => {
   const [taxesList, setTaxesList] = useState([])
   const [taxRef, setTaxRef] = useState('')
   const [catList, setCatList] = useState([])
   useEffect(() => {
      getTaxes(setTaxesList)
      getCat(setCatList)
   }, [])
   const dispatch = useDispatch()
   //declarando las variables
   const [productName, setProductName] = useState('')
   const [cost, setCost] = useState(null)
   const [productImage, setProductImage] = useState(null)
   // console.log(productImage)
   const [category, setCategory] = useState(null)
   const [stock, setStock] = useState(null)
   const [netContent, setNetContent] = useState('')
   const [errorMassage, setErrorMassage] = useState('')
   //pasando los datos a un objeto
   //logica para cambiar la apariencia del btn para subir la imagen
   const BtnFiles = (e) => {
      e.preventDefault()
      document.getElementById('file').click()
   }
   //console.log(productImage)
   const handleSubmitAddProducts = async () => {
      const extentionsFile = /.jpg|.jpeg|.png| .webp| .gif/i;
      if (!extentionsFile.exec(productImage.name)) {
         console.log(productImage.name)
         setErrorMassage(<ErrorMessage text='Error de archivo (no es una imagen valida)'></ErrorMessage>)
      } else {
         setErrorMassage('')
         //referencia
         UploadProdImg(productImage).then((url) => UploadProdData(
            url,
            productName,
            cost,
            taxRef,
            stock,
            category,
            netContent,
         ))
         try {
            return <Navigate to={'/app/'}></Navigate>
         }
         catch (e) {
            console.error("Error adding document: ", e)
         }
      }

   }
   return (
      <Fragment>
      
            <Modal nameRef={title} btnSubmitName={btnSubmitName} isOpen={isOpen} close={closeModal} handleSubmit={handleSubmitAddProducts}>
               <div className={Style.Container} >
                  <form className={Style.Form}>
                     <div className={Style.Group}>
                        <input
                           required
                           type="text"
                           placeholder='Nombre del Producto:'
                           className={Style.Input}
                           onChange={(e) => setProductName(e.target.value)} />
                        <input className={Style.Input} type="file" id='file' onChange={(e) => setProductImage(e.target.files[0])} />
                        <Button onClick={BtnFiles}>Agregar Imagen</Button>
                     </div>
                     <div className={Style.Group}>
                        <input
                           type="number"
                           className={Style.Input}
                           placeholder='Costo:'
                           onChange={(e) => setCost(e.target.value)} />
                        <select name="select" id="" onChange={(e) => setCategory(e.target.value)}>
                           <option value="">Categoría</option>
                           {
                              catList.length > 0 ? (
                                 catList.map((item , index)=>(
                                    <option value="" key={index}>{item.category.name}</option>
                                 ))
                              ) : null
                           }
                        </select>
                        <select id="" onChange={(e) => setTaxRef(e.target.value)}>
                           <option value="">Impuesto</option>
                           {
                              taxesList.length > 0 ? (
                                 taxesList.map(({ tax }, index) => (
                                    <option value={JSON.stringify(tax)} key={index}>ITBIS {tax.ref}</option>
                                 ))
                              ) : null
                           }
                        </select>
                     </div>
                     <div className={Style.Group}>
                        <input className={Style.Input}
                           type="number"
                           placeholder='stock'
                           onChange={(e) => setStock(e.target.value)} />
                        <input
                           className={Style.Input}
                           type="text"
                           placeholder='Contenido Neto:'
                           onChange={(e) => setNetContent(e.target.value)} />
                        <input
                           type="number" placeholder='Precio de Venta' />
                     </div>
                     {errorMassage}
                  </form>
                  

               </div>
            </Modal>
      



      </Fragment>

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