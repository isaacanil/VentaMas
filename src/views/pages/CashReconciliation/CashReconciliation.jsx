import { useEffect } from 'react'
import styled from 'styled-components'
import { Header } from './components/Header/Header'
import { CashReconciliationTable } from './components/Body/CashRecociliationTable'
import { useDispatch } from 'react-redux'
import { clearCashCount } from '../../../features/cashCount/cashCountManagementSlice'
import { useCashCountClosingPrompt } from '../../../hooks/cashCount/useCashCountClosingPrompt'

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
