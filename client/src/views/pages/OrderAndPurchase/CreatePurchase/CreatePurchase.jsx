import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { IoMdClose } from 'react-icons/io'
import { CgMathPlus } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux'
import { MenuApp, Select } from '../../..'
import { Button } from '../../..'
import { toggleAddPurchaseModal } from '../../../../features/modals/modalSlice'
import { PassDataToPurchaseList } from '../../../../firebase/firebaseconfig'
import { getOrderData, addProvider, selectPurchase, cleanPurchase, updateStock, AddProductToPurchase, getInitialCost, SelectProductSelected, SelectProduct, deleteProductFromPurchase, selectProducts, setProductSelected } from '../../../../features/Purchase/addPurchaseSlice'
import { SelectDataFromOrder } from '../../../../hooks/useSelectDataFromOrder'
import { StockedProductPicker } from '../../../component/StockedProductPicker/StockedProductPicker'
import { ProductListSelected } from '../../../component/ProductListSelected/ProductListSelected'
import { OrderDetails } from '../../../component/modals/AddPurchase/OrderDetails/OrderDetails'
import { selectUser } from '../../../../features/auth/userSlice'
import { fbGetPendingOrders } from '../../../../firebase/order/fbGetPedingOrder'
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider'
import { useNavigate } from 'react-router-dom'
import ROUTES_PATH from '../../../../routes/routesName'
import { addNotification } from '../../../../features/notification/NotificationSlice'

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
        if (!SELECTED_PURCHASE?.provider  || SELECTED_PURCHASE?.provider?.id == "") {
            dispatch(addNotification({ title: 'Error', message: 'Agregue el proveedor', type: 'error' }))
            return
        }
        if (SELECTED_PURCHASE.replenishments.length <= 0) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue un producto', type: 'error' }))
            return
        }
        if (!SELECTED_PURCHASE.date) {
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
    useEffect(() => {
        if (success === true) {
            // dispatch(toggleAddPurchaseModal());

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
                    <OrderDetails
                        SELECTED_PURCHASE={SELECTED_PURCHASE}
                    />
                    <WrapperFooter>
                        <Button
                            title='Realizar Comprar'
                            borderRadius={'normal'}
                            bgcolor='primary'
                            onClick={handleSubmit}
                        />
                    </WrapperFooter>
                </Body>
            </BodyContainer>

        </Modal>


    )
}

const Container = styled.div`
    z-index: 20;
    position: absolute;
    top: 0px;
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
    transition-duration: 400ms, 1000ms, 300ms;
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
                transition-duration: 400ms, 500ms, 500ms;
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
    height: 100vh;
    background-color: var(--color2);
    overflow: hidden;
 
    display: grid;
    gap: 1em;
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
        grid-template-rows: min-content min-content minmax(200px, 1fr) min-content min-content;
        align-items: start;
        gap: 1em;
       
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
    bottom: 0;
    margin: 0 auto;
    display: flex;
`