import React from 'react'
import { IoCartSharp, IoTrashSharp } from 'react-icons/io5'
import { TbEdit } from 'react-icons/tb'
import { CgNotes } from 'react-icons/cg'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { Button } from '../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../templates/system/Button/ButtonGroup'
import { correctDate } from '../../../../hooks/correctDate'
import { ActionsButtonsGroup } from './ActionsButtonsGroup'

export const PurchaseCard = ({ purchaseData, index, Row, Col, activeId, setActiveId }) => {
    const {data} = purchaseData
    return (
        <Row>
            <Col>{data.id}</Col>   
            <Col size='limit'>
                <div>{data.provider ? data.provider.name : null}</div>
            </Col>
            <Col>
                <Button
                    title='ver'
                    borderRadius='normal'
                    color='gray-dark'
                />
            </Col>
            <Col>
                <div>{correctDate(data.createdAt).toLocaleDateString()}</div></Col>
            <Col>
                <div>{correctDate(data.date).toLocaleDateString()}</div>
            </Col>
            <Col position='right'>
                <div>{useFormatPrice(data.totalPurchase)}</div>
            </Col>
            <Col>
                <ButtonGroup>                   
                    <ActionsButtonsGroup purchaseData={data} activeId={activeId} setActiveId={setActiveId}></ActionsButtonsGroup>
                </ButtonGroup>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

