/* eslint-disable no-undef */
import React, { Fragment, useState, useEffect } from 'react'
import Style from '../Product/Products.module.scss'
import { Button } from '../../../index'
import { UploadProdImg, UploadProdData, getCat, updateProduct } from '../../../../firebase/firebaseconfig.js'
import { Modal } from '../../../index';
//template
import { selectUpdateProductData, clearUpdateProductData } from '../../../../features/updateProduct/updateProductSlice';
import { useSelector, useDispatch } from 'react-redux';
import { getTaxes } from '../../../../firebase/firebaseconfig.js';
import styled from 'styled-components';
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice';
import { Input } from '../../../templates/system/Inputs/InputV2';
import { quitarCeros } from '../../../../hooks/quitarCeros';
import { UploadImg } from '../../UploadImg';
export const UpdateProductModal = ({ title, btnSubmitName, isOpen }) => {
  const { status, lastProduct } = useSelector(selectUpdateProductData)
  const [taxesList, setTaxesList] = useState([])
  const [taxRef, setTaxRef] = useState('')
  const [catList, setCatList] = useState([])
  const [imgController, setImgController] = useState(false)
  const handleImgController = (e) => {
    e.preventDefault()
    setImgController(!imgController)
  }
  const [product, setProduct] = useState({
    productName: undefined,
    cost: {
      unit: undefined,
      total: undefined
    },
    amountToBuy: undefined,
    productImageURL: undefined,
    category: undefined,
    stock: "",
    type: "",
    size: "",
    netContent: undefined,
    tax: undefined,
    id: undefined,
    price: {
      unit: undefined,
      total: undefined
    }
  })
  useEffect(() => {
    setProduct(
      {
        ...product,
        id: lastProduct.id,
        productName: lastProduct.productName,
        cost: lastProduct.cost,
        productImageURL: lastProduct.productImageURL,
        category: lastProduct.category,
        stock: lastProduct.stock,
        netContent: lastProduct.netContent,
        tax: lastProduct.tax,
        price: lastProduct.price,
        size: lastProduct.size,
        type: lastProduct.type,
        amountToBuy: { unit: 1, total: 1 }
      }
    )
  }, [lastProduct])
  useEffect(() => {
    getTaxes(setTaxesList)
    getCat(setCatList)
  }, [])
  const dispatch = useDispatch()
  const [errorMassage, setErrorMassage] = useState('')
  const BtnFiles = (e) => {
    e.preventDefault()
    document.getElementById('file').click()
  }
  const handleSubmitAddProducts = () => {
    updateProduct(product),
      closeModal()
    dispatch(clearUpdateProductData())
  }
  const closeModal = () => {
    dispatch(
      closeModalUpdateProd()
    )
    dispatch(clearUpdateProductData())
  }
  // useEffect(() => {
  //   if (product.cost.unit !== undefined && product.tax.value !== undefined) {
  //     setProduct({
  //       ...product,
  //       price: {
  //         unit: product.cost.unit * product.tax.value + product.cost.unit,
  //         total: product.cost.unit * product.tax.value + product.cost.unit,
  //       }
  //     })
  //   }
  // }, [product.cost, product.tax])
  console.log(product)
  return (
    <Fragment>
      <Modal
        nameRef={'Actualizar Producto ' + `(${lastProduct.id})`}
        btnSubmitName='Actualizar'
        isOpen={isOpen}
        close={closeModal}
        handleSubmit={handleSubmitAddProducts}
        subModal={<UploadImg isOpen={imgController} setIsOpen={setImgController} />}
      >
        <div className={Style.Container} >
          <form className={Style.Form}>
            <div className={Style.Group}>
              <Input
                required
                title={'Nombre del producto'}
                type="text"
                value={status ? product.productName : undefined}
                placeholder='Nombre del Producto:'
                onChange={(e) => setProduct({
                  ...product,
                  productName: e.target.value
                })} />


            </div>
            <div className={Style.Group}>
              <div className={Style.wrapper}>

                <div className={Style.subGroup}>
                  <Input
                    title={'Tipo de Producto'}
                    type="text"
                    value={status ? product.type : undefined}
                    onChange={(e) => setProduct({
                      ...product,
                      type: e.target.value
                    })}

                  />
                  <Input
                    title={'Stock'}
                    type="number"
                    placeholder='stock'
                    value={status ? product.stock : undefined}
                    onChange={(e) => setProduct({
                      ...product,
                      stock: e.target.value
                    })} />
                </div>
                <div className={Style.subGroup}>
                  <Input
                    title={'Tipo de Producto'}
                    type="text"
                    value={status ? product.type : undefined}
                    onChange={(e) => setProduct({
                      ...product,
                      type: e.target.value
                    })}

                  />
                  <Input
                    title={'Stock'}
                    type="number"
                    placeholder='stock'
                    value={status ? product.stock : undefined}
                    onChange={(e) => setProduct({
                      ...product,
                      stock: e.target.value
                    })} />
                </div>
              </div>
              <div className="wrapper">
                <img src={status ? product.productImageURL : undefined} alt="" />
                <Button
                  title='Agregar Imagen'
                  onClick={handleImgController}
                />
              </div>
            </div>

            <div className={Style.Group}>
              <Input
                title={'Tipo de Producto'}
                type="text"
                value={status ? product.type : undefined}
                onChange={(e) => setProduct({
                  ...product,
                  type: e.target.value
                })}

              />
              <Input
                title={'Stock'}
                type="number"
                placeholder='stock'
                value={status ? product.stock : undefined}
                onChange={(e) => setProduct({
                  ...product,
                  stock: e.target.value
                })} />

              <select name="select" id="" onChange={(e) => setProduct({
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
                        selected={item.category.name === product.category}
                      >
                        {item.category.name}
                      </option>
                    ))
                  ) : null
                }
              </select>

            </div>
            <div className={Style.Group}>
              <Input
                title={'Contenido neto'}
                type="text"
                placeholder='Contenido Neto:'
                value={status ? product.netContent : undefined}
                onChange={(e) => setProduct({
                  ...product,
                  netContent: e.target.value
                })} />
              <Input
                title={'Tamaño'}
                type="text"
                placeholder='Contenido Neto:'
                value={status ? product.size : undefined}
                onChange={(e) => setProduct({
                  ...product,
                  size: e.target.value
                })}
              />
            </div>
            <div className={Style.Group}>
              <Input
                title={'Costo'}
                type="number"
                value={status ? quitarCeros(product.cost.unit) : undefined}
                onChange={(e) => setProduct({
                  ...product,
                  cost: {
                    unit: Number(e.target.value),
                    total: Number(e.target.value)
                  }
                })} />
              <select id="" onChange={(e) => setProduct({
                ...product,
                tax: JSON.parse(e.target.value)
              })}>
                <option value="">Impuesto</option>
                {
                  taxesList.length > 0 ? (
                    taxesList.map(({ tax }, index) => (
                      <option
                        selected={tax.value === product.tax.value}
                        value={JSON.stringify(tax)}
                        key={index}
                      >ITBIS {tax.ref}</option>
                    ))
                  ) : null
                }
              </select>
              <Input
                type="number"
                title={'Precio + ITBIS'}
                value={status ? product.price.unit : undefined}
                readOnly
                placeholder='Precio de Venta' />
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