import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import { clearCashCount } from '../../../features/cashCount/cashCountManagementSlice'
import { useCashCountClosingPrompt } from '../../../hooks/cashCount/useCashCountClosingPrompt'

import { CashReconciliationTable } from './components/Body/CashRecociliationTable'
import { Header } from './components/Header/Header'

export const CashReconciliation = () => {
  useCashCountClosingPrompt();

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(clearCashCount())
  }, []);

  return (
    <Container>
        <Header />
        <CashReconciliationTable /> 
    </Container>
  )
}

const Container = styled.div`
    height: 100%;
    width: 100%;
    display: grid;
    grid-template-rows: min-content 1fr;
    background-color: var(--color2);
    overflow-y: hidden;
`
