import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { MenuApp } from '../../../'
import { PendingOrdersTable } from './components/OrderListTable/PendingOrdersTable'
export const Orders = () => {

  return (
    <Container>
      <MenuApp
        sectionName={'Pedidos'}
      />
      <PendingOrdersTable  />
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