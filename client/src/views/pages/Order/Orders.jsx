import React, { Fragment } from 'react'
import styled from 'styled-components'
import { Select } from '../../templates/system/Select/Select'
import { providers } from './Selects/Provider'
import { useDispatch } from 'react-redux'
import { openModalAddOrder } from '../../../features/modals/modalSlice'
import { separator } from '../../../hooks/separator'
import { ListItem } from './ListItem/ListItem'
import style from './OrdersStyle.module.scss'
import { TbPlus } from 'react-icons/tb'
import {
  MenuApp,
  Button,
} from '../../'
import { Data } from './Data'
import { OrderListTable } from './components/OrderListTable/OrderListTable'
export const Orders = () => {
  const dispatch = useDispatch()
  const openModal = () => {
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
              <Select data={providers} title='PROVEEDOR'></Select>
              <Select data={providers} title='Estado'></Select>
              <Select data={providers} title='Condición'></Select>
            </div>

            <Button
            borderRadius='normal'
              startIcon={<TbPlus />}
              title='Nuevo pedido'
              onClick={openModal}
            />
          </div>
        </div>
        <OrderListTable />
      </div>
    </div>
  )
}
