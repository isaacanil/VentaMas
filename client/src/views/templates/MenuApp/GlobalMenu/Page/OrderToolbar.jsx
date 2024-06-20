import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import * as antd from 'antd'
const { Button } = antd
import { useDispatch, useSelector } from 'react-redux'
import { setUserNotification } from '../../../../../features/UserNotification/UserNotificationSlice'
import { selectUser } from '../../../../../features/auth/userSlice'
import routesName from '../../../../../routes/routesName'
import { openModalAddOrder, toggleAddPurchaseModal } from '../../../../../features/modals/modalSlice'
import { Tooltip } from '../../../system/Button/Tooltip'
import { CgMathPlus } from 'react-icons/cg'
import { icons } from '../../../../../constants/icons/icons'
export const OrderToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const { PURCHASES, ORDERS, ORDERS_CREATE  } = routesName.PURCHASE_TERM;
    const matchWithCashReconciliation = useMatch(ORDERS)

    const navigate = useNavigate()
    const dispatch = useDispatch()
   
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
                                    icon={icons.operationModes.add}
                                    onClick={openModal}
                                >Pedido</Button>
                         
                            } />
                    )
                }
            </Container>
        ) : null
    )
}

const Container = styled.div`

`
