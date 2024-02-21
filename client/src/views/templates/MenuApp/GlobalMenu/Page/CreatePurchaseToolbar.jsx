import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ButtonGroup } from '../../../system/Button/Button'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '../../../../../features/auth/userSlice'
import routesName from '../../../../../routes/routesName'
import { openModalAddOrder, toggleAddPurchaseModal, toggleProviderModal } from '../../../../../features/modals/modalSlice'

import { AddProductButton } from '../../../system/Button/AddProductButton'
import { OPERATION_MODES } from '../../../../../constants/modes'

export const CreatePurchaseToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const {  PURCHASES_CREATE  } = routesName.PURCHASE_TERM;
    const matchWithCashReconciliation = useMatch(PURCHASES_CREATE)

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const user = useSelector(selectUser)
    const createMode = OPERATION_MODES.CREATE.id
    const openProviderModal = () => {dispatch(toggleProviderModal({mode: createMode, data: null}))}
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
