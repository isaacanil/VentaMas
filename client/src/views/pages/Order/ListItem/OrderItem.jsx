import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { Button } from '../../../templates/system/Button/Button'
import { StatusIndicatorDot } from '../components/StatusIndicatorDot/StatusIndicatorDot'
import { ActionsButtonsGroup } from './ActionsButtonsGroup'
import { useDispatch, useSelector } from 'react-redux'
import { selectOrderItemSelected, selectPendingOrder } from '../../../../features/order/ordersSlice'
import { toggleViewOrdersNotes } from '../../../../features/modals/modalSlice'

export const OrderItem = ({ e, index, Row, Col }) => {
    const dispatch = useDispatch()
    const [isOpen, setIsOpen] = useState(false)
    const orderItemSelectedRef = useSelector(selectOrderItemSelected)
    console.log(orderItemSelectedRef)
    const handleViewNotes = () => {
        dispatch(selectPendingOrder({ id: e.data.id })) 
        setIsOpen(!isOpen)
    }
    useEffect(()=>{
        dispatch(toggleViewOrdersNotes({data: orderItemSelectedRef, isOpen: isOpen}))
    }, [isOpen, orderItemSelectedRef])
    return (
        <Row>
            <Col>{index + 1}</Col>
            <Col>
                <StatusIndicatorDot color={e.data.state ? e.data.state.color : null}></StatusIndicatorDot>
            </Col>
            <Col size='limit'>
                <div>{e.data.provider ? e.data.provider.name : null}</div>
            </Col>
            <Col>
                <Button
                    title='ver'
                    borderRadius='normal'
                    color='gray-dark'
                    onClick={handleViewNotes}
                />
            </Col>
            <Col>
                <div>{new Date(e.data.createdAt).toLocaleDateString()}</div></Col>
            <Col>
                <div>{new Date(e.data.date).toLocaleDateString()}</div>
            </Col>
            <Col position='right'>
                <div>{useFormatPrice(e.data.totalPurchase)}</div>
            </Col>
            <Col>
                <ActionsButtonsGroup orderData={e}/>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

