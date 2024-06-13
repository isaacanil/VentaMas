import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Row } from './Table/Row'
import { separator } from '../../../../hooks/separator'
import { SubTitle } from '../Receipt'
import { Col } from './Table/Col'
import { fbGetPendingBalance } from '../../../../firebase/accountsReceivable/fbGetPendingBalance'
import { selectUser } from '../../../../features/auth/userSlice'
import { useSelector } from 'react-redux'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'

export const PaymentArea = ({ data, P }) => {
    const [pendingBalance, setPendingBalance] = useState(0)
    const user = useSelector(selectUser);
    const businessID = user?.businessID
    const clientId = data?.client?.id
    useEffect(() => {
        const fetchPendingBalance = async () => {
            if(!businessID || !clientId) return 
            await fbGetPendingBalance(businessID, clientId)
                .then((result) => {
                    setPendingBalance(result)
                })
        }
        fetchPendingBalance()
    }, [businessID, clientId])
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
                <P> {data?.change?.value >= 0 ? "CAMBIO" : "FALTANTE"}</P>
                <div></div>
                <Col textAlign='right'>{useFormatPrice(data?.change?.value)}</Col>
            </Row>
            {
                data?.change?.value < 0 && (
                    <>
                        <Row cols='3'>
                            <P>BALANCE ACTUAL : </P>
                            <div></div>
                            <Col textAlign='right'>{useFormatPrice(pendingBalance)}</Col>
                        </Row>
                    </>
                )
            }

        </Container>
    )
}

const Container = styled.div`
padding-top: 0.6em;
`