import React, { useState } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { openModalAddOrder } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { ProductListSelected } from '../../ProductListSelected/ProductListSelected'
import { Button } from '../../../'

import { StockedProductPicker } from '../../StockedProductPicker/StockedProductPicker'
import { OrderDetails } from './OrderDetails/OrderDetails'
import { SelectOrder, AddProvider, cleanOrder,  SelectProductSelected, SelectProduct, SelectProducts, SelectTotalPurchase, DeleteProduct, getInitialCost, addNewStock, AddProductToOrder } from '../../../../features/addOrder/addOrderModalSlice'
import { AddOrder } from '../../../../firebase/firebaseconfig'
import { closeModalAddOrder } from '../../../../features/modals/modalSlice'
import { useEffect } from 'react'
import { CgMathPlus } from 'react-icons/cg'
import { addNotification } from '../../../../features/notification/NotificationSlice'
import ModalHeader from './Modal/ModalHeader'
import { selectUser } from '../../../../features/auth/userSlice'
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider'

export const AddOrderModal = ({ isOpen }) => {
    const dispatch = useDispatch();

    const OrderSelected = useSelector(SelectOrder);
    const [reset, setReset] = useState(false);
    const selectedProduct = useSelector(SelectProductSelected);
    const productsSelected = useSelector(SelectProducts);
    const provider = OrderSelected.provider;
    const [orders, setOrders] = useState()
    const user = useSelector(selectUser);

    const { providers } = useFbGetProviders(user);

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
            AddOrder(user, OrderSelected)
                .then(() => {
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
    const selectProduct = (product) => dispatch(SelectProduct(product));
    const addProduct = ({stock, initialCost, cost}) => {
        dispatch(addNewStock({ stock }))
        dispatch(getInitialCost({ initialCost, cost }))
        dispatch(AddProductToOrder())
    }
    const handleDeleteProduct = (product) => dispatch(DeleteProduct(product.id));
    console.log(providers)
    return (
        <Backdrop isOpen={isOpen === true ? true : false}>
            <Modal>
                <ModalHeader close={handleCloseModal} title='Nuevo Pedido' />
                <BodyContainer>
                    <Body>
                        <header >
                            <Select
                                title='Proveedor'
                                data={providers}
                                onChange={(e) => dispatch(AddProvider(e.target.value?.provider))}
                                displayKey={'provider.name'}
                                value={provider?.name}
                            />
                            <Button
                                title={<CgMathPlus />}
                                borderRadius={'normal'}
                                color='gray-dark'
                                width={'icon32'}
                            />
                        </header>
                        <StockedProductPicker
                            addProduct={addProduct}
                            selectProduct={selectProduct}
                            selectedProduct={selectedProduct}
                        />
                        <ProductListSelected
                            productsSelected={productsSelected}
                            productsTotalPrice={productTotalPurchasePrice}
                            handleDeleteProduct={handleDeleteProduct}
                        />
                        <OrderDetails
                            reset={reset}
                            setReset={setReset}
                        />
                        <Footer>
                            <FooterWrapper>
                                <Button
                                    title='Crear Pedido'
                                    borderRadius={'normal'}
                                    bgcolor='primary'
                                    onClick={HandleSubmit}
                                />
                            </FooterWrapper>
                        </Footer>
                    </Body>
                </BodyContainer>
            </Modal>
        </Backdrop>

    )
}

const Backdrop = styled.div`
    z-index: 20;
    position: absolute;
    top: 0;
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
const Footer = styled.div`
width: 100%;

`
const FooterWrapper = styled.div`
height: 100%;
max-width: var(--max-width);
width: 100%;
margin: 0 auto;
display: flex;
align-items: center;
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