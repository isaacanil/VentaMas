import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { toggleAddPurchaseModal } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { Button } from '../../../'
import { OrderDetails } from './OrderDetails/OrderDetails'
import { IoMdClose } from 'react-icons/io'
import { SelectOrder } from '../../../../features/addOrder/addOrderModalSlice'
import { PassDataToPurchaseList } from '../../../../firebase/firebaseconfig'
import { SelectDataFromOrder } from '../../../../hooks/useSelectDataFromOrder'
import { selectOrderFilterOptions, selectOrderList, selectPendingOrder } from '../../../../features/order/ordersSlice'
import { CgMathPlus } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux'
import { getOrderData, AddProvider, selectPurchase, cleanPurchase, updateStock, AddProductToPurchase, getInitialCost, SelectProductSelected, SelectProduct, deleteProductFromPurchase, selectProducts } from '../../../../features/Purchase/addPurchaseSlice'
import { StockedProductPicker } from '../../StockedProductPicker/StockedProductPicker'
import { ProductListSelected } from '../../ProductListSelected/ProductListSelected'

export const AddPurchaseModal = ({ isOpen }) => {
    const dispatch = useDispatch();
    const [provider, setProvider] = useState(null)
    const [orderToPurchase, setOrderToPurchase] = useState(null)
    const [reset, setReset] = useState()
    const productSelected = useSelector(SelectProductSelected)
    const productsSelected = useSelector(selectProducts)
    const [prevProvider, setPrevProvider] = useState(null)
    const now = new Date()
    const day = now.getDate()
    const SELECTED_PURCHASE = useSelector(selectPurchase)

    useEffect(() => {
        const provider = SELECTED_PURCHASE.provider;
        if (!provider) return;
        if (provider.id !== null && provider.name !== null) {
            setProvider({
                name: provider.name,
                id: provider.id
            });
        }
    }, [SELECTED_PURCHASE.provider]);

    useEffect(() => {
        if (provider !== null && provider !== prevProvider) {
            dispatch(AddProvider(provider))
        }
        setPrevProvider(provider);
    }, [provider]);

    useEffect(() => {
        if (orderToPurchase) {
            dispatch(getOrderData(orderToPurchase));
        }
    }, [orderToPurchase]);

    useEffect(() => {
        const order = SELECTED_PURCHASE;
        if (!order) return;
        if (order.id !== null) {
            setOrderToPurchase({
                ...orderToPurchase,
                id: order.id
            });
        }
    }, [SELECTED_PURCHASE]);

    const handleModal = () => {
        dispatch(toggleAddPurchaseModal());
        setReset(true);
        dispatch(cleanPurchase());
    }

    const handleSubmit = () => {
        dispatch(toggleAddPurchaseModal());
        PassDataToPurchaseList(SELECTED_PURCHASE);
        setReset(true);
        dispatch(cleanPurchase());
    }

    const orderFilterOptions = useSelector(selectOrderFilterOptions)
    const providers = SelectDataFromOrder(orderFilterOptions, 'Proveedores')
    let pendingOrders = useSelector(selectOrderList);
    pendingOrders = pendingOrders[0]
 

    const handleAddProduct = ({ stock, initialCost, cost }) => {
        dispatch(updateStock({ stock }))
        dispatch(getInitialCost({ initialCost, cost }))
        dispatch(AddProductToPurchase())
    }

    const handleSelectProduct = (data) => {
        dispatch(SelectProduct(data))
    }
    
    const handleDeleteProduct = (product) => {
        dispatch(deleteProductFromPurchase(product.id))
    }

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
                                setReset={setReset}
                                reset={reset}
                                property='id'
                                title='Pedidos'
                                data={pendingOrders}
                                value={orderToPurchase}
                                setValue={setOrderToPurchase}
                            />
                            <Select
                                setReset={setReset}
                                reset={reset}
                                property='name'
                                title='Proveedor'
                                data={providers}
                                value={provider}
                                setValue={setProvider}
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
                            fn={handleAddProduct}
                            handleSelectProduct={handleSelectProduct}
                            productSelected={productSelected}
                        />
                        <ProductListSelected
                            productsSelected={SELECTED_PURCHASE.products}
                            productsTotalPrice={SELECTED_PURCHASE.totalPurchase}
                            handleDeleteProduct={handleDeleteProduct}
                        />
                        <OrderDetails
                            reset={reset}
                            setReset={setReset}
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

