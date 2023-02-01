import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { SelectAddOrderModal, openModalAddOrder, toggleAddPurchaseModal } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { ProductListSelected } from './ProductListSelected/ProductListSelected'
import { Button } from '../../../'
import { AddProductListSection } from './AddProductListSection/AddProductListSection'
import { OrderDetails } from './OrderDetails/OrderDetails'
import { IoMdClose } from 'react-icons/io'
import { SelectOrder, cleanOrder } from '../../../../features/addOrder/addOrderModalSlice'
import { AddOrder } from '../../../../firebase/firebaseconfig'
import { closeModalAddOrder } from '../../../../features/modals/modalSlice'
import { SelectDataFromOrder } from '../../../../hooks/useSelectDataFromOrder'
import { selectOrderFilterOptions, selectOrderList, selectPendingOrder } from '../../../../features/order/ordersSlice'
import { CgMathPlus } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux'
import { getOrderData, AddProvider, selectPurchase } from '../../../../features/Purchase/addPurchaseSlice'


export const AddPurchaseModal = ({ isOpen }) => {
    const dispatch = useDispatch();
    const [provider, setProvider] = useState({name: 'Hola', id: 's1d3232'})
    const [orderToPurchase, setOrderToPurchase] = useState(undefined)
    const [reset, setReset] = useState()
    const OrderSelected = useSelector(SelectOrder)
    const now = new Date()
    const day = now.getDate()
    const SELECTED_PURCHASE = useSelector(selectPurchase)

    useEffect(() => {
        if(SELECTED_PURCHASE){
            SELECTED_PURCHASE.provider ? setProvider(SELECTED_PURCHASE.provider) : null
        }
    }, [SELECTED_PURCHASE])
    useEffect(() => {
        if (provider !== undefined) { dispatch(AddProvider(provider)) }
        if (orderToPurchase !== undefined) { dispatch(getOrderData(orderToPurchase)) }
    }, [provider, orderToPurchase])
    const handleModal = () => { 
        dispatch(toggleAddPurchaseModal()) 
        setReset(true)
    }
    const HandleSubmit = () => {
        dispatch(closeModalAddOrder());
        AddOrder(OrderSelected);
        setReset(true)
        dispatch(cleanOrder());
    }
    const orderFilterOptions = useSelector(selectOrderFilterOptions)
    const providers = SelectDataFromOrder(orderFilterOptions, 'Proveedores')
    let pendingOrders = useSelector(selectOrderList)
    pendingOrders = pendingOrders[0]
    console.log(provider)
   
    return (
        <Container isOpen={isOpen === true ? true : false}>
            <Modal>
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
                <Body>
                    <div>
                        <Select
                            setReset={setReset}
                            reset={reset}
                            property='id'
                            title='Pedidos'
                            data={pendingOrders}
                            setValue={setOrderToPurchase}
                        />
                    </div>
                    <header >
                        <Select
                            setReset={setReset}
                            reset={reset}
                            property='name'
                            title='Proveedor'
                            data={providers}
                            setValue={setProvider}
                        />
                        <Button
                            title={<CgMathPlus />}
                            borderRadius={'normal'}
                            border='light'
                            width={'icon32'}
                            bgcolor='gray'
                        />

                    </header>
                    <AddProductListSection></AddProductListSection>
                    <ProductListSelected productsData={SELECTED_PURCHASE.products}></ProductListSelected>
                    <OrderDetails reset={reset} setReset={setReset} purchaseData={SELECTED_PURCHASE}></OrderDetails>
                </Body>
                <Footer>
                    <WrapperFooter>
                        <Button
                            title='Comprar'
                            borderRadius={'normal'}
                            bgcolor='primary'
                            onClick={HandleSubmit}
                        />
                    </WrapperFooter>
                </Footer>
            </Modal>
        </Container>

    )
}

const Container = styled.div`
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
    grid-template-rows: min-content 1fr 2.75em;
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
const Body = styled.div`
    overflow-y: auto;
        max-width: var(--max-width);
        margin: 0 auto;
        width: 100%;
        padding: 0.6em;
        display: grid;
        align-items: flex-start;
        align-content: flex-start;
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
 height: 100%;
    max-width: var(--max-width);
    width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
`

