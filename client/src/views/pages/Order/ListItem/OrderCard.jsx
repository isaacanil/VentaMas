import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { Button } from '../../../templates/system/Button/Button'
import { StatusIndicatorDot } from '../components/StatusIndicatorDot/StatusIndicatorDot'
import { ActionsButtonsGroup } from './ActionsButtonsGroup'
import { useDispatch, useSelector } from 'react-redux'
import { selectOrderItemSelected, selectPendingOrder } from '../../../../features/order/ordersSlice'
import { toggleViewOrdersNotes } from '../../../../features/modals/modalSlice'
import { Tooltip } from '../../../templates/system/Button/Tooltip'
import { correctDate } from '../../../../hooks/time/correctDate'

export const OrderCard = ({ orderData, index, Row, Col, activeId, setActiveId }) => {
    const dispatch = useDispatch()
    const [isOpen, setIsOpen] = useState(false)
    const [showNote, setShowNote] = useState(false)
    const orderItemSelectedRef = useSelector(selectOrderItemSelected)
    const {data} = orderData
    const handleViewNotes = () => {  
        setIsOpen(!isOpen)
        dispatch(toggleViewOrdersNotes({data, isOpen: 'open'}))   
    }
   
    return (
        <Row>
            <Col>{index + 1}</Col>
            <Col>
                <StatusIndicatorDot color={data.state ? data.state.color : null}></StatusIndicatorDot>
            </Col>
            <Col size='limit'>
                <div>{data.provider ? data.provider.name : null}</div>
            </Col>
            <Col>
            <Tooltip
                placement='bottom'
                description='ver nota'
                Children={
                    <Button
                        title='ver'
                        borderRadius='normal'
                        color='gray-dark'
                        border='light'
                        onClick={(data) => handleViewNotes(data)}
                    />
                }

            />
            </Col>
            <Col>
                <div>{ correctDate(data.createdAt).toLocaleDateString()}</div></Col>
            <Col>
                <div>{ correctDate(data.date).toLocaleDateString()}</div>
            </Col>
            <Col position='right'>
                <div>{useFormatPrice(data.totalPurchase)}</div>
            </Col>
            <Col>
                <ActionsButtonsGroup orderData={data} activeId={activeId} setActiveId={setActiveId}/>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

