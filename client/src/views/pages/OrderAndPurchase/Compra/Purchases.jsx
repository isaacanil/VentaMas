import React, { Fragment } from 'react'
import styled from 'styled-components'
import { PurchaseTable } from './components/PurchasesTable/PurchasesTable'

import { MenuApp } from '../../../'
import { PurchasesReport } from './components/PurchasesReport/PurchasesReport'


export const Purchases = () => {
  
  return (
      <Container>
        <MenuApp sectionName={'Compras'}/>
        <PurchaseTable />
        <PurchasesReport />
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
    align-items: flex-start;
`