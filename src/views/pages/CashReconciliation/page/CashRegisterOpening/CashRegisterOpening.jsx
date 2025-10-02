import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { CashDenominationCalculator } from '../../resource/CashDenominationCalculator/CashDenominationCalculator'
import { useDispatch, useSelector } from 'react-redux'
import { clearCashCount, selectCashCount, setCashCountOpeningBanknotes, setCashCountOpeningComments, setCashCountOpeningDate, setCashCountOpeningEmployee, } from '../../../../../features/cashCount/cashCountManagementSlice'
import { Comments } from '../CashRegisterClosure/Comments/Comments'
import { Header } from './components/Headers/Header'
import { ConfirmCancelButtons } from '../../resource/ConfirmCancelButtons/ConfirmCancelButtons'
import { Footer } from './components/Footer/Footer'
import { PinAuthorizationModal } from '../../../../component/modals/PinAuthorizationModal/PinAuthorizationModal'
import { useAuthorizationPin } from '../../../../../hooks/useAuthorizationPin'
import { selectUser } from '../../../../../features/auth/userSlice'
import { fbCashCountOpening } from '../../../../../firebase/cashCount/opening/fbCashCountOpening'
import { message } from 'antd'

import { DateSection } from '../CashRegisterClosure/components/Header/DateSection'
import { DateTime } from 'luxon'
import { useLocation, useNavigate } from 'react-router-dom'

export const CashRegisterOpening = () => {
  const cashCount = useSelector(selectCashCount)
  const { banknotes } = cashCount.opening;
  const [openingDate, setOpeningDate] = useState(DateTime.now())
  const [calculatorIsOpen, setCalculatorIsOpen] = useState(true)

  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useDispatch()
  const actualUser = useSelector(selectUser)

  const handleChangesBanknotes = (banknotes) => {
    dispatch(setCashCountOpeningBanknotes(banknotes))
  }
  const handleChangesComments = (comments) => {
    dispatch(setCashCountOpeningComments(comments))
  }

  const handleAuthorizationSuccess = useCallback(async (approvalEmployee) => {
    try {
      if (!approvalEmployee?.uid) {
        throw new Error('No se pudo identificar al autorizador.');
      }

      const response = await fbCashCountOpening(
        actualUser,
        cashCount,
        actualUser.uid,
        approvalEmployee.uid,
        openingDate.toMillis()
      )

      if (response !== 'success') {
        throw response instanceof Error ? response : new Error('No se pudo autorizar la apertura.');
      }

      message.success('Apertura autorizada correctamente.');
      dispatch(clearCashCount())
      navigate(-1)
    } catch (error) {
      const errorMessage = error?.message || 'No se pudo autorizar la apertura.';
      message.error(errorMessage)
    }
  }, [actualUser, cashCount, dispatch, navigate, openingDate])

  const { showModal: showPinModal, modalProps: pinModalProps } = useAuthorizationPin({
    onAuthorized: handleAuthorizationSuccess,
    module: 'accountsReceivable',
    allowedRoles: ['admin', 'owner', 'dev', 'manager', 'cashier'],
    description: 'Autoriza la apertura del cuadre de caja con tu PIN o contraseña.',
  })

  const handleCancel = () => {
    if (location.state?.from === 'factura') {
      navigate('/sales');
    } else {
      navigate(-1);
    }
    dispatch(clearCashCount())  }

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
        <Footer onSubmit={showPinModal} onCancel={handleCancel} />
      </Container>
      <PinAuthorizationModal {...pinModalProps} />
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
  height: 100%;
  position: relative;
  margin: 0 auto;
  display: grid;
  align-items: start;
  align-content: start;
  gap: 0.8em;
  padding: 1em;
`