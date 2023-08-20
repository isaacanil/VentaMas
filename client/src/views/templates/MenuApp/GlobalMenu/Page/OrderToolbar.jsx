import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../../../system/Button/Button'
import { useIsOpenCashReconciliation } from '../../../../../firebase/cashCount/useIsOpenCashReconciliation'
import { useDispatch, useSelector } from 'react-redux'
import { setUserNotification } from '../../../../../features/UserNotification/UserNotificationSlice'
import { selectUser } from '../../../../../features/auth/userSlice'
import { inspectUserAccess } from '../../../../../hooks/abilities/useAbilities'
import routesName from '../../../../../routes/routesName'
import { openModalAddOrder, toggleAddPurchaseModal } from '../../../../../features/modals/modalSlice'
import { Tooltip } from '../../../system/Button/Tooltip'
import { CgMathPlus } from 'react-icons/cg'
export const OrderToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const { PURCHASES, ORDERS, ORDERS_CREATE  } = routesName.PURCHASE_TERM;
    const matchWithCashReconciliation = useMatch(ORDERS)

    const navigate = useNavigate()
    const dispatch = useDispatch()
   
    const { abilities } = inspectUserAccess();
    const user = useSelector(selectUser)

    // const openModal = () => dispatch(openModalAddOrder());
    const openModal = () => navigate(ORDERS_CREATE);
    return (
        matchWithCashReconciliation ? (
            <Container>
                {
                    side === 'right' && (
                        <Tooltip
                            description='Realizar Comprar'
                            Children={
                                
                                <Button
                                    borderRadius='normal'
                                   
                                    startIcon={<CgMathPlus/>}
                                    title='Pedido'
                                    onClick={openModal}
                                />
                         
                            } />
                    )
                }
            </Container>
        ) : null
    )
}

const Container = styled.div`

`
