import React, { Fragment } from 'react'
import styled from 'styled-components'
import { Select } from '../../templates/system/Select/Select'
import { provider } from './Selects/Provider'
import { useDispatch } from 'react-redux'
import { openModalAddOrder } from '../../../features/modals/modalSlice'
import { separator } from '../../../hooks/separator'
import { ListItem } from './ListItem/ListItem'
import style from './OrdersStyle.module.scss'
import { TbPlus } from 'react-icons/tb'
import {
  MenuApp,
  ButtonGroup,
  Button,
  PurchaseButton,
  EditButton,
  DeleteButton,
  ArrowRightButton,
  StatusIndicatorDot
} from '../../'
import { Data } from './Data'
import { OrderListTable } from './components/OrderListTable/OrderListTable'
export const Orders = () => {
  const dispatch = useDispatch()
  const openModal = () => {
    //console.log('click')
    dispatch(
      openModalAddOrder()
    )
  }
  return (
    <div className={style.Container}>
      <MenuApp></MenuApp>
      <div className={style.Order}>
        <div className={style.FilterBar}>
          <div className={style.FilterBarWrapper}>
            <div className={style.FilterOptions}>
              <Select data={provider} title='PROVEEDOR'></Select>
              <Select data={provider} title='Estado'></Select>
              <Select data={provider} title='Condición'></Select>
            </div>
          
              <Button onClick={openModal}>
                <TbPlus /><span>Agregar Pedido</span>
              </Button>
           
          </div>
        </div>
        <OrderListTable />
      </div>
    </div>
  )
}
