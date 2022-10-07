import React from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import style from './AddOrderModalStyle.module.scss'
import { SelectAddOrderModal, openModalAddOrder  } from '../../../../features/modals/modalSlice'
import { Select } from '../../..'
import { provider } from '../../../pages/Order/Selects/Provider'
import { openModalAddProvider } from '../../../../features/modals/modalSlice'
import {
    PlusIconButton,
    Button
} from '../../../'
export const AddOrderModal = () => {
    const dispatch = useDispatch();
    
   
    const now = new Date()
    const day = now.getDate()
    const handleModal = () => {
        dispatch(
            openModalAddOrder(openModalAddProvider())
        )
        console.log('Hola')
    }
  return (
    SelectAddOrderModal.isOpen ? (
        <div className={style.ModalContainer}>
            <div className={style.Modal}>
                <div className={style.ModalHeader}>
                    <h3>Creacion Pedidos</h3>
                    <Button color='error' onClick={handleModal}>x</Button>
                </div>
                <div className={style.ModalBody}>
                    <header >
                        <Select title='Proveedor' data={provider}></Select>
                        <PlusIconButton onClick={handleModal}></PlusIconButton>
                    </header>
                    <div className={style.ProviderInfo}>
                        <div className={style.Group}>
                            <h5>Dirección :</h5>
                            <span></span>
                        </div>
                        <div className={style.Group}>
                            <h5>Teléfono :</h5>
                   
                            
                        </div>
                    </div>
                    <div className={style.ProductBar}>
                        <div className={style.firstLine}>
                            <div className={style.col}>
                                <span>Product</span>
                                
                            </div>
                            <div className={style.col}>
                                <span>Cant</span>
                            </div>
                            <div className={style.col}>
                                <span>Costo</span>
                            </div>
                            <div className={style.col}>
                                <span>Subtotal</span>
                            </div>
                        </div>
                        <div className={style.secondLine}>

                        </div>
                    </div>

                </div>
                <div className={style.ModaFooter}>

                </div>
            </div>
        </div>
    ) : null
  )
}

