import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { MenuApp } from '../../'
import { ProvidersData, SetProvidersInFilterOptionsMenu } from '../../../firebase/ProviderConfig'
import { PendingOrdersTable } from './components/OrderListTable/PendingOrdersTable'
import { ToolBar } from './ToolBar'
export const Orders = () => { 
  const providers = ProvidersData();
  SetProvidersInFilterOptionsMenu(providers);
  return (
    <Fragment>
      <Container>
        <MenuApp></MenuApp>
        <ToolBar></ToolBar>
        <PendingOrdersTable />
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
  width: 100%;
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-auto-rows: min-content;
    justify-content: center;
    align-items: flex-start;
`