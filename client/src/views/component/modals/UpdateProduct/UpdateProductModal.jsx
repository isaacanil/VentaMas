import React, { Fragment, useEffect, useState } from 'react'
import { Modal } from '../modal'
import styled from 'styled-components'
import { getTaxes, getProduct } from '../../../../firebase/firebaseconfig'
import { useDispatch, useSelector } from 'react-redux'
import { closeModalUpdateProd, SelectUpdateProdModal } from '../../../../features/modals/modalSlice'
export const UpdateProductModal = () => {
  const [taxesList, setTaxesList] = useState()
  const [taxe, setTaxe] = useState('')
  const [productName, setProductName] = useState('')
  const [cost, setCost] = useState(null)
  const [productImage, setProductImage] = useState(null)
  const [productImageURL, setProductImagenUrl] = useState(null)
  const [category, setCategory] = useState(null)
  //const [enlaceImg, setEnlaceImg] = useState('')
  const [stock, setStock] = useState(null)
  const [netContent, setNetContent] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [errorMassage, setErrorMassage] = useState('')
  console.log(taxe)

  useEffect(() => {
    getTaxes(setTaxesList)
  }, [])
 

    let product = {
      // id: nanoid(6),
      name: String(productName),
      // cost: Number(cost),
      tax: taxe !== '' ? (JSON.parse(taxe)) : null,
      //prodImageURL: productImageURL,
      // ProdStock: Number(stock),
      //toma el valor sin inpuesto y le agrega el impuesto seleccionado y redondeado
      // ProdNetContent: netContent,
      // SalePrice: () => {
      //   const result = product.cost + product.totalTaxes()
      //   return result.toFixed(2)
      // }
    }
    console.log(product)
    const {id, isOpen} = useSelector(SelectUpdateProdModal)
    
    const dispatch = useDispatch()
   const handleSubmit = () => {
     const result = getProduct(id, product)
    console.log(result)
   }
   
  const closeModal = () => {
    dispatch(
      closeModalUpdateProd()
    )
  }
  return (
    <Fragment>
      {isOpen ? (
        <Modal nameRef={'Actualizar Producto'} close={closeModal} handleSubmit={handleSubmit}>
          <Container>
            <Group>
            <label htmlFor="">Nombre del producto:</label>
                     <input  type="text" required onChange={(e) => setProductName(e.target.value)} />
            </Group>
            <Group>
              <label htmlFor="">Costo: </label>
              <input type="text" />
            </Group>
            <Group>
              <label htmlFor="">Categoria:</label>
              <select name="select" id="" onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select</option>
                <option value={'Bebida'}>Bebida</option>
                <option value={'Alimento'}>Alimento</option>
                <option value={'Hogar'}>Hogar</option>
              </select>
            </Group>
            <Group>
              <label htmlFor="">Impuesto:</label>
              <select id="" onChange={(e) => setTaxe(e.target.value)}>
                <option value="">Select</option>
                {
                  taxesList.length >= 1 ? (
                    taxesList.map(({ taxe }, index) => (
                      <option key={index} value={JSON.stringify(taxe)}>{taxe.ref}</option>
                    ))
                  ) : null
                }


              </select>
            </Group>
          </Container>
        </Modal>
      ) : null}
    </Fragment>
  )
}

const Container = styled.form`
  
`
const Group = styled.div`
  background-color: var(--White1);
  padding: 1em;
  gap: 2em;
    display: flex;
      
    align-items: center;
    justify-content: center;
    justify-content: space-between;

    &:first-child {
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }

    &:last-child {

      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }

    label {
      font-weight: 500;
      white-space: nowrap;
      color: rgb(54, 54, 54);
    }

    input[type="text"],
    input[type="number"] {
      width: 100%;
      margin: 0;
      padding: 0.4em 1em;
      border: 1px solid rgba(0, 0, 0, 0.155);
      border-radius: 100px;
      &:focus{
          outline: none;
      }
    }

    input[type="file"] {
      display: none;
    }
   
`