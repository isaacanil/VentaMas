import React, { useState } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import style from './AddOrderModalStyle.module.scss'
import { SelectAddOrderModal, openModalAddOrder } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { providers } from '../../../pages/Order/Selects/Provider'
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
export const AddOrderModal = ({ isOpen }) => {
    const dispatch = useDispatch();
    const [provider, setProvider] = useState('')
    const OrderSelected = useSelector(SelectOrder)
    
    const now = new Date()
    const day = now.getDate()
    useEffect(() => {
        if(provider !== ''){
            dispatch(
                AddProvider(provider)
            )
        }
    }, [provider])
    const handleModal = () => {
        dispatch(
            openModalAddOrder()
        )
    }
    const HandleSubmit = () => {
        dispatch(
            closeModalAddOrder()
        );
        AddOrder(OrderSelected);
        dispatch(cleanOrder());
    }

    console.log(OrderSelected)
    return (
        isOpen ? (
            <div className={style.ModalContainer}>
                <div className={style.Modal}>
                    <div className={style.ModalHeader}>
                        <h3>Creación Pedidos</h3>
                        <Button
                            width='icon24'
                            bgcolor='error'
                            title={<IoMdClose />}
                            onClick={handleModal}
                        />
                    </div>
                    <div className={style.ModalBody}>
                        <header >
                            <Select
                                title='Proveedor'
                                data={providers}
                                setValue={setProvider}
                                value={provider}
                            ></Select>
                            <PlusIconButton onClick={handleModal}></PlusIconButton>
                        </header>
                        <AddProductListSection></AddProductListSection>
                        <ProductListSelected></ProductListSelected>
                        <OrderDetails></OrderDetails>
                    </div>
                    <div className={style.ModaFooter}>
                        <Button
                            title='Crear Pedido'
                            onClick={HandleSubmit}
                        />
                    </div>
                </div>
            </div>
        ) : null
    )
}

