import React from 'react'
import styled from 'styled-components'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { Header } from './components/Header/Header'
import { CashReconciliationTable } from './components/Body/CashRecociliationTable'
import { ConfirmationDialog } from '../../component/modals/UserNotification/components/ConfirmationDialog/ConfirmationDialog'

export const CashReconciliation = () => {

  return (
    <Container>
        <Header />
        <CashReconciliationTable /> 
    </Container>
  )
}

const Container = styled.div`
    height: 100vh;
    width: 100%;
    display: grid;
    grid-template-rows: min-content 1fr;
    background-color: var(--color2);
    overflow-y: hidden;
`