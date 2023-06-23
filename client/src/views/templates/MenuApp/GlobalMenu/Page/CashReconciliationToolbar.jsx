import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../../../system/Button/Button'
import { useIsOpenCashReconciliation } from '../../../../../firebase/cashCount/useIsOpenCashReconciliation'
import { useDispatch } from 'react-redux'
import { setUserNotification } from '../../../../../features/UserNotification/UserNotificationSlice'

export const CashReconciliationToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const matchWithCashReconciliation = useMatch("/cash-reconciliation")
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const isOpenCashReconciliation = useIsOpenCashReconciliation()
    const handleSwitchToCashRegisterOpening = () => {
        
        if(isOpenCashReconciliation === 'open'){
            dispatch(setUserNotification(
                {
                    isOpen: true,
                    title: 'Caja abierta',
                    description: 'No se puede abrir un cuadre de caja si ya existe uno abierto',
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
                            title={'Abrir Cuadre'} 
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
