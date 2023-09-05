import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { IoMdClose } from 'react-icons/io'
import { CgMathPlus } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux'
import { ButtonGroup, MenuApp, Select } from '../../..'
import { Button } from '../../..'
import { toggleAddPurchaseModal } from '../../../../features/modals/modalSlice'
import { PassDataToPurchaseList } from '../../../../firebase/firebaseconfig'
import { getOrderData, addProvider, selectPurchase, cleanPurchase, updateStock, AddProductToPurchase, getInitialCost, SelectProductSelected, SelectProduct, deleteProductFromPurchase, selectProducts, setProductSelected, updateProduct } from '../../../../features/Purchase/addPurchaseSlice'
import { StockedProductPicker } from '../../../component/StockedProductPicker/StockedProductPicker'
import { ProductListSelected } from '../../../component/ProductListSelected/ProductListSelected'
import { selectUser } from '../../../../features/auth/userSlice'
import { fbGetPendingOrders } from '../../../../firebase/order/fbGetPedingOrder'
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider'
import { useNavigate } from 'react-router-dom'
import ROUTES_PATH from '../../../../routes/routesName'
import { addNotification } from '../../../../features/notification/NotificationSlice'
import { PurchaseDetails } from './PurchaseDetails/PurchaseDetails'

export const AddPurchase = () => {
    const dispatch = useDispatch();
    const selectedProduct = useSelector(SelectProductSelected)
    const user = useSelector(selectUser);
    const provider = useSelector(selectPurchase).provider;
    const { providers } = useFbGetProviders(user);
    const [success, setSuccess] = useState(false);
    const SELECTED_PURCHASE = useSelector(selectPurchase);
    const navigate = useNavigate();
    const { PURCHASES } = ROUTES_PATH.PURCHASE_TERM
    const handleClear = () => dispatch(cleanPurchase());

    const handleClose = () => {
        // dispatch(toggleAddPurchaseModal());
        handleClear();
        navigate(PURCHASES);
    }

    const handleSubmit = async () => {
        if (!SELECTED_PURCHASE?.provider || SELECTED_PURCHASE?.provider?.id == "") {
            dispatch(addNotification({ title: 'Error', message: 'Agregue el proveedor', type: 'error' }))
            return
        }
        if (SELECTED_PURCHASE.replenishments.length <= 0) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue un producto', type: 'error' }))
            return
        }
        if (!SELECTED_PURCHASE.dates.deliveryDate) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Fecha de entrega', type: 'error' }))
            return
        }
        if (!SELECTED_PURCHASE.condition) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Condición', type: 'error' }))
            return
        }
        const { success, error, message } = await PassDataToPurchaseList(user, SELECTED_PURCHASE);
        setSuccess(success)
        console.log(error, message)
    }
    const handleCancel = () => {
        navigate(-1);
        handleClear();
    }
    useEffect(() => {
        if (success === true) {
            handleClose();
        }
    }, [success]);

    const { pendingOrders } = fbGetPendingOrders(user);

    const selectProduct = (product) => dispatch(SelectProduct(product));
    const handleSetSelectedProduct = (obj) => dispatch(setProductSelected(obj));
    const addProduct = () => dispatch(AddProductToPurchase());
    const handleDeleteProduct = (product) => dispatch(deleteProductFromPurchase(product.id));
    const handleUpdateProduct = (product) => dispatch(updateProduct(product));

    return (
        <Modal >
            <Header>
                <MenuApp
                    sectionName='Realizar Compra'
                />
            </Header>
            <BodyContainer>
                <Body>
                    <ToolBar>
                        <Select
                            title='Pedidos'
                            data={pendingOrders}
                            value={SELECTED_PURCHASE.id}
                            displayKey={'data.id'}
                            onNoneOptionSelected={handleClear}
                            onChange={(e) => dispatch(getOrderData(e.target.value?.data))}
                        />
                        <Select
                            title='Proveedor'
                            data={providers}
                            value={provider?.name}
                            displayKey={'provider.name'}
                            onChange={(e) => dispatch(addProvider(e.target.value?.provider))}
                        />
                    </ToolBar>
                    <StockedProductPicker
                        addProduct={addProduct}
                        selectProduct={selectProduct}
                        selectedProduct={selectedProduct}
                        setProductSelected={handleSetSelectedProduct}
                    />
                    <ProductListSelected
                        productsSelected={SELECTED_PURCHASE.replenishments}
                        productsTotalPrice={SELECTED_PURCHASE.total}
                        handleDeleteProduct={handleDeleteProduct}
                        handleUpdateProduct={handleUpdateProduct}
                    />
                    <PurchaseDetails
                        SELECTED_PURCHASE={SELECTED_PURCHASE}
                    />
                    <Footer>
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
                                onClick={handleSubmit}
                            />
                        </ButtonGroup>
                    </Footer>
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

const Header = styled.div`
    
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
        grid-template-rows: min-content min-content minmax(200px, 1fr) min-content min-content;
        align-items: start;
        gap: 0.6em;
       
        header {
            display: flex;
            gap: 1em;
        }
`
const Footer = styled.div`
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