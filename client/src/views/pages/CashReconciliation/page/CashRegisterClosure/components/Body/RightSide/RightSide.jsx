import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { CashDenominationCalculator } from '../../../../../global/CashDenominationCalculator/CashDenominationCalculator'
import { TransactionSummary } from './components/TransactionSummary/TransactionSummary'
import { CashBoxClosureDetails } from './components/CashBoxClosureDetails/CashBoxClosureDetails'
import { TextareaV2 } from '../../../Comments/TextareaV2'
import { ViewInvoice } from './components/ViewInvoive/ViewInvoice'
import { Comments } from '../../../Comments/Comments'
import { selectCashCount, setCashCountClosingBanknotes, setCashCountClosingComments, } from '../../../../../../../../features/cashCount/cashCountSlide'
import { useDispatch, useSelector } from 'react-redux'
import { DateSection } from '../../Header/DateSection'
import { selectUser } from '../../../../../../../../features/auth/userSlice'
import { fbLoadInvoicesForCashCount } from '../../../../../../../../firebase/cashCount/fbLoadInvoicesForCashCount'

export const RightSide = ({ calculationIsOpen, setCalculationIsOpen, date }) => {
  const CashReconciliation = useSelector(selectCashCount)
  const { sales, id, state } = CashReconciliation
  const { banknotes } = CashReconciliation.closing;
  const [invoices, setInvoices] = useState([])
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const handleChangesComments = (comments) => {
    dispatch(setCashCountClosingComments(comments))
  }

  const handleChangesBanknotes = (banknotes) => {
    dispatch(setCashCountClosingBanknotes(banknotes))
  }
  useEffect(() => {
    const fetchData = async () => {
      const invoicesData = await fbLoadInvoicesForCashCount(user, id, 'count')
      setInvoices(invoicesData)
    }
    fetchData()
  }, [])
  console.log(invoices)
  return (
    <Container>
      <CashDenominationCalculator
        banknotes={banknotes}
        setBanknotes={handleChangesBanknotes}
        title={'Cierre'}
        datetime={<DateSection date={date} />}
        isExpanded={calculationIsOpen}
        setIsExpanded={setCalculationIsOpen}
        inputDisabled={state === 'closed'}
      />
      <Comments
        label='Comentarios de cierre'
        placeholder='Escribe aquí ...'
        disabled={state === 'closed'}
        onChange={e => handleChangesComments(e.target.value)}
      />
      <TransactionSummary />
      <ViewInvoice invoices={invoices} />
      <CashBoxClosureDetails />
    </Container>
  )
}
const Container = styled.div`
  display: grid;
  align-items: start;
  align-content: start;
  gap: 0.4em;
 
`