import React, { useState } from 'react'
import { TbPlus } from 'react-icons/tb'
import styled from 'styled-components'
import { InputNumber, InputText } from '../../../../templates/system/Inputs/Input'
import { AddProductButton_OrderPage } from '../Button'
import { ProductFilter } from '../ProductFilter/ProductFilter'
import { useDispatch, useSelector } from 'react-redux'
import { AddProduct, SelectProductSelected, updateStock } from '../../../../../features/Purchase/addPurchaseSlice'
import { Button } from '../../../../templates/system/Button/Button'
import { Tooltip } from '../../../../templates/system/Button/Tooltip'
import { useEffect } from 'react'
export const AddProductListSection = () => {
    const dispatch = useDispatch();
    const productSelected = useSelector(SelectProductSelected)
    const [product, setProduct] = useState(null)
    useEffect(() => {
        if (productSelected) {
            setProduct({ ...productSelected, product: { stock: { actualStock: '', newStock: '' } } })
        }
    }, [productSelected])
    const actualStock = product ? Number(productSelected.product.stock) : null;
    const newStock = product ? Number(product.product.stock.newStock) : null;
    const stock = { newStock, actualStock }
    const totalStock = productSelected ? `${actualStock + newStock}` : null
    const AddToOrderProductList = () => {
        if (productSelected) {
            dispatch(updateStock({ stock }))
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
                    <span>{`Cantidad ${productSelected ? `(${totalStock})` : null}`}</span>
                </Col>
                <Col>
                    <span>Costo</span>
                </Col>
                <Col>
                    <span>Subtotal</span>
                </Col>
                <Col>
                    <span></span>
                </Col>
            </Group>
            <Group>
                <ProductFilter
                    productName={productSelected ? productSelected.product.productName : ''}
                />
                <div>
                    <InputNumber
                        value={productSelected ? (product !== null ? (product.product.stock.newStock) : null) : ''}
                        placeholder='Cantidad'
                        border
                        bgColor='gray-light'
                        onChange={(e) => setProduct({
                            ...product,
                            product: {
                                stock: { newStock: e.target.value }
                            }
                        })}
                    />
                </div>
                <div>
                    <InputText
                        value={productSelected ? productSelected.product.cost.unit : null}
                        placeholder='Costo'
                        border
                        bgColor='gray-light'
                        readOnly
                    />
                </div>
                <div>
                    <InputText
                        value={productSelected ? productSelected.product.price.unit : null}
                        placeholder='SubTotal'
                        border
                        bgColor='gray-light'
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
    border-radius: 8px;
    display: grid;
    gap: 0.2em;
    padding: 0 1em 0.4em;
    //border: var(--border-primary);
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
       min-width: 2em;
       align-items: center;
       span{    
    font-size: 12px;
    line-height: 12px;
       }
`
const ProductName = styled.div`
    display: flex;
    align-items: center;
    gap: 1em;
`