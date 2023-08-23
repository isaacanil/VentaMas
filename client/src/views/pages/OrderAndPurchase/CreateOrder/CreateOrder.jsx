import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

import { CgMathPlus } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux'

import { ButtonGroup, MenuApp, Select } from '../../..'
import { Button } from '../../..'

import { SelectDataFromOrder } from '../../../../hooks/useSelectDataFromOrder'
import { StockedProductPicker } from '../../../component/StockedProductPicker/StockedProductPicker'
import { ProductListSelected } from '../../../component/ProductListSelected/ProductListSelected'

import { selectUser } from '../../../../features/auth/userSlice'
import { fbGetPendingOrders } from '../../../../firebase/order/fbGetPedingOrder'
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider'
import {
    AddProductToOrder,
    AddProvider,
    DeleteProduct,
    SelectOrder,
    SelectProduct,
    SelectProductSelected,
    SelectProducts,
    SelectTotalPurchase,
    cleanOrder,
    setProductSelected,
    updateProduct
} from '../../../../features/addOrder/addOrderModalSlice'
import { OrderDetails } from '../../../component/modals/AddOrder/OrderDetails/OrderDetails'
import { addNotification } from '../../../../features/notification/NotificationSlice'
import { closeModalAddOrder } from '../../../../features/modals/modalSlice'
import { AddOrder } from '../../../../firebase/firebaseconfig'
import { useNavigate } from 'react-router-dom'
import ROUTES_PATH from '../../../../routes/routesName'

export const CreateOrder = () => {
    const dispatch = useDispatch();
    const OrderSelected = useSelector(SelectOrder);
    const selectedProduct = useSelector(SelectProductSelected);
    const productsSelected = useSelector(SelectProducts);
    const provider = OrderSelected.provider;
    const {ORDERS} = ROUTES_PATH.PURCHASE_TERM
    const navigate = useNavigate()
    const user = useSelector(selectUser);
    const { providers } = useFbGetProviders(user);
    const productTotalPurchasePrice = useSelector(SelectTotalPurchase)

    const handleClose = () => {
        dispatch(cleanOrder());
        navigate(ORDERS)
    }
    const HandleSubmit = async () => {
        if (!OrderSelected?.provider  || OrderSelected?.provider?.id == "") {
            dispatch(addNotification({ title: 'Error', message: 'Agregue el proveedor', type: 'error' }))
            return
        }
        if (OrderSelected.replenishments.length <= 0) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue un producto', type: 'error' }))
            return
        }
        if (!OrderSelected.dates.deliveryDate) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Fecha de entrega', type: 'error' }))
            return
        }
        if (!OrderSelected.condition) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Condición', type: 'error' }))
            return
        }
        try {
            await AddOrder(user, OrderSelected)
                .then(() => {
                    dispatch(addNotification({ message: 'Pedido Creado', type: 'success' }))
                    dispatch(closeModalAddOrder());
                    handleClose();
                
                })
        } catch (error) {
            setTimeout(() => {
                dispatch(addNotification({ title: 'Error', message: `${error}`, type: 'error' }))
            }, 1000)
        }

    }
    const handleCancel = () => {
        dispatch(cleanOrder());
       // dispatch(closeModalAddOrder());
        navigate(ORDERS)
    }
    const selectProduct = (product) => dispatch(SelectProduct(product));
    const handleSetSelectedProduct = (obj) => dispatch(setProductSelected(obj));
    const addProduct = () => dispatch(AddProductToOrder());
    const handleDeleteProduct = (product) => dispatch(DeleteProduct(product.id));
    const handleUpdateProduct = (product) => dispatch(updateProduct(product));

    return (

        <Modal>
            <Header>
                <MenuApp
                    sectionName='Nuevo Pedido'
                />
            </Header>
            <BodyContainer>
                <Body>
                    <ToolBar >
                        <Select
                            title='Proveedor'
                            data={providers}
                            onChange={(e) => dispatch(AddProvider(e.target.value?.provider))}
                            displayKey={'provider.name'}
                            value={provider?.name}
                        />
                    </ToolBar>
                    <StockedProductPicker
                        addProduct={addProduct}
                        selectProduct={selectProduct}
                        selectedProduct={selectedProduct}
                        setProductSelected={handleSetSelectedProduct}
                    />
                    <ProductListSelected
                        productsSelected={productsSelected}
                        productsTotalPrice={productTotalPurchasePrice}
                        handleDeleteProduct={handleDeleteProduct}
                        handleUpdateProduct={handleUpdateProduct}
                    />
                    <OrderDetails/>
                    <WrapperFooter>
                    <ButtonGroup>
                            <Button
                                title='Cancelar'
                                borderRadius={'normal'}
                                bgcolor='gray'
                                height={'large'}
                                onClick={handleCancel}
                            />
                            <Button
                                title='Guardar'
                                borderRadius={'normal'}
                                bgcolor='primary'
                                height={'medium'}
                                onClick={HandleSubmit}
                            />
                        </ButtonGroup>
                    </WrapperFooter>

                </Body>
            </BodyContainer>
        </Modal>


    )
}

const Modal = styled.div`
    max-width: 100%;
    width: 100%;
    height: 100vh;
    background-color: var(--color2);
    overflow: hidden;
 
    display: grid;
    gap: 0.6em;
    grid-template-rows: min-content 1fr;
`
const ToolBar = styled.div`
    width: 100%;
    display: flex;
    gap: 10px;

`
const Group = styled.div`
    display: flex;
    gap: 0.4em;
`

const Header = styled.div`
    
`
const WrapperHeader = styled.div`
    max-width: var(--max-width);
    margin: 0 auto;
    width: 100%;
    background-color: var(--color2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
`
const BodyContainer = styled.div`

    overflow: hidden;
    display: grid;
    border-radius: var(--border-radius);
    background-color: white;
    max-width: var(--max-width);
    width: 100%;
    margin: 0 auto;
`
const Body = styled.div`
        height: 100%;
        width: 100%;
        padding: 0.6em;
        overflow-y: scroll;
        display: grid;
        grid-template-rows: min-content min-content minmax(270px, 1fr) min-content min-content;
        align-items: start;
        gap: 0.6em;
       
        header {
            display: flex;
            gap: 1em;
        }
`
const Footer = styled.div`
     width: 100%;
    background-color: #494949;
`
const WrapperFooter = styled.div`
    height: 3em;
    max-width: var(--max-width);
    background-color: #ffffff;
    width: 100%;
    padding: 0.4em 0.6em;
    justify-content: right;
    border: var(--border-primary);
    border-radius: var(--border-radius);
    position: sticky;
    z-index: 5;
    bottom: 0;
    margin: 0 auto;
    display: flex;
`