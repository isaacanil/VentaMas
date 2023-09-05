import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { CashDenominationCalculator } from '../../global/CashDenominationCalculator/CashDenominationCalculator'
import { useDispatch, useSelector } from 'react-redux'
import { clearCashCount, selectCashCount, setCashCountOpeningBanknotes, setCashCountOpeningComments, setCashCountOpeningDate, setCashCountOpeningEmployee, } from '../../../../../features/cashCount/cashCountManagementSlice'
import { Comments } from '../CashRegisterClosure/Comments/Comments'
import { Header } from './components/headers/header'
import { ConfirmCancelButtons } from '../../global/ConfirmCancelButtons/ConfirmCancelButtons'
import { Footer } from './components/Footer/Footer'
import { PeerReviewAuthorization } from '../../../../component/modals/PeerReviewAuthorization/PeerReviewAuthorization'
import { selectUser } from '../../../../../features/auth/userSlice'
import { fbCashCountOpening } from '../../../../../firebase/cashCount/opening/fbCashCountOpening'

import { DateSection } from '../CashRegisterClosure/components/Header/DateSection'
import { DateTime } from 'luxon'
import { useLocation, useNavigate } from 'react-router-dom'

export const CashRegisterOpening = () => {
  const [peerReviewAuthorizationIsOpen, setPeerReviewAuthorizationIsOpen] = useState(false)

  const cashCount = useSelector(selectCashCount)
  const { banknotes } = cashCount.opening;
  const [openingDate, setOpeningDate] = useState(DateTime.now())
  const [calculatorIsOpen, setCalculatorIsOpen] = useState(true)

  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useDispatch()

  const handleChangesBanknotes = (banknotes) => {
    dispatch(setCashCountOpeningBanknotes(banknotes))
  }
  const handleChangesComments = (comments) => {
    dispatch(setCashCountOpeningComments(comments))
  }
  const handleOpenPeerReviewAuthorization = () => { setPeerReviewAuthorizationIsOpen(true) }

  const actualUser = useSelector(selectUser)

  const handleSubmit = (approvalEmployee) => {
    fbCashCountOpening(actualUser, cashCount, actualUser.uid, approvalEmployee.uid, openingDate.toMillis())
  }
  const handleCancel = () => {
    if (location.state?.from === 'factura') {
      navigate('/sales');
    } else {
      navigate(-1);
    }
    dispatch(clearCashCount())
  }

  console.log(openingDate)
  return (
    <Backdrop>
      <Container>
        <Header />
        <CashDenominationCalculator
          title={'Efectivo para apertura'}
          banknotes={banknotes}
          datetime={<DateSection date={openingDate} />}
          setBanknotes={handleChangesBanknotes}
          isExpanded={calculatorIsOpen}
          setIsExpanded={setCalculatorIsOpen}
        />
        <Comments
          label='Comentario de Apertura'
          onChange={e => handleChangesComments(e.target.value)}
        />
        <Footer onSubmit={handleOpenPeerReviewAuthorization} onCancel={handleCancel} />
      </Container>
      <PeerReviewAuthorization
        isOpen={peerReviewAuthorizationIsOpen}
        setIsOpen={setPeerReviewAuthorizationIsOpen}
        onSubmit={handleSubmit}
      />
    </Backdrop>
  )
}
const Backdrop = styled.div`
  background-color: #F5F5F5;
  height: 100vh;
  overflow-y: scroll;
  
`
const Container = styled.div`
  max-width: 500px;
  height: 100vh;
  position: relative;
  margin: 0 auto;
  display: grid;
  align-items: start;
  align-content: start;
  gap: 0.8em;
  padding: 1em;
`