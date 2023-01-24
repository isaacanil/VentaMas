import React from 'react'
import { IoCartSharp, IoTrashSharp } from 'react-icons/io5'
import { TbEdit } from 'react-icons/tb'
import { CgNotes } from 'react-icons/cg'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { Button } from '../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../templates/system/Button/ButtonGroup'
import { StatusIndicatorDot } from '../components/StatusIndicatorDot/StatusIndicatorDot'
import { ActionsButtonsGroup } from './ActionsButtonsGroup'
import { useDispatch } from 'react-redux'
import { selectPendingOrder } from '../../../../features/order/ordersSlice'

export const OrderItem = ({ e, index, Row, Col }) => {
    const dispatch = useDispatch()
    const handleViewNotes = () => {
        dispatch(selectPendingOrder({ id: e.data.id }))
    }
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

