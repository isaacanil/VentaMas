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
import { openModalAddOrder, toggleAddPurchaseModal, toggleClientModal, toggleProviderModal } from '../../../../../features/modals/modalSlice'
import { Tooltip } from '../../../system/Button/Tooltip'
import { CgMathPlus } from 'react-icons/cg'
import { icons } from '../../../../../constants/icons/icons'
import { AddProductButton } from '../../../system/Button/AddProductButton'
import { OPERATION_MODES } from '../../../../../constants/modes'
import { SearchInput } from '../../../system/Inputs/SearchInput'
export const ClientControlToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const { CLIENTS } = routesName.CONTACT_TERM;
    const matchWithCashReconciliation = useMatch(CLIENTS);

    const dispatch = useDispatch();

    const createMode = OPERATION_MODES.CREATE.id
    const openModal = () => dispatch(toggleClientModal({ mode: createMode, data: null }))
    return (
        matchWithCashReconciliation ? (
            <Container>
             
                {
                    side === 'right' && (
                        <ButtonGroup>
                            <Button
                                borderRadius='normal'
                                startIcon={icons.mathOperations.add}
                                title='Nuevo Cliente'
                                onClick={openModal}
                            />
                        </ButtonGroup>
                    )
                }
            </Container>
        ) : null
    )
}

const Container = styled.div`

`
