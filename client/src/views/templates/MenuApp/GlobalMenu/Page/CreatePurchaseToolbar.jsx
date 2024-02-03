import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ButtonGroup } from '../../../system/Button/Button'
import { useIsOpenCashReconciliation } from '../../../../../firebase/cashCount/useIsOpenCashReconciliation'
import { useDispatch, useSelector } from 'react-redux'
import { setUserNotification } from '../../../../../features/UserNotification/UserNotificationSlice'
import { selectUser } from '../../../../../features/auth/userSlice'
import { inspectUserAccess } from '../../../../../hooks/abilities/useAbilities'
import routesName from '../../../../../routes/routesName'
import { openModalAddOrder, toggleAddPurchaseModal, toggleProviderModal } from '../../../../../features/modals/modalSlice'
import { Tooltip } from '../../../system/Button/Tooltip'
import { CgMathPlus } from 'react-icons/cg'
import { icons } from '../../../../../constants/icons/icons'
import { AddProductButton } from '../../../system/Button/AddProductButton'
import { OPERATION_MODES } from '../../../../../constants/modes'

export const CreatePurchaseToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const {  PURCHASES_CREATE  } = routesName.PURCHASE_TERM;
    const matchWithCashReconciliation = useMatch(PURCHASES_CREATE)

    const navigate = useNavigate()
    const dispatch = useDispatch()
   
    const { abilities } = inspectUserAccess();
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
