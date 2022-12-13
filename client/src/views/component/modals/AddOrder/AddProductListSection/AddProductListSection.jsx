import React, { useState } from 'react'
import { TbPlus } from 'react-icons/tb'
import styled from 'styled-components'
import { InputText } from '../../../../templates/system/Inputs/Input'
import style from '../AddOrderModalStyle.module.scss'
import { AddProductButton_OrderPage } from '../Button'
import { ProductFilter } from '../ProductFilter/ProductFilter'
import { SelectProductSelected } from '../../../../../features/addOrder/addOrderModalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { AddProduct } from '../../../../../features/addOrder/addOrderModalSlice'
export const AddProductListSection = () => {
    const productSelected = useSelector(SelectProductSelected)
    const dispatch = useDispatch();
    const AddToOrderProductList = () => {
        productSelected ? (
            dispatch(
                AddProduct()
            )
        ) : null
    }
    return (
        <div className={style.AddProductToListSection}>
            <div className={style.Group}>
                <div className={style.col}>
                    <span className={style.ProductName}>
                        <span>Product</span>
                        <AddProductButton_OrderPage
                            message='Agregar Producto' />
                    </span>
                </div>
                <div className={style.col}>
                    <span>Cantidad</span>
                </div>
                <div className={style.col}>
                    <span>Costo</span>
                </div>
                <div className={style.col}>
                    <span>Subtotal</span>
                </div>
                <div className={style.col}>
                </div>
            </div>
            <div className={style.Group}>
                <ProductFilter
                    productName={productSelected ? productSelected.product.productName : ''}
                />
                <div>
                    <InputText
                        value={productSelected ? productSelected.product.stock : null}
                        placeholder='Cantidad'
                        readOnly
                        onChange
                    />
                </div>
                <div>
                    <InputText
                        value={productSelected ? productSelected.product.cost.unit : null}
                        placeholder='Costo'
                        readOnly
                        onChange
                    />
                </div>
                <div>
                    <InputText
                        value={productSelected ? productSelected.product.price.unit : null}
                        placeholder='SubTotal'
                        readOnly
                        onChange
                    />
                </div>
                <div>
                    <Button onClick={AddToOrderProductList}>
                        <TbPlus></TbPlus>
                    </Button>
                </div>
            </div>
        </div>
    )
}

const Button = styled.button`
  width: 1.8em;
  height: 1.8em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  
  font-size: 1.06em;
  border-radius: 100%;
  &:focus {
    outline: none;
  }
`