import React from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import style from './AddOrderModalStyle.module.scss'
import { SelectAddOrderModal, openModalAddOrder } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { provider } from '../../../pages/Order/Selects/Provider'
import { ProductListSelected} from './ProductListSelected/ProductListSelected' 
import {
    PlusIconButton,
    Button,
    InputText
} from '../../../'
import { TbPlus } from 'react-icons/tb'
import { AddProductButton_OrderPage } from './Button'
import { ProductFilter } from './ProductFilter/ProductFilter'

import { AddProductListSection } from './AddProductListSection/AddProductListSection'
import { OrderDetails } from './OrderDetails/OrderDetails'
export const AddOrderModal = ({ isOpen }) => {
    const dispatch = useDispatch();

    const now = new Date()
    const day = now.getDate()
    const handleModal = () => {
        dispatch(
            openModalAddOrder()
        )

    }
    return (
        isOpen ? (
            <div className={style.ModalContainer}>
                <div className={style.Modal}>
                    <div className={style.ModalHeader}>
                        <h3>Creación Pedidos</h3>
                        <Button color='error' onClick={handleModal}>x</Button>
                    </div>
                    <div className={style.ModalBody}>
                        <header >
                            <Select title='Proveedor' data={provider}></Select>
                            <PlusIconButton onClick={handleModal}></PlusIconButton>
                        </header>
                        {/* <div className={style.ProviderInfo}>
                            <div className={style.Group}>
                                <h5>Dirección :</h5>
                                <span></span>
                            </div>
                            <div className={style.Group}>
                                <h5>Teléfono :</h5>


                            </div>
                        </div> */}
                            <AddProductListSection></AddProductListSection>
                            <ProductListSelected></ProductListSelected>
                            <OrderDetails></OrderDetails>
                    </div>
                    <div className={style.ModaFooter}>
                        <Button>Crear Pedido</Button>
                    </div>
                </div>
            </div>
        ) : null
    )
}

