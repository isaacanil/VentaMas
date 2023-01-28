import React, { useState } from 'react'
import { TbPlus } from 'react-icons/tb'
import styled from 'styled-components'
import { InputNumber, InputText } from '../../../../templates/system/Inputs/Input'
import style from '../AddOrderModalStyle.module.scss'
import { AddProductButton_OrderPage } from '../Button'
import { ProductFilter } from '../ProductFilter/ProductFilter'
import { SelectProductSelected, updateStock } from '../../../../../features/addOrder/addOrderModalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { AddProduct } from '../../../../../features/addOrder/addOrderModalSlice'
import { Button } from '../../../../templates/system/Button/Button'
import { Tooltip } from '../../../../templates/system/Button/Tooltip'
import { useEffect } from 'react'
export const AddProductListSection = () => {
    const dispatch = useDispatch();
    const productSelected = useSelector(SelectProductSelected)
    const [product, setProduct] = useState(null)
    useEffect(()=> {
        setProduct({...productSelected, product: {stock: ''}})
    }, [productSelected])
    const newStock = productSelected ? `${Number(productSelected.product.stock) + Number((product !== null ? (product.product.stock) : null))}` : null
    const AddToOrderProductList = () => {
        if(productSelected){
            dispatch(updateStock({newStock}))
            dispatch(AddProduct())

        }
    }
    console.log(product)
    return (
        <div className={style.AddProductToListSection}>
            <div className={style.Group}>
                <div className={style.col}>
                    <span className={style.ProductName}>
                        <span>Product</span>
                        <Tooltip 
                            description='Crear Producto'
                            placement='bottom'
                            Children={
                                <AddProductButton_OrderPage/>
                            }
                        />
                    </span>
                </div>
                <div className={style.col}>
                    <span>{`Cantidad ${productSelected ? `(${newStock})` : null}`}</span>
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
                    <InputNumber

                        value={productSelected ? (product !== null ? (product.product.stock) : null) : ''}
                        placeholder='Cantidad'
                        onChange={(e) => setProduct({
                            ...product,
                            product:{
                                stock: e.target.value
                            }
                        })}
                    />
                </div>
                <div>
                    <InputText
                        value={productSelected ? productSelected.product.cost.unit : null}
                        placeholder='Costo'
                        readOnly
                    
                    />
                </div>
                <div>
                    <InputText
                        value={productSelected ? productSelected.product.price.unit : null}
                        placeholder='SubTotal'
                        readOnly
                    
                    />
                </div>
                <div>
                    <Button title={<TbPlus/>} width='icon32' border='light' borderRadius='normal' onClick={AddToOrderProductList} >
                        
                    </Button>
                </div>
            </div>
        </div>
    )
}

