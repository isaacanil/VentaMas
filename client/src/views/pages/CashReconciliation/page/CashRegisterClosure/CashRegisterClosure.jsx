import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import userSlice, { selectUser } from './../../../../../features/auth/userSlice'
import { Header } from './components/Header/Header'
import styled from 'styled-components'
import { Body } from './components/Body/Body'
import { Footer } from './components/Footer/Footer'
import { PeerReviewAuthorization } from '../../../../component/modals/PeerReviewAuthorization/PeerReviewAuthorization'
import { clearCashCount, selectCashCount } from '../../../../../features/cashCount/cashCountManagementSlice'
import { useNavigate } from 'react-router-dom'
import { fbAddBillToOpenCashCount } from '../../../../../firebase/cashCount/fbAddBillToOpenCashCount'
import { fbCashCountClosed } from '../../../../../firebase/cashCount/closing/fbCashCountClosed'
import { DateTime } from 'luxon'
import { fbCashCountChangeState } from '../../../../../firebase/cashCount/closing/fbCashCountClosing'
import { useFbGetCashCount } from '../../../../../firebase/cashCount/fbGetCashCount'
import { addNotification } from '../../../../../features/notification/NotificationSlice'

export const CashRegisterClosure = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [peerReviewAuthorizationIsOpen, setPeerReviewAuthorizationIsOpen] = useState(false)
  const [closingDate, setClosingDate] = useState(DateTime.now())

  const actualUser = useSelector(selectUser)
  const cashCount = useSelector(selectCashCount)

  const cashCountIsOpen = cashCount?.state === 'open';
  const cashCountIsClosed = cashCount?.state === 'closed';
  //const { abilities } = inspectUserAccess();
  // this change the cashCount state for the user cant make a bill if the cash count is not open or when is in closing process
  useEffect(() => {
    if (cashCountIsOpen) fbCashCountChangeState(cashCount, actualUser, 'closing');
  }, [])

  //this is for close the window if the cash count is not initialized
  useEffect(() => {
    if (!cashCount.opening.initialized) navigate('/cash-reconciliation');
  }, [cashCount])

  const handleOpenPeerReviewAuthorization = () => {
    if ((cashCount.opening.employee.id !== actualUser.uid) && actualUser.role !== "admin") {
      dispatch(addNotification({
        message: 'No tienes permisos para realizar esta acción',
        type: 'error'
      }))
      return
    }
    setPeerReviewAuthorizationIsOpen(true)
  };

  // (cashCount.opening.employee.id === actualUser.uid) || actualUser.role === 'admin'
  const handleCancel = async () => {
    //if the user cancel and the status is open or closing, the status will be open
    if (cashCount.state === 'closing' || cashCount.state === 'open') {
      fbCashCountChangeState(cashCount, actualUser, 'open')
    }
    dispatch(clearCashCount())
    navigate('/cash-reconciliation')
  }

  const handleSubmit = async (approvalEmployee) => {
    try {
      await fbCashCountClosed(actualUser, cashCount, actualUser.uid, approvalEmployee.uid, closingDate.toMillis())
    } catch (error) {
      console.log(error)
    }
  }

  const cashCountActual = cashCount?.id ? useFbGetCashCount(cashCount.id) : null
  return (
    <Backdrop>
      <Container>
        <Header state={cashCountActual?.cashCount?.state} />
        <Body closingDate={closingDate} />
        <Footer
          onSubmit={!cashCountIsClosed ? handleOpenPeerReviewAuthorization : null}
          onCancel={handleCancel}
        />
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
width: 100%;
height: 100vh;
background-color: var(--color2);
overflow-y: scroll;
`
const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  height: 100vh;
  padding: 0.4em;
  margin: 0 auto;
  display: grid;
  gap: 0.4em;
  
`