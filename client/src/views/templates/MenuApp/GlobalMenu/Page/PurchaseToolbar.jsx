import React from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../../../system/Button/Button'
import { useIsOpenCashReconciliation } from '../../../../../firebase/cashCount/useIsOpenCashReconciliation'
import { useDispatch, useSelector } from 'react-redux'
import { setUserNotification } from '../../../../../features/UserNotification/UserNotificationSlice'
import { selectUser } from '../../../../../features/auth/userSlice'
import routesName from '../../../../../routes/routesName'
import { CgMathPlus } from 'react-icons/cg'
import { ButtonGroup } from '../../../..'
import { togglePurchaseChartModal } from '../../../../../features/purchase/purchaseUISlice'
export const PurchaseToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const { PURCHASES, PURCHASES_CREATE } = routesName.PURCHASE_TERM;
    const matchWithCashReconciliation = useMatch(PURCHASES)

    const navigate = useNavigate()
    const dispatch = useDispatch()

 
    const handleOpenPurchaseChart = () => dispatch(togglePurchaseChartModal());
    // const openModal = () => {dispatch(toggleAddPurchaseModal())}
    const openModal = () => navigate(PURCHASES_CREATE);
    return (
        matchWithCashReconciliation ? (
            <Container>
                {
                    side === 'right' && (
                        <ButtonGroup>
                              <Button
                                borderRadius='normal'
                                title={`Ver Reporte`}
                                onClick={handleOpenPurchaseChart}
                            />
                            <Button
                                borderRadius='normal'

                                startIcon={<CgMathPlus />}
                                title={`Comprar`}
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
