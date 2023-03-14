import React, { useState } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import style from './AddOrderModalStyle.module.scss'
import { SelectAddOrderModal, openModalAddOrder } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { ProductListSelected } from '../../ProductListSelected/ProductListSelected'
import {
    PlusIconButton,
    Button,
    InputText,
} from '../../../'

import { StockedProductPicker } from '../../StockedProductPicker/StockedProductPicker'
import { OrderDetails } from './OrderDetails/OrderDetails'
import { SelectOrder, AddProvider, cleanOrder, AddProductToOrder, getInitialCost, updateStock, SelectProductSelected, SelectProduct, SelectProducts, SelectTotalPurchase, DeleteProduct } from '../../../../features/addOrder/addOrderModalSlice'
import { AddOrder } from '../../../../firebase/firebaseconfig'
import { closeModalAddOrder } from '../../../../features/modals/modalSlice'
import { useEffect } from 'react'
import { SelectDataFromOrder } from '../../../../hooks/useSelectDataFromOrder'
import { selectOrderFilterOptions } from '../../../../features/order/ordersSlice'
import { CgMathPlus } from 'react-icons/cg'
import { addNotification } from '../../../../features/notification/NotificationSlice'
import ModalHeader from './Modal/ModalHeader'

export const AddOrderModal = ({ isOpen }) => {
    const dispatch = useDispatch();
    const [provider, setProvider] = useState(null);
    const OrderSelected = useSelector(SelectOrder);
    const [reset, setReset] = useState(false);
    const productSelected = useSelector(SelectProductSelected);
    const productsSelected = useSelector(SelectProducts);

    const productTotalPurchasePrice = useSelector(SelectTotalPurchase)
    useEffect(() => {
        if (provider) { dispatch(AddProvider(provider)) }
    }, [provider])

    const handleCloseModal = () => {
        dispatch(openModalAddOrder())
        dispatch(cleanOrder());
        setReset(true);
    }
    const HandleSubmit = async () => {
        if (OrderSelected.proveedor === null || OrderSelected.provider.id == "") {
            dispatch(addNotification({ title: 'Error', message: 'Agregue el proveedor', type: 'error' }))
            return
        }
        if (OrderSelected.products <= 0) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue un producto', type: 'error' }))
            return
        }
        if (OrderSelected.date === null) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Fecha de entrega', type: 'error' }))
            return
        }
        if (OrderSelected.date === null) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Condición', type: 'error' }))
            return
        }
        try {
            AddOrder(OrderSelected).then(() => {
                dispatch(addNotification({ message: 'Pedido Creado', type: 'success' }))
                setReset(true);
                dispatch(closeModalAddOrder());
                dispatch(cleanOrder());
            })
        } catch (error) {
            setTimeout(() => {
                dispatch(addNotification({ title: 'Error', message: `${error}`, type: 'error' }))
            }, 1000)
        }

    }
    const orderFilterOptions = useSelector(selectOrderFilterOptions)
    const providers = SelectDataFromOrder(orderFilterOptions, 'Proveedores')

    const handleAddProductToOrder = ({ stock, initialCost, cost }) => {
        dispatch(updateStock({ stock }))
        dispatch(getInitialCost({ initialCost, cost }))
        dispatch(AddProductToOrder())
    }
    const handleSelectProduct = (product) => {
        dispatch(SelectProduct(product))
    }
    const handleDeleteProduct = (product) => {
        dispatch(DeleteProduct(product.id))
    }

    return (
        <Backdrop isOpen={isOpen === true ? true : false}>
            <Modal>
                <ModalHeader close={handleCloseModal} title='Nuevo Pedido' />
                <BodyContainer>
                    <Body>
                        <header >
                            <Select
                                setReset={setReset}
                                reset={reset}
                                property='name'
                                title='Proveedor'
                                data={providers}
                                setValue={setProvider}
                                value={provider}
                            ></Select>
                            <Button
                                title={<CgMathPlus />}
                                borderRadius={'normal'}
                                color='gray-dark'
                                width={'icon32'}
                            />
                        </header>
                        <StockedProductPicker fn={handleAddProductToOrder} handleSelectProduct={handleSelectProduct} productSelected={productSelected}></StockedProductPicker>
                        <ProductListSelected
                            productsSelected={productsSelected}
                            productsTotalPrice={productTotalPurchasePrice}
                            handleDeleteProduct={handleDeleteProduct}
                        />
                        <OrderDetails
                            reset={reset}
                            setReset={setReset}
                        />
                        <div className={style.ModaFooter}>
                            <div className={style.ModalWrapperFooter}>
                                <Button
                                    title='Crear Pedido'
                                    borderRadius={'normal'}
                                    bgcolor='primary'
                                    onClick={HandleSubmit}
                                />
                            </div>
                        </div>
                    </Body>
                </BodyContainer>
            </Modal>
        </Backdrop>

    )
}

const Backdrop = styled.div`
    z-index: 20;
    position: absolute;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.200);
    backdrop-filter: blur(10px);
    width: 100vw;
    display: flex;
    transform: scale(0);
    clip-path: circle(20.9% at 50% 50%);
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition-property: transform, clip-path, opacity;
    transition-duration: 400ms, 600ms, 300ms;
    transition-delay: 100ms, 400ms, 0ms;
    transition-timing-function: ease-in-out, ease-in-out;

    ${props => {
        switch (props.isOpen) {
            case true:
                return `
                transform: scaleY(1);
                opacity: 1;
            
                clip-path: circle(100% at 50% 50%);
                transition-property: transform, clip-path, opacity;
                transition-timing-function: ease-in-out, ease-in-out;
                transition-duration: 600ms, 200ms, 400ms;
                transition-delay: 0ms, 0ms, 0ms;
                `
            default:
                break;
        }
    }}
`
const Modal = styled.div`
    max-width: 100%;
    width: 100%;
    height: 100%;
    background-color: var(--White);
    // border: 1px solid rgba(0, 0, 0, 0.300);
    overflow-y: hidden;
    display: grid;
    grid-template-rows: min-content 1fr;
`

const BodyContainer = styled.div`
width: 100%;
overflow-y: auto;
`
const Body = styled.div`
 
        max-width: var(--max-width);
        margin: 0 auto;
        width: 100%;
        padding: 0.6em;
        display: grid;
        align-items: flex-start;
        align-content: flex-start;
        gap: 1em;
        header {
            display: flex;
            gap: 1em;
        }
`