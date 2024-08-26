import React, { Fragment, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Row } from './Table/Row'
import { Line, P, SubTitle } from '../Receipt'
import { Col } from './Table/Col'
import { fbGetPendingBalance } from '../../../../firebase/accountsReceivable/fbGetPendingBalance'
import { selectUser } from '../../../../features/auth/userSlice'
import { useSelector } from 'react-redux'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { useFormatNumber} from '../../../../hooks/useFormatNumber'
import { Paragraph, Spacing, Subtitle } from '../Style'

export const PaymentArea = ({ data }) => {
    const [pendingBalance, setPendingBalance] = useState(0)
    const user = useSelector(selectUser);
    const businessID = user?.businessID
    const clientId = data?.client?.id
    useEffect(() => {
        const fetchPendingBalance = async () => {
            if (!businessID || !clientId) return
            await fbGetPendingBalance(businessID, clientId, setPendingBalance)
        }
        fetchPendingBalance()
    }, [businessID, clientId])
    const paymentLabel = {
        cash: "Efectivo",
        card: "Tarjeta",
        transfer: "Tranferencia"
    }
    const items = [
        {
            label: 'ENVIO',
            value1: null,
            value2: useFormatNumber(data?.delivery?.value),
            condition: data?.delivery?.status
        },
        ...data?.paymentMethod?.filter(item => item?.status === true)
            .map((item) => ({
                label: paymentLabel[item?.method],
                value2: useFormatNumber(item?.value),
                condition: true
            })) || [],
        {
            subtitle: 'TOTAL',
            value1: useFormatNumber(data?.totalTaxes?.value),
            value2: useFormatNumber(data?.totalPurchase?.value),
            condition: true,
            spacingEnd: true,
            spacingStart: true, 
        },
        {
            label: data?.change?.value >= 0 ? "CAMBIO" : "FALTANTE",
            value2: useFormatNumber(data?.change?.value),
            condition: true
        },
        {
            label: 'BALANCE ACTUAL',
            value2: useFormatNumber(pendingBalance),
            condition: data?.change?.value < 0
        }
    ]
    return (
        <Container>
            {items.map((row, index) => <Item key={index} row={row} />)}
        </Container>
    )
}
const Item = ({ row: { subtitle, label, value1, value2, condition, textAlign, spacingEnd, spacingStart, line } }) => {
    return (
        <Fragment>
             {spacingStart && <Spacing />}
            {condition &&
                <Row cols='3'>
                    {subtitle && <SubTitle>{subtitle} : </SubTitle>}
                    {label && <Paragraph>{label} : </Paragraph>}
                    <Col textAlign={textAlign || 'right'}>{value1}</Col>
                 
                    {subtitle ? <Subtitle align={textAlign || 'right'}>{value2}</Subtitle> : <Col textAlign={textAlign || 'right'}>{value2}</Col>}
                </Row>}
                {spacingEnd && <Spacing />}
             {  line && <Line />}
        </Fragment>
    )
}

const Container = styled.div`
padding-top: 0.6em;
`