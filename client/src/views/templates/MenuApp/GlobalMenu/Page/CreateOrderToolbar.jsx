import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ButtonGroup } from '../../../system/Button/Button'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '../../../../../features/auth/userSlice'
import routesName from '../../../../../routes/routesName'

import { AddProductButton } from '../../../system/Button/AddProductButton'
import { OPERATION_MODES } from '../../../../../constants/modes'
export const CreateOrderToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const { PURCHASES, ORDERS, ORDERS_CREATE  } = routesName.PURCHASE_TERM;
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
