import { notification } from 'antd'
import { useState } from 'react'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import { useFormatPrice } from '../../../hooks/useFormatPrice';
import { Button } from '../../templates/system/Button/Button'
import { InputV4 } from '../../templates/system/Inputs/GeneralInput/InputV4'
import { ProductFilter } from '../ProductFilter/ProductFilter'

/**
* Este componente recibe la funcion de agregar el producto y devuelve el componente.
*
* @param {number} fn pasar la función que se encarga de agregar el producto.
* @param {number} productSelected pasar el producto seleccionado.
* @returns {number} el componente de seleccionar y agregar producto.
*/
export const StockedProductPicker = ({ addProduct, selectedProduct, selectProduct, setProductSelected }) => {
    const dispatch = useDispatch();
    const [showProductList, setShowProductList] = useState(false);

    const newStock = selectedProduct?.newStock;
    const stock = selectedProduct?.stock;
    const totalStock = stock + newStock || 0;

    const cost = Number(selectedProduct.cost);
    const initialCost = Number(selectedProduct.initialCost);
    const subTotal = Number(selectedProduct.initialCost) * Number(selectedProduct?.newStock);

    const AddToProductList = () => {
        if (selectedProduct.productName === '') {
            notification.error({
                message: 'Error',
                description: 'Antes de continuar, por favor seleccioné un producto'
            });
            return
        }
        if (newStock <= 0) {
            notification.error({
                message: 'Error',
                description: 'Antes de continuar, por favor introduzca la cantidad de producto que desea agregar.'
            });
            return
        }
        if (!initialCost) {
            notification.error({
                message: 'Error',
                description: 'Antes de continuar, por favor introduzca el costo inicial del producto.'
            });
            return
        }
        if (selectedProduct) {
            addProduct()
        }
    }

    useEffect(() => {
        if ((selectedProduct.productName) && Number(initialCost) > Number(cost)) {
            notification.error({
                message: 'Advertencia',
                description: 'El costo inicial es mayor al costo unitario'
            });
        }
    }, [initialCost])

    useEffect(() => {
        if (selectedProduct?.productName === "" && initialCost > 0) {
            notification.error({
                message: 'Advertencia',
                description: 'Antes de continuar, por favor seleccioné un producto'
            });
            setShowProductList(true)
        }
        if (selectedProduct?.productName === "" && newStock > 0) {
            notification.warning({
                message: 'Advertencia',
                description: 'Antes de continuar, por favor seleccioné un producto'
            });
            setShowProductList(true)
        }
    }, [initialCost, newStock])

    return (
        <Container>
            <Group>
                <Col>
                    <span>Product</span>
                </Col>
                <Col>
                    <span>{`Cantidad: `}</span>
                </Col>
                <Col>
                    <span>Costo {`(${useFormatPrice(cost || 0)})`}</span>
                </Col>
                <Col>
                    <span>Subtotal $</span>
                </Col>
                <Col>
                </Col>
            </Group>
            <Group>
                <ProductFilter
                    handleSelectProduct={selectProduct}
                    isOpen={showProductList}
                    setIsOpen={setShowProductList}
                    productName={selectedProduct?.productName || ''}
                />
                <div>
                    <InputV4
                        type='number'
                        bgColor='gray-light'
                        border
                        value={selectedProduct.newStock || ''}
                        onChange={(e) => setProductSelected({ newStock: Number(e.target.value) })}
                    />
                </div>
                <div>
                    <InputV4
                        type='number'
                        value={initialCost || ''}
                        placeholder='Costo'
                        onChange={(e) => setProductSelected({ initialCost: Number(e.target.value) })}
                        border
                        bgColor='gray-light'
                    />
                </div>
                <div>
                    <InputV4
                        value={useFormatPrice(subTotal || 0)}
                        placeholder='SubTotal'
                        readOnly
                        border
                        bgColor='gray-light'
                    />
                </div>
                <div>
                    <Button 
                    title={<TbPlus />} width='icon32' border='light' borderRadius='normal' onClick={AddToProductList} >
                    </Button>
                </div>
            </Group>
        </Container>
    )
}
const Container = styled.div`
    background-color: var(--White);
    border-radius: var(--border-radius);
    display: grid;
    
    gap: 0.2em;
    padding: 0.2em 0em 0.2em;
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
       height: 1em;
       padding: 0em 0em 0em 0.4em;
       align-items: end;
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
