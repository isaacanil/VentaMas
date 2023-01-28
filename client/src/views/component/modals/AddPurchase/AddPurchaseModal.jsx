import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { SelectAddOrderModal, openModalAddOrder, toggleAddPurchaseModal } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { ProductListSelected } from './ProductListSelected/ProductListSelected'
import { Button } from '../../../'
import { AddProductListSection } from './AddProductListSection/AddProductListSection'
import { OrderDetails } from './OrderDetails/OrderDetails'
import { IoMdClose } from 'react-icons/io'
import { SelectOrder, AddProvider, cleanOrder } from '../../../../features/addOrder/addOrderModalSlice'
import { AddOrder } from '../../../../firebase/firebaseconfig'
import { closeModalAddOrder } from '../../../../features/modals/modalSlice'
import { SelectDataFromOrder } from '../../../../hooks/useSelectDataFromOrder'
import { selectOrderFilterOptions, selectOrderList, selectPendingOrder } from '../../../../features/order/ordersSlice'
import { CgMathPlus } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux'

export const AddPurchaseModal = ({ isOpen }) => {
    const dispatch = useDispatch();
    const [provider, setProvider] = useState('')

    const OrderSelected = useSelector(SelectOrder)
    const now = new Date()
    const day = now.getDate()
    useEffect(() => {
        if (provider !== '') { dispatch(AddProvider(provider)) }
    }, [provider])
    const handleModal = () => { dispatch(toggleAddPurchaseModal()) }
    const HandleSubmit = () => {
        dispatch(closeModalAddOrder());
        AddOrder(OrderSelected);
        dispatch(cleanOrder());
    }
    const orderFilterOptions = useSelector(selectOrderFilterOptions)
    const providers = SelectDataFromOrder(orderFilterOptions, 'Proveedores')
    let pendingOrders = useSelector(selectOrderList)
    pendingOrders = pendingOrders[0]
    console.log(pendingOrders, providers)
    
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
                            property='id'
                            title='Pedidos'
                            data={pendingOrders}
                            setValue={setProvider}
                        >
                        </Select>
                    </div>
                    <header >
                        <Select
                            property='name'
                            title='Proveedor'
                            data={providers}
                            setValue={setProvider}
                        ></Select>
                        <Button
                            title={<CgMathPlus />}
                            borderRadius={'normal'}
                            border='light'
                            width={'icon32'}
                            bgcolor='gray'
                        />
                       
                    </header>
                    <AddProductListSection></AddProductListSection>
                    <ProductListSelected></ProductListSelected>
                    <OrderDetails></OrderDetails>
                </Body>
                <Footer>
                    <WrapperFooter>
                        <Button
                            title='Crear Pedido'
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

