import React from 'react'
import styled from 'styled-components'
import { Row } from './Table/Row'
import { separator } from '../../../../hooks/separator'
import { SubTitle } from '../Receipt'
import { Col } from './Table/Col'

export const PaymentArea = ({ data, P }) => {

    const handlePaymentMethod = () => {
        //Agrega compatibilidad con la nueva version
        if (data?.paymentMethod) {
            let method = data?.paymentMethod.find((item) => item.status === true).method;
            switch (method) {
                case 'card':
                    return 'Tarjeta';
                case 'cash':
                    return 'Efectivo';
                case 'transfer':
                    return 'Transferencia';
                default:
            }
        } 
        //Agrega compatibilidad con versiones anteriores
        else if (data?.cardPaymentMethod) {
            return 'Tarjeta';
        } else if (data?.cashPaymentMethod) {
            return 'Efectivo';
        } else if (data?.transferPaymentMethod) {
            return 'Transferencia';
        }
    }
    const handlePaymentMethodValue = () => {
        if (data?.payment) {
            return separator(data?.payment.value)
        } else if (data?.cardPaymentMethod) {
            return separator(data?.cardPaymentMethod.value)
        } else if (data?.cashPaymentMethod) {
            return separator(data?.cashPaymentMethod.value)
        } else if (data?.transferPaymentMethod) {
            return separator(data?.transferPaymentMethod.value)
        }
    }

    return (
        <Container>
          
            <Row cols='3'>
                <SubTitle>TOTAL A PAGAR :</SubTitle>
                <Col textAlign='right'>{separator(data.totalTaxes.value)}</Col>
                <Col textAlign='right'>{separator(data.totalPurchase.value)}</Col>
            </Row>
            {
                data.delivery.status ? (
                    <Row cols='3'>
                        <P>ENVIO :</P>
                        <div></div>
                        <Col textAlign='right'>{separator(data.delivery.value)}</Col>
                    </Row>
                ) : null
            }
            <Row cols='3'>
                <P>
                    {handlePaymentMethod()} :
                </P>
                <div></div>
                <Col textAlign='right'>
                    {handlePaymentMethodValue()}
                </Col>
            </Row>
            <Row cols='3'>
                <P>CAMBIO :</P>
                <div></div>
                <Col textAlign='right'>{separator(data.change.value)}</Col>
            </Row>
        </Container>
    )
}

const Container = styled.div`
padding-top: 0.6em;
`