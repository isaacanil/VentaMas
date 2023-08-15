import React, { Fragment } from 'react'
import styled from 'styled-components'
import { PendingOrdersTable } from './components/OrderListTable/PendingOrdersTable'
import { ProvidersData, SetProvidersInFilterOptionsMenu } from '../../../firebase/ProviderConfig'
import { MenuApp } from '../../templates/MenuApp/MenuApp'

export const Purchases = () => {
  const providers = ProvidersData();
  SetProvidersInFilterOptionsMenu(providers);



  return (
    <Fragment>
      <Container>
        <MenuApp></MenuApp>
        <PendingOrdersTable />
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
  width: 100%;
    height: 100vh;
    overflow: hidden;
    background-color: var(--color2);
    display: grid;
    grid-auto-rows: min-content;
    grid-template-rows: min-content  1fr;
    justify-content: center;
    align-items: flex-start;
`