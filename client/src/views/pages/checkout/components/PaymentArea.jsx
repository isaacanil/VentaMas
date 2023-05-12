import React from 'react'
import styled from 'styled-components'
import { Row } from './Table/Row'
import { separator } from '../../../../hooks/separator'
import { SubTitle, Title } from '../Receipt'
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
                        <SubTitle>ENVIO :</SubTitle>
                        <div></div>
                        <Col textAlign='right'>{separator(data.delivery.value)}</Col>
                    </Row>
                ) : null
            }
            <Row cols='3'>
                <SubTitle>TOTAL A PAGAR</SubTitle>
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
                <SubTitle>CAMBIO</SubTitle>
                <div></div>
                <Col textAlign='right'>{separator(data.change.value)}</Col>
            </Row>
        </Container>
    )
}

const Container = styled.div``