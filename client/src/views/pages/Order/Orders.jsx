import React, { Fragment, useEffect, useState } from 'react'
import { Provider, useDispatch } from 'react-redux'
import styled from 'styled-components'
import {
  MenuApp,
  Button,
} from '../../'
import { handleSetOptions } from '../../../features/order/ordersSlice'
import { getProviders } from '../../../firebase/firebaseconfig'
import { PendingOrdersTable } from './components/OrderListTable/PendingOrdersTable'
import { ToolBar } from './ToolBar'
export const Orders = () => { 
  const dispatch = useDispatch();
  const [providers, setProviders] = useState([])
  useEffect(()=>{
    getProviders(setProviders)
  },[])
  useEffect(() =>{
    if(providers.length > 0){
      dispatch(handleSetOptions({optionsID: 'Proveedores', datas: providers, propertyName: 'provider'}))
    }
  },[providers])
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