import React, { useEffect } from 'react'
import styled from 'styled-components'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { Header } from './components/Header/Header'
import { CashReconciliationTable } from './components/Body/CashRecociliationTable'
import { ConfirmationDialog } from '../../component/modals/UserNotification/components/ConfirmationDialog/ConfirmationDialog'
import { useDispatch } from 'react-redux'
import { clearCashCount } from '../../../features/cashCount/cashCountManagementSlice'

export const CashReconciliation = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(clearCashCount())
  }, [])
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