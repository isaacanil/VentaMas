import React, { useState } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import style from './AddOrderModalStyle.module.scss'
import { SelectAddOrderModal, openModalAddOrder } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { ProductListSelected } from './ProductListSelected/ProductListSelected'
import {
    PlusIconButton,
    Button,
    InputText,
} from '../../../'
import { AddProductButton_OrderPage } from './Button'
import { ProductFilter } from './ProductFilter/ProductFilter'
import { AddProductListSection } from './AddProductListSection/AddProductListSection'
import { OrderDetails } from './OrderDetails/OrderDetails'
import { IoMdClose } from 'react-icons/io'
import { SelectOrder, AddProvider, cleanOrder } from '../../../../features/addOrder/addOrderModalSlice'
import { async } from '@firebase/util'
import { AddOrder } from '../../../../firebase/firebaseconfig'
import { closeModalAddOrder } from '../../../../features/modals/modalSlice'
import { useEffect } from 'react'
import { SelectDataFromOrder } from '../../../../hooks/useSelectDataFromOrder'
import { selectOrderFilterOptions } from '../../../../features/order/ordersSlice'
import { CgMathPlus } from 'react-icons/cg'
export const AddOrderModal = ({ isOpen }) => {
    const dispatch = useDispatch();
    const [provider, setProvider] = useState(undefined);
    const OrderSelected = useSelector(SelectOrder);
    const [reset, setReset] = useState(false);

    useEffect(() => {
        if (provider !== '') {dispatch(AddProvider(provider))}
    }, [provider])
    const handleModal = () => {dispatch(openModalAddOrder())}
    const HandleSubmit = () => {
        dispatch(closeModalAddOrder());
        AddOrder(OrderSelected);
        dispatch(cleanOrder());
        setReset(true)
    }
    const orderFilterOptions = useSelector(selectOrderFilterOptions)
    const providers = SelectDataFromOrder(orderFilterOptions, 'Proveedores')

    return (
        <Container isOpen={isOpen === true ? true : false}>
            <div className={style.Modal}>
                <div className={style.ModalHeader}>
                    <div className={style.ModalWrapperHeader}>
                        <h3>Creación Pedidos</h3>
                        <Button
                            width='icon24'
                            bgcolor='error'
                            borderRadius='normal'
                            title={<IoMdClose />}
                            onClick={handleModal}
                        />
                    </div>
                </div>
                <div className={style.ModalBody}>
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
                            border='light'
                            width={'icon32'}
                            bgcolor='gray'
                        />
                    </header>
                    <AddProductListSection></AddProductListSection>
                    <ProductListSelected></ProductListSelected>
                    <OrderDetails></OrderDetails>
                </div>
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
            </div>
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