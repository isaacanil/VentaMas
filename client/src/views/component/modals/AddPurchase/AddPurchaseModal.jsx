import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { toggleAddPurchaseModal } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { Button } from '../../../'
import { OrderDetails } from './OrderDetails/OrderDetails'
import { IoMdClose } from 'react-icons/io'
import { PassDataToPurchaseList } from '../../../../firebase/firebaseconfig'
import { CgMathPlus } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux'
import { getOrderData, selectPurchase, cleanPurchase, updateStock, AddProductToPurchase, getInitialCost, SelectProductSelected, SelectProduct, deleteProductFromPurchase, selectProducts, addProvider, setProductSelected, updateProduct } from '../../../../features/Purchase/addPurchaseSlice'
import { StockedProductPicker } from '../../StockedProductPicker/StockedProductPicker'
import { ProductListSelected } from '../../ProductListSelected/ProductListSelected'
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider'
import { selectUser } from '../../../../features/auth/userSlice'
import { fbGetPendingOrders } from '../../../../firebase/order/fbGetPedingOrder'


export const AddPurchaseModal = ({ isOpen }) => {
    const dispatch = useDispatch();
    const selectedProduct = useSelector(SelectProductSelected)
    const user = useSelector(selectUser);
    const provider = useSelector(selectPurchase).provider;
    const { providers } = useFbGetProviders(user);
    const [success, setSuccess] = useState(false);
    const SELECTED_PURCHASE = useSelector(selectPurchase);

    const handleClear = () => dispatch(cleanPurchase());
 
    const handleModal = () => {
        dispatch(toggleAddPurchaseModal());
        handleClear();
    }
  

    const handleSubmit = async () => {
        const { success, error, message } = await PassDataToPurchaseList(user, SELECTED_PURCHASE);
        setSuccess(success)
        console.log(error, message)
    }
    useEffect(() => {
        if (success === true) {
            dispatch(toggleAddPurchaseModal());
            dispatch(cleanPurchase());
        }
    }, [success]);

    const { pendingOrders } = fbGetPendingOrders(user);

    const selectProduct = (product) => dispatch(SelectProduct(product));
    const handleSetSelectedProduct = (obj) => dispatch(setProductSelected(obj));
    const addProduct = () => dispatch(AddProductToPurchase());
    const handleDeleteProduct = (product) => dispatch(deleteProductFromPurchase(product.id));
    const handleUpdateProduct = (product) => dispatch(updateProduct(product));
    return (
        <Container isOpen={isOpen === true ? true : false}>
            <Modal >
                <Header>
                    <WrapperHeader>
                        <h3>Realizar Compra</h3>
                        <Button
                            width='icon24'
                            bgcolor='error'
                            borderRadius='normal'
                            title={<IoMdClose />}
                            onClick={handleModal}
                        />
                    </WrapperHeader>
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
                                onChange={(e) => dispatch(addProvider(e.target.value))}
                            />
                            <Button
                                title={<CgMathPlus />}
                                borderRadius={'normal'}
                                border='light'
                                width={'icon32'}
                                bgcolor='gray'
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
                                title='Comprar'
                                borderRadius={'normal'}
                                bgcolor='primary'
                                onClick={handleSubmit}
                            />
                        </WrapperFooter>
                    </Body>
                </BodyContainer>
            </Modal>
        </Container>

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
    height: 100%;
    background-color: white;
    // border: 1px solid rgba(0, 0, 0, 0.300);
    overflow: hidden;
    display: grid;
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
     width: 100%;
        background-color: #494949;
        padding: 0 1em;
`
const WrapperHeader = styled.div`
    max-width: var(--max-width);
    margin: 0 auto;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
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
const Footer = styled.div`
     width: 100%;
    background-color: #494949;
`
const WrapperFooter = styled.div`
 height: 100%;
    max-width: var(--max-width);
    width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
`

