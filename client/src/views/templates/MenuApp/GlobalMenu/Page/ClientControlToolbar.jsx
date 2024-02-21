import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ButtonGroup } from '../../../system/Button/Button'
import { useDispatch, useSelector } from 'react-redux'
import routesName from '../../../../../routes/routesName'
import { openModalAddOrder, toggleAddPurchaseModal, toggleClientModal, toggleProviderModal } from '../../../../../features/modals/modalSlice'
import { icons } from '../../../../../constants/icons/icons'
import { OPERATION_MODES } from '../../../../../constants/modes'
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
