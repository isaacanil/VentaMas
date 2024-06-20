import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../../../system/Button/Button'
import { useDispatch, useSelector } from 'react-redux'
import { setUserNotification } from '../../../../../features/UserNotification/UserNotificationSlice'
import { selectUser } from '../../../../../features/auth/userSlice'
import { selectCashReconciliation } from '../../../../../features/cashCount/cashStateSlice'

export const CashReconciliationToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const matchWithCashReconciliation = useMatch("/cash-reconciliation")
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { state, cashCount } = useSelector(selectCashReconciliation);
  
    const user = useSelector(selectUser)

    const handleSwitchToCashRegisterOpening = () => {
        if (state === 'open') {
            dispatch(setUserNotification(
                {
                    isOpen: true,
                    title: 'Operación no permitida: Caja actualmente abierta',
                    description: 'No se puede iniciar un nuevo proceso de cuadre de caja mientras haya uno en curso. Por favor, cierre la caja actual antes de intentar abrir una nueva.',
                    onConfirm: null,
                }
            ))
            return
        }
        if (state === 'closing') {
            dispatch(setUserNotification(
                {
                    isOpen: true,
                    title: 'Operación no permitida: Cierre de caja en proceso',
                    description: 'No se puede iniciar un nuevo proceso de cuadre de caja mientras uno anterior esté en proceso de cierre. Por favor, espere a que el proceso de cierre actual se complete antes de intentar abrir una nueva caja.',
                    onConfirm: null,
                }
            ))
            return
        }
        navigate('/cash-register-opening')
    }
    return (
        matchWithCashReconciliation ? (
            <Container>
                {
                    side === 'right' && (
                        <Button
                            onClick={handleSwitchToCashRegisterOpening}
                            title={`Abrir Cuadre`}
                            borderRadius={'light'}
                        />
                    )
                }
            </Container>
        ) : null
    )
}

const Container = styled.div`

`
