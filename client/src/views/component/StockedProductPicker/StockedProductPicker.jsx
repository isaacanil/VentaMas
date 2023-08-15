import React, { useState } from 'react'
import styled from 'styled-components'
import { TbPlus } from 'react-icons/tb'
import { InputNumber, InputText } from '../../templates/system/Inputs/Input'
import { AddProductButton } from '../modals/AddOrder/Button'
import { ProductFilter } from '../ProductFilter/ProductFilter'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../templates/system/Button/Button'
import { Tooltip } from '../../templates/system/Button/Tooltip'
import { useEffect } from 'react'
import { addNotification } from '../../../features/notification/NotificationSlice'
import { useFormatPrice } from '../../../hooks/useFormatPrice';
/**
* Este componente recibe la funcion de agregar el producto y devuelve el componente.
*
* @param {number} fn pasar la función que se encarga de agregar el producto.
* @param {number} productSelected pasar el producto seleccionado.
* @returns {number} el componente de seleccionar y agregar producto.
*/
export const StockedProductPicker = ({ addProduct, selectedProduct, selectProduct }) => {
    const dispatch = useDispatch();
    const [product, setProduct] = useState(null)
    const [showProductList, setShowProductList] = useState(false);

    
    const actualStock = product ? Number(selectedProduct.product.stock) : null;
    const newStock = product ? Number(product.product.stock.newStock) : null;
    const stock = { newStock, actualStock };
    const totalStock = selectedProduct ? `${actualStock + newStock}` : null;

    const cost = selectedProduct && product ? { unit: selectedProduct.product.cost.unit } : null;
    const initialCost = product ? Number(product.product.initialCost) : null;
    const subTotal = product ? Number(product.product.initialCost) * Number(product.product.stock.newStock) : null;

    const AddToProductList = () => {
        if (product === 0) {
            dispatch(addNotification({ title: 'Error', message: 'Introduzca una cantidad para sumar al inventario', type: 'error' }))
            return
        }
        if (newStock === 0) {
            dispatch(addNotification({ title: 'Error', message: 'Introduzca una cantidad para sumar al inventario', type: 'error' }))
            return
        }
        if (product.initialCost === '') {
            dispatch(addNotification({ title: 'Error', message: 'Introduzca una cantidad para sumar al inventario', type: 'error' }))
            return
        }
        if (selectedProduct && newStock > 0) {
            addProduct({ stock, cost, initialCost })
        }
    }
    useEffect(() => {
        selectedProduct ? (
            setProduct({ ...selectedProduct, product: { stock: { actualStock: '', newStock: '' }, cost: { unit: '' }, initialCost: '' } })
        ) : null
    }, [selectedProduct])

    useEffect(() => {
        if (product && (selectedProduct.product.productName) && Number(product.product.initialCost) > Number(selectedProduct.product.cost.unit)) {
            dispatch(addNotification({ title: 'Advertencia', message: 'El costo inicial es mayor al costo unitario', type: 'error' }))
        }
    }, [initialCost])

    useEffect(() => {
        if (selectedProduct.product.productName === "" && initialCost > 0) {
            dispatch(addNotification({ title: 'Advertencia', message: 'Antes de continuar, por favor seleccioné un producto', type: 'error' }))
            setShowProductList(true)
        }
        if (selectedProduct.product.productName === "" && newStock > 0) {
            dispatch(addNotification({ title: 'Advertencia', message: 'Antes de continuar, por favor seleccioné un producto', type: 'warning' }))
            setShowProductList(true)
        }
    }, [initialCost, newStock])

 
    return (
        <Container>
            <Group>
                <Col>
                    <ProductName>
                        <span>Product</span>
                        <Tooltip
                            description='Crear Producto'
                            placement='bottom'
                            Children={<AddProductButton />}
                        />
                    </ProductName>
                </Col>
                <Col>
                    <span>{`Cantidad ${selectedProduct ? `(${totalStock})` : null}`}</span>
                </Col>
                <Col>
                    <span>Costo {`(${selectedProduct ? (cost ? useFormatPrice(cost.unit) : null) : null})`}</span>
                </Col>
                <Col>
                    <span>Subtotal</span>
                </Col>
                <Col>
                </Col>
            </Group>
            <Group>
                <ProductFilter
                    handleSelectProduct={selectProduct}
                    isOpen={showProductList}
                    setIsOpen={setShowProductList}
                    productName={selectedProduct ? selectedProduct.product.productName : ''}
                />
                <div>
                    <InputNumber
                        bgColor='gray-light'
                        border
                        value={selectedProduct ? (product !== null ? (product.product.stock.newStock) : '') : ''}
                        onChange={(e) => setProduct({
                            ...product,
                            product: {
                                ...product.product,
                                stock: {
                                    newStock: e.target.value
                                }
                            }
                        })}
                    />
                </div>
                <div>
                    <InputText
                        value={selectedProduct ? (product !== null ? (product.product.initialCost) : '') : null}
                        placeholder='Costo'
                        onChange={(e) => setProduct({
                            ...product,
                            product: {
                                ...product.product,
                                initialCost: e.target.value
                            }
                        })}
                        border
                        bgColor='gray-light'
                    />
                </div>
                <div>
                    <InputText
                        value={selectedProduct ? subTotal : ''}
                        placeholder='SubTotal'
                        readOnly
                        border
                        bgColor='gray-light'
                    />
                </div>
                <div>
                    <Button title={<TbPlus />} width='icon32' border='light' borderRadius='normal' onClick={AddToProductList} >
                    </Button>
                </div>
            </Group>
        </Container>
    )
}
const Container = styled.div`
    background-color: var(--White);
    border-radius: 8px;
    display: grid;
    gap: 0.2em;
    padding: 0.2em 1em 0.4em;
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
