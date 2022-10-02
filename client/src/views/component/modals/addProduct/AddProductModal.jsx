/* eslint-disable no-undef */
import React, { Fragment, useState, useEffect } from 'react'
import Style from './AddProducts.module.scss'
import {  Button, ErrorMessage } from '../../../index'
import { UploadProdImg, UploadProdData } from '../../../../firebase/firebaseconfig.js'
import { Modal } from '../../../index';
import { Navigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
//template
import { useSelector, useDispatch } from 'react-redux';
import { SelectAddProdModal } from '../../../../features/modals/modalSlice';
import { closeModalAddProd } from '../../../../features/modals/modalSlice';
import { getTaxes } from '../../../../firebase/firebaseconfig';

export const AddProductModal = () => {
   const [taxesList, setTaxesList] = useState()
   const [taxRef, setTaxRef] = useState('')
 

   useEffect(()=>{
      getTaxes(setTaxesList)
   },[])
   
   const dispatch = useDispatch()
   //declarando las variables
   const isOpen = useSelector(SelectAddProdModal)

   const [productName, setProductName] = useState('')
   const [cost, setCost] = useState(null)
   const [productImage, setProductImage] = useState(null)
   console.log(productImage)
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


   const handleSubmit = async () => {
      /****************************************************************** */
      const extentionsFile = /.jpg|.jpeg|.png| .webp| .gif/i;
      if (!extentionsFile.exec(productImage.name)) {
         console.log(productImage.name)
         setErrorMassage(<ErrorMessage text='Error de archivo (no es una imagen)'></ErrorMessage>)
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
      /******************************************************************************** */
      

   }
   const closeModal = () => {
      dispatch(
          closeModalAddProd()
      )
  }
   
   return (
      <Fragment>
         {isOpen ? (

         <Modal nameRef='Agregar Producto' btnSubmitName='Guardar' close={closeModal} handleSubmit={handleSubmit}>
            <div className={Style.Container} >

               <form className={Style.Form}>
                  <div className={Style.Group}>
                     <label htmlFor="">Nombre del producto:</label>
                     <input className={Style.Input} type="text" required onChange={(e) => setProductName(e.target.value)} />
                  </div>

                  <div className={Style.Group}>
                     <label htmlFor="">Agregar imagen: </label>
                     <input className={Style.Input} type="file" id='file' onChange={(e) => setProductImage(e.target.files[0])} />
                     <Button onClick={BtnFiles}>Agregar Imagen</Button>
                  </div>
                  <div className={Style.Group}>
                     <label htmlFor="">Costo:</label>
                     <input className={Style.Input} type="number" onChange={(e) => setCost(e.target.value)} />
                  </div>
                  <div className={Style.Group}>
                     <label htmlFor="">Categoria:</label>
                     <select name="select" id="" onChange={(e) => setCategory(e.target.value)}>
                        <option value="">Select</option>
                        <option value={'Bebida'}>Bebida</option>
                        <option value={'Alimento'}>Alimento</option>
                        <option value={'Hogar'}>Hogar</option>
                     </select>
                  </div>
                  <div className={Style.Group}>
                     <label htmlFor="">Impuesto:</label>
                     <select  id="" onChange={(e) => setTaxRef( e.target.value )}>
                        <option value="">Select</option>
                        {
                           taxesList.length >= 1 ? (
                              taxesList.map(({tax}, index)=>(
                                 <option value={JSON.stringify(tax)} key={index}>ITBIS {tax.ref}</option>
                              ))
                           ) : null
                        }
                        
                        
                     </select>
                  </div>
                  <div className={Style.Group}>
                     <label htmlFor="">Stock</label>
                     <input className={Style.Input} type="number" onChange={(e) => setStock(e.target.value)} />
                  </div>
                  <div className={Style.Group}>
                     <label htmlFor="">Contenido Neto:</label>
                     <input className={Style.Input} type="text" onChange={(e) => setNetContent(e.target.value)} />
                  </div>
                  
                  <div className={Style.Group}>
                     <label>Precio de Venta: </label>
                     <label>RD$ </label>
                  </div>
                  {errorMassage}
                  
               </form>

            </div>
         </Modal>
         ):null}



      </Fragment>

   )
}


