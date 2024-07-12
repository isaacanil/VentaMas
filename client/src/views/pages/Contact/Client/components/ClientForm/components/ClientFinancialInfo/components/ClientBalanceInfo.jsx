import React from 'react'
import { ClientName, CodeTitle, Header, BalanceAmount, BalanceCard, } from '../ClientFinancialInfo'
import styled from 'styled-components';
import * as antd from 'antd';
const { Button, } = antd;
import { useFormatPrice } from '@hooks/useFormatPrice';
import { setAccountPayment } from '../../../../../../../../../features/accountsReceivable/accountsReceivablePaymentSlice';
import { useDispatch } from 'react-redux';

export const ClientBalanceInfo = ({
    client, 
    pendingBalance,
}) => {
    const dispatch = useDispatch()
    const handlePayment = () => {
        dispatch(setAccountPayment({
            isOpen: true,
            paymentDetails: {
                paymentScope: 'balance',
                totalAmount: pendingBalance,
                clientId: client.id,
            }
        }))
    }
    return (
        <div>
            <Row>
                <CodeTitle>Código: {client?.numberId}</CodeTitle>
                <CodeTitle>Balance general</CodeTitle>
            </Row>
            <Row>
                <CodeTitle>{client?.name}</CodeTitle>
                <BalanceAmount>{useFormatPrice(pendingBalance)}</BalanceAmount>
                <Button
                    type='primary'
                    onClick={handlePayment}
                >Pagar</Button>
            </Row>
        </div>
    )
}

const Container = styled.div`
    padding: 16px;
    `;
const BalanceTitle = styled.div`
    font-size: 16px;
    font-weight: 500;
    `;
const StyledButton = styled(Button)`
    width: 100%;
    `;
const Row = styled.div`
display: grid;
grid-template-columns: 1fr 1fr 6em;
`;
const Col = styled.div`
        
`