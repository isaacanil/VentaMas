import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { OPERATION_MODES } from '../../../../../constants/modes'
import { selectUser } from '../../../../../features/auth/userSlice'
import routesName from '../../../../../routes/routesName'
import { AddProductButton } from '../../../system/Button/AddProductButton'
import { ButtonGroup } from '../../../system/Button/Button'

export const CreateOrderToolbar = ({ side = 'left' }) => {
    const { ORDERS_CREATE } = routesName.ORDER_TERM;

    const matchWithCashReconciliation = useMatch(ORDERS_CREATE)

    const navigate = useNavigate()
    const dispatch = useDispatch()


    const user = useSelector(selectUser)
    const createMode = OPERATION_MODES.CREATE.id

    return (
        matchWithCashReconciliation ? (
            <Container>
                {
                    side === 'right' && (
                        <ButtonGroup>
                            <AddProductButton />
                        </ButtonGroup>
                    )
                }
            </Container>
        ) : null
    )
}

const Container = styled.div`

`
