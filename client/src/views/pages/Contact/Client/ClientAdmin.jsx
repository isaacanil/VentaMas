import React, { Fragment } from 'react'
import styled from 'styled-components'

import {
  MenuApp,
  Button,
} from '../../../'
import { CreateContact } from './components/CreateContact/CreateContact'
import { PendingOrdersTable } from './components/OrderListTable/PendingOrdersTable'
import { ToolBar } from './ToolBar'
export const ClientAdmin = () => { 
  return (
    <Fragment>
      <MenuApp></MenuApp>
      <CreateContact></CreateContact>
      <Container>
        <ToolBar></ToolBar>
        <PendingOrdersTable />
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
    width: 100vw;
    height: calc(100vh - 2.75em);
    background-color: var(--color2);
    display: grid;
    grid-auto-rows: min-content;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
    
`