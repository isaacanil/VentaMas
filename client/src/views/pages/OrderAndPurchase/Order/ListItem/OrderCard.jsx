import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'

import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { Button } from '../../../../templates/system/Button/Button'
import { StatusIndicatorDot } from '../components/StatusIndicatorDot/StatusIndicatorDot'
import { ActionsButtonsGroup } from './ActionsButtonsGroup'
import { toggleViewOrdersNotes } from '../../../../../features/modals/modalSlice'
import { Tooltip } from '../../../../templates/system/Button/Tooltip'
import { correctDate } from '../../../../../hooks/date/correctDate'
import { getOrderStateByID } from '../../../../../constants/orderAndPurchaseState'

export const OrderCard = ({ orderData, index, Row, Col, activeId, setActiveId }) => {
    const dispatch = useDispatch()
  
    const [showNote, setShowNote] = useState(false)
    //const orderItemSelectedRef = useSelector(selectOrderItemSelected)
    const {data} = orderData
    const handleViewNotes = () => {  
      
        dispatch(toggleViewOrdersNotes({data, isOpen: 'open'}))   
    }
   console.log(data, 'data.......................................')
    return (
        <Row>
            
            <Col>{data?.id}</Col>
            <Col>
                <StatusIndicatorDot color={data.state ? getOrderStateByID(data?.state)?.color : null}></StatusIndicatorDot>
            </Col>
            <Col size='limit'>
                <div>{data?.provider?.name || null}</div>
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
                <div>{ correctDate(data?.dates?.createdAt).toLocaleDateString()}</div></Col>
            <Col>
                <div>{ correctDate(data?.dates?.deliveryDate).toLocaleDateString()}</div>
            </Col>
            <Col position='right'>
                <div>{useFormatPrice(data?.total)}</div>
            </Col>
            <Col>
            {data && <ActionsButtonsGroup orderData={data} activeId={activeId} setActiveId={setActiveId}/>}
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

