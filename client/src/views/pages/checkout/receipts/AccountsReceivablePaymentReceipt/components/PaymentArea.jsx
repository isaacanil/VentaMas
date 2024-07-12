import React, { Fragment, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Row } from '../../../components/Table/Row'
import { Paragraph, Spacing, Subtitle } from '../../../Style'
import { Col } from '../../../components/Table/Col'
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice'

function calculateTotal(paymentMethods) {
    return paymentMethods?.reduce((total, payment) => total + payment.value, 0);
}

export const PaymentArea = ({ data }) => {
    const paymentLabel = {
        cash: "Efectivo",
        card: "Tarjeta",
        transfer: "Trasferencia"
    }
    const items = [
        ...data?.paymentMethod?.filter(item => item?.status === true)
            .map((item) => ({
                label: paymentLabel[item?.method],
                value2: useFormatPrice(item?.value),
                condition: true
            })) || [],
        {
            subtitle: 'TOTAL PAGADO',
            value2: useFormatPrice(calculateTotal(data?.paymentMethod)),
            condition: true, 
            spacingStart: true,
            spacingEnd: true
    
        },
        {
            label: data?.change >= 0 ? "CAMBIO" : "FALTANTE",
            value2: useFormatPrice(data?.change),
            condition: true
        },

    ]
    return (
        <Container>
            {items.map((row, index) => <Item key={index} row={row} />)}
        </Container>
    )
}
const Item = ({ row: { subtitle, label, value1, value2, condition, textAlign, spacingStart, spacingEnd } }) => {
    return (
        <Fragment>
             {spacingStart && <Spacing />}
            {
                condition &&
                <Row cols='3'>
                    {subtitle && <Subtitle>{subtitle} : </Subtitle>}
                    {label && <Paragraph>{label} : </Paragraph>}
                    <Col textAlign={textAlign || 'right'}>{value1}</Col>
                    {subtitle ? <Subtitle align={textAlign || 'right'}>{value2}</Subtitle> : <Col textAlign={textAlign || 'right'}>{value2}</Col>}
                </Row>
            }
            {spacingEnd && <Spacing />}
        </Fragment>
    )
}

const Container = styled.div`
padding-top: 0.6em;
`