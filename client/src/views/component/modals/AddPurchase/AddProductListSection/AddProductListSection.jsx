import React, { useState } from 'react'
import { TbPlus } from 'react-icons/tb'
import styled from 'styled-components'
import { InputNumber, InputText } from '../../../../templates/system/Inputs/Input'

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
    useEffect(() => {
        setProduct({ ...productSelected, product: { stock: '' } })
    }, [productSelected])
    const newStock = productSelected ? `${Number(productSelected.product.stock) + Number((product !== null ? (product.product.stock) : null))}` : null
    const AddToOrderProductList = () => {
        if (productSelected) {
            dispatch(updateStock({ newStock }))
            dispatch(AddProduct())

        }
    }
    console.log(product)
    return (
        <Container>
            <Group>
                <Col>
                    <ProductName>
                        <span>Product</span>
                        <Tooltip
                            description='Crear Producto'
                            placement='bottom'
                            Children={
                                <AddProductButton_OrderPage />
                            }
                        />
                    </ProductName>
                </Col>
                <Col>
                    <span>{`Cantidad ${productSelected ? `(${newStock})` : null}`}</span>
                </Col>
                <Col>
                    <span>Costo</span>
                </Col>
                <Col>
                    <span>Subtotal</span>
                </Col>
                <Col>
                </Col>
            </Group>
            <Group>
                <ProductFilter
                    productName={productSelected ? productSelected.product.productName : ''}
                />
                <div>
                    <InputNumber

                        value={productSelected ? (product !== null ? (product.product.stock) : null) : ''}
                        placeholder='Cantidad'
                        onChange={(e) => setProduct({
                            ...product,
                            product: {
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
                    <Button
                        title={<TbPlus />}
                        width='icon32'
                        border='light'
                        borderRadius='normal'
                        onClick={AddToOrderProductList}
                    />
                </div>
            </Group>
        </Container>
    )
}

const Container = styled.div`
    background-color: rgb(220, 233, 245);
    border-radius: 8px;
    display: grid;
    gap: 0.2em;
    padding: 0.4em 1em;
    border: var(--border-primary);
`
const Group = styled.div`
     color: rgb(37, 37, 37);
     display: grid;
     grid-template-columns: 1fr 0.8fr 0.8fr 0.8fr min-content;
     position: relative;
     gap: 1em;
`
const Col = styled.div`
       display: flex;
       font-weight: 500;
`
const ProductName = styled.div`
    display: flex;
    align-items: center;
    gap: 1em;
`