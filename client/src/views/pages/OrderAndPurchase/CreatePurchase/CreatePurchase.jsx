import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { ButtonGroup, MenuApp, Select } from '../../..'
import { Button } from '../../..'
import { getOrderData, selectPurchase, cleanPurchase, AddProductToPurchase, SelectProductSelected, SelectProduct, deleteProductFromPurchase, setProductSelected, updateProduct, setPurchase } from '../../../../features/Purchase/addPurchaseSlice'
import { StockedProductPicker } from '../../../component/StockedProductPicker/StockedProductPicker'
import { ProductListSelected } from '../../../component/ProductListSelected/ProductListSelected'
import { selectUser } from '../../../../features/auth/userSlice'
import { fbGetPendingOrders } from '../../../../firebase/order/fbGetPedingOrder'
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider'
import { useNavigate } from 'react-router-dom'
import ROUTES_PATH from '../../../../routes/routesName'
import { addNotification } from '../../../../features/notification/NotificationSlice'
import { PurchaseDetails } from './PurchaseDetails/PurchaseDetails'
import { fbTransformOrderToPurchase } from '../../../../firebase/purchase/fbPreparePurchaseDocument'
import Loader from '../../../templates/system/loader/Loader'

export const AddPurchase = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState({
        isOpen: false,
        message: ''
    });
    const user = useSelector(selectUser);

    const selectedProduct = useSelector(SelectProductSelected);
    const purchase = useSelector(selectPurchase);
    const provider = useSelector(selectPurchase).provider;

    const { providers } = useFbGetProviders(user);
    const { pendingOrders } = fbGetPendingOrders(user);

    const { PURCHASES } = ROUTES_PATH.PURCHASE_TERM;
    const [imgReceipt, setImgReceipt] = useState(null)

    const handleClear = () => dispatch(cleanPurchase());

    const handleClose = () => {
        handleClear();
        navigate(PURCHASES);
    }

    const handleCancel = () => {
        navigate(-1);
        handleClear();
    }

    const handleSubmit = async () => {
        if (!purchase?.provider || purchase?.provider?.id == "") {
            dispatch(addNotification({ title: 'Error', message: 'Agregue el proveedor', type: 'error' }))
            return
        }
        if (purchase.replenishments.length <= 0) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue un producto', type: 'error' }))
            return
        }
        if (!purchase.dates.deliveryDate) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Fecha de entrega', type: 'error' }))
            return
        }
        if(!purchase.dates.paymentDate){
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Fecha de pago', type: 'error' }))
            return
        }
        if (!purchase.condition) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Condición', type: 'error' }))
            return
        }
        try {
            await fbTransformOrderToPurchase(user, purchase, imgReceipt, setLoading);
            dispatch(addNotification({ title: 'Exito', message: 'Compra realizada', type: 'success' }))
            handleClose();
            console.log("Transformación completada exitosamente");
        } catch (error) {
            dispatch(addNotification({ title: 'Error', message: 'Error al realizar la compra', type: 'error' }))
            console.error("Hubo un error al transformar la orden en una compra:", error);
        }
    }

    const selectProduct = (product) => dispatch(SelectProduct(product));
    const handleSetSelectedProduct = (obj) => dispatch(setProductSelected(obj));
    const addProduct = () => dispatch(AddProductToPurchase());
    const handleDeleteProduct = (product) => dispatch(deleteProductFromPurchase(product.id));
    const handleUpdateProduct = (product) => dispatch(updateProduct(product));

    return (
        <Modal >
            <Loader show={loading.isOpen} useRedux={false} message={loading.message} theme='light' />
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
                            value={purchase.numberId}
                            displayKey={'data.numberId'}
                            onNoneOptionSelected={handleClear}
                            onChange={(e) => dispatch(getOrderData(e.target.value?.data))}
                        />
                        <Select
                            title='Proveedor'
                            data={providers}
                            value={provider?.name}
                            displayKey={'provider.name'}
                            onChange={(e) => dispatch(setPurchase({ provider: e.target.value?.provider }))}
                        />
                    </ToolBar>
                    <StockedProductPicker
                        addProduct={addProduct}
                        selectProduct={selectProduct}
                        selectedProduct={selectedProduct}
                        setProductSelected={handleSetSelectedProduct}
                    />
                    <ProductListSelected
                        productsSelected={purchase.replenishments}
                        productsTotalPrice={purchase.total}
                        handleDeleteProduct={handleDeleteProduct}
                        handleUpdateProduct={handleUpdateProduct}
                    />
                    <PurchaseDetails
                        purchase={purchase}
                        imgReceipt={imgReceipt}
                        setImgReceipt={setImgReceipt}
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
        padding: 1em;
        overflow-y: scroll;
        display: grid;
        grid-template-rows: min-content min-content minmax(200px, 1fr) min-content min-content;
        align-items: start;
        gap: 1em;
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