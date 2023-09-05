import React, { Fragment } from 'react'
import styled from 'styled-components'
import { PendingOrdersTable } from './components/OrderListTable/PendingOrdersTable'

import { MenuApp } from '../../../'

export const Purchases = () => {

  return (
      <Container>
        <MenuApp sectionName={'Compras'}/>
        <PendingOrdersTable />
      </Container>
  )
}
const Container = styled.div`
  width: 100%;
    height: 100vh;
    overflow: hidden;
    background-color: var(--color2);
    display: grid;
    grid-template-rows: min-content  1fr;
    justify-content: center;
    align-items: flex-start;
`