import React from 'react'
import styled from 'styled-components'
import { Row } from './Table/Row'
import { separator } from '../../../../hooks/separator'
import { SubTitle } from '../Receipt'
import { Col } from './Table/Col'

export const PaymentArea = ({ data, P }) => {
    return (
        <Container> 
            <Row cols='3'>
                <SubTitle>TOTAL A PAGAR :</SubTitle>
                <Col textAlign='right'>{separator(data?.totalTaxes?.value)}</Col>
                <Col textAlign='right'>{separator(data?.totalPurchase?.value)}</Col>
            </Row>
            {
                data?.delivery?.status ? (
                    <Row cols='3'>
                        <P>ENVIO :</P>
                        <div></div>
                        <Col textAlign='right'>{separator(data?.delivery?.value)}</Col>
                    </Row>
                ) : null
            }
            {
                data?.paymentMethod?.filter((item) => item?.status === true)?.map((item, index) => (
                    <Row key={index} cols='3'>
                        <P>{item?.method === 'card' ? 'Tarjeta' : item?.method === 'cash' ? 'Efectivo' : 'Transferencia'} :</P>
                        <div></div>
                        <Col textAlign='right'>{separator(item?.value)}</Col>
                    </Row>
                ))
            }
            <Row cols='3'>
                <P>CAMBIO :</P>
                <div></div>
                <Col textAlign='right'>{separator(data?.change?.value)}</Col>
            </Row>
        </Container>
    )
}

const Container = styled.div`
padding-top: 0.6em;
`