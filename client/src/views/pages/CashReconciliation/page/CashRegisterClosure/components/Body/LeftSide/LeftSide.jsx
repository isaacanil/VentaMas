import React from 'react'
import styled from 'styled-components'
import { CashDenominationCalculator } from '../../../../../global/CashDenominationCalculator/CashDenominationCalculator'
import { TextareaV2 } from '../../../Comments/TextareaV2'
import { Comments } from '../../../Comments/Comments'
import { useDispatch, useSelector } from 'react-redux'
import { selectCashCount, setCashCountOpeningBanknotes, } from '../../../../../../../../features/cashCount/cashCountSlide'
import { DateTime } from 'luxon'
import { DateSection } from '../../Header/DateSection'
import { UserView } from '../../../../../global/UserView/UserView'
import { Timestamp } from 'firebase/firestore'
import { convertTimeStampToDate } from '../../../../../../../../utils/date/convertTimeStampToDate'

export const LeftSide = ({ calculationIsOpen, setCalculationIsOpen }) => {
  const CashReconciliation = useSelector(selectCashCount)
  const { banknotes } = CashReconciliation.opening;
  const dispatch = useDispatch()
  const handleChangesBanknotes = (banknotes) => {

    dispatch(setCashCountOpeningBanknotes(banknotes))
  }


  return (
    <Container>
      <CashDenominationCalculator
        inputDisabled
        banknotes={banknotes}
        setBanknotes={handleChangesBanknotes}
        title={'Apertura'}
        datetime={<DateSection date={convertTimeStampToDate(CashReconciliation.opening.date)} />}
        isExpanded={calculationIsOpen}
        setIsExpanded={setCalculationIsOpen}
      />
      <Comments
        label='Comentarios de apertura'
        placeholder='Escribe aquí ...'
        disabled
        value={CashReconciliation.opening.comments}
      />
      <UserView
        user={CashReconciliation.opening?.employee}
        label='Entregado por'
        user2={CashReconciliation.opening?.approvalEmployee}
        label2='Recibido por'
        title={'Autorización de Apertura'}
      />
  {
    CashReconciliation.closing.initialized && (
      <UserView
        user={CashReconciliation.closing?.employee}
        label='Entregado por'
        user2={CashReconciliation.closing?.approvalEmployee}
        label2='Recibido por'
        title={'Autorización de Cierre'}
      />
    )
  }
      

    </Container>
  )
}
const Container = styled.div`
  display: grid;
  align-items: start;
  align-content: start;
  gap: 0.4em;
`

//structure of the data that is going to be saved in the database for cash reconciliation
// {
//   "cashRegisterClosure": {
//     "id": "5f9b2b3b9c6f6e0017b2b3b9",
//     "date": "2020-10-29T00:00:00.000Z",
//     apertur