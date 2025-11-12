import { BankOutlined } from '@ant-design/icons'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useMatch } from 'react-router-dom'
import styled from 'styled-components'

import { openMultiPaymentModal } from '../../../../../features/modals/modalSlice'
import { Button } from '../../../system/Button/Button'

export const AccountReceivableToolbar = ({ side = 'left' }) => {
    const matchWithAccountsReceivable = useMatch("/account-receivable/list")
    const dispatch = useDispatch()

    const handleOpenMultiPayment = () => {
        dispatch(openMultiPaymentModal());
    }

    return (
        matchWithAccountsReceivable ? (
            <Container>
                {
                    side === 'right' && (
                        <Button
                            onClick={handleOpenMultiPayment}
                            title={`Pago múltiple`}
                            borderRadius={'light'}
                            icon={<BankOutlined />}
                        />
                    )
                }
            </Container>
        ) : null
    )
}

const Container = styled.div`
    display: flex;
    align-items: center;
`
