import React, { Fragment} from 'react'
import styled from 'styled-components'
import {MenuApp} from '../..'
import { PendingOrdersTable } from './components/OrderListTable/PendingOrdersTable'
import { ToolBar } from './ToolBar'
import { ProvidersData, SetProvidersInFilterOptionsMenu } from '../../../firebase/ProviderConfig'
import { OrdersData, SetPendingOrdersInState } from '../../../firebase/OrderConfig'


export const Purchases = () => { 
  const providers = ProvidersData();
  SetProvidersInFilterOptionsMenu(providers);
  const orders = OrdersData()  
  SetPendingOrdersInState(orders)

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