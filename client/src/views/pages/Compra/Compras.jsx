import React, { Fragment } from 'react'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import style from './OrdersStyle.module.scss'
import { TbPlus } from 'react-icons/tb'
import {
  MenuApp,
  Button,
} from '../..'
import { PendingOrdersTable } from './components/OrderListTable/PendingOrdersTable'
import { ToolBar } from './ToolBar'
export const Compras = () => { 
  return (
    <Fragment>
      <MenuApp></MenuApp>
      <Container>
        <ToolBar></ToolBar>
        <PendingOrdersTable />
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
  width: 100%;
    height: 100%;
    background-color: var(--color2);
    display: grid;
    grid-auto-rows: min-content;
    justify-content: center;
    align-items: flex-start;
`