import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { CashDenominationCalculator } from '../../../../../resource/CashDenominationCalculator/CashDenominationCalculator'
import { TransactionSummary } from './components/TransactionSummary/TransactionSummary'
import { CashBoxClosureDetails } from './components/CashBoxClosureDetails/CashBoxClosureDetails'
import { TextareaV2 } from '../../../Comments/TextareaV2'
import { ViewInvoice } from './components/ViewInvoive/ViewInvoice'
import { Comments } from '../../../Comments/Comments'
import { addPropertiesToCashCount, selectCashCount, setCashCountClosingBanknotes, setCashCountClosingComments, updateCashCountTotals, } from '../../../../../../../../features/cashCount/cashCountManagementSlice'
import { useDispatch, useSelector } from 'react-redux'
import { DateSection } from '../../Header/DateSection'
import { selectUser } from '../../../../../../../../features/auth/userSlice'
import { fbLoadInvoicesForCashCount } from '../../../../../../../../firebase/cashCount/fbLoadInvoicesForCashCount'
import { CashCountMetaData } from './CashCountMetaData'

export const RightSide = ({ calculationIsOpen, setCalculationIsOpen, date }) => {
  const CashReconciliation = useSelector(selectCashCount)
  const { sales, id, state } = CashReconciliation
  const { banknotes, comments } = CashReconciliation.closing;

  const [invoices, setInvoices] = useState({
    count: '',
    invoices: []
  })
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
      const invoicesData = await fbLoadInvoicesForCashCount(user, id, 'all')
      setInvoices(invoicesData)
    }
    fetchData()
  }, [])

  const cashCountMetaData = CashCountMetaData(CashReconciliation, invoices.invoices)
  useEffect(() => {
    dispatch(updateCashCountTotals(cashCountMetaData))
  }, [CashReconciliation, invoices, banknotes])

  useEffect(() => {
    dispatch(addPropertiesToCashCount(cashCountMetaData))
  }, [banknotes])

  return (
    <Container>
      <CashDenominationCalculator
        banknotes={banknotes}
        setBanknotes={handleChangesBanknotes}
        title={'Cierre'}
        datetime={<DateSection date={CashReconciliation.closing.date} />}
        isExpanded={calculationIsOpen}
        setIsExpanded={setCalculationIsOpen}
        inputDisabled={state === 'closed'}
      />
      <TransactionSummary invoices={invoices.invoices} />
      <ViewInvoice invoices={invoices.count} />
      <CashBoxClosureDetails invoices={invoices.invoices} />
      <Comments
        label='Comentarios de cierre'
        placeholder='Escribe aquí ...'
        disabled={state === 'closed'}
        value={comments}
        onChange={e => handleChangesComments(e.target.value)}
      />
    </Container>
  )
}
const Container = styled.div`
  display: grid;
  align-items: start;
  align-content: start;
  gap: 0.4em;
 
`