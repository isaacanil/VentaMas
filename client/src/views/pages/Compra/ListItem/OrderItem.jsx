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

export const OrderItem = ({ e, index, Row, Col }) => {
    return (
        <Row>
            <Col>{index + 1}</Col>
           
            <Col size='limit'>
                <div>{e.data.provider ? e.data.provider.name : null}</div>
            </Col>
            <Col>
                <Button
                    title='ver'
                    borderRadius='normal'
                    color='gray-dark'
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
                <ButtonGroup>
                  
                    <Button
                        borderRadius='normal'
                        title={<TbEdit />}
                        width='icon32'
                        color='gray-dark'
                    />
                    <Button
                        borderRadius='normal'
                        title={<IoTrashSharp />}
                        width='icon32'
                        bgcolor='error'
                    />
                </ButtonGroup>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

