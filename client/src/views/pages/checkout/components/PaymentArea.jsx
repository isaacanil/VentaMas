import React from 'react'
import styled from 'styled-components'
import { Row } from './Table/Row'
import { separator } from '../../../../hooks/separator'
import { Title } from '../Receipt'
import { Col } from './Table/Col'

export const PaymentArea = ({ data }) => {

    const handlePaymentMethod = () => {
        data?.paymentMethod && data?.paymentMethod.find((item) => item.status === true).method;
          data?.cardPaymentMethod && 'Tarjeta'
          data?.cashPaymentMethod && 'Efectivo'
          data?.transferPaymentMethod && 'Transferencia'
    }
    const handlePaymentMethodValue = () => {
        data?.payment && data?.payment.value
        data?.cardPaymentMethod && data?.cardPaymentMethod.value
        data?.cashPaymentMethod && data?.cashPaymentMethod.value
        data?.transferPaymentMethod && data?.transferPaymentMethod.value
    }
   
    return (
        <Container>
            {
                data.delivery.status ? (
                    <Row cols='3'>
                        <Title>ENVIO :</Title>
                        <div></div>
                        <Col textAlign='right'>{separator(data.delivery.value)}</Col>
                    </Row>
                ) : null
            }
            <Row cols='3'>
                <Title>TOTAL A PAGAR</Title>
                <Col textAlign='right'>{separator(data.totalTaxes.value)}</Col>
                <Col textAlign='right'>{separator(data.totalPurchase.value)}</Col>
            </Row>
            <Row cols='3'>
                <Title>
                    {handlePaymentMethod()}
                </Title>

                <div></div>
                <Col textAlign='right'>
                    {handlePaymentMethodValue()}
                </Col>
            </Row>
            <Row cols='3'>
                <Title>CAMBIO</Title>
                <div></div>
                <Col textAlign='right'>{separator(data.change.value)}</Col>
            </Row>
        </Container>
    )
}

const Container = styled.div``