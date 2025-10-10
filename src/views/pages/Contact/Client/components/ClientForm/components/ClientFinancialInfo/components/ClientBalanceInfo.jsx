import * as antd from 'antd';
import React from 'react'
import styled from 'styled-components';


const { Button, } = antd;
import { setAccountPayment } from '../../../../../../../../../features/accountsReceivable/accountsReceivablePaymentSlice';

import { useDispatch } from 'react-redux';

import { useFormatPrice } from '../../../../../../../../../hooks/useFormatPrice';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faHashtag
} from '@fortawesome/free-solid-svg-icons';

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
        <Container>
            <ClientInfoSection>
                <ClientDetails>
                    <ClientCode>
                        <FontAwesomeIcon icon={faHashtag} />
                        <span>Número: {client?.numberId}</span>
                    </ClientCode>
                    <ClientName>
                        <FontAwesomeIcon icon={faUser} />
                        <span>{client?.name}</span>
                    </ClientName>
                </ClientDetails>
                <BalanceSection>
                    <BalanceLabel>
                        <span>Balance General</span>
                    </BalanceLabel>
                    <BalanceValue>{useFormatPrice(pendingBalance)}</BalanceValue>
                </BalanceSection>
                <PaymentSection>
                    <PaymentButton
                        type='primary'
                        onClick={handlePayment}
                    >
                        Pagar
                    </PaymentButton>
                </PaymentSection>
            </ClientInfoSection>
        </Container>
    )
}

const Container = styled.div`
    padding: 0px 12px;
    background: transparent;
`;

const ClientInfoSection = styled.div`
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 16px;
    align-items: center;
`;

const ClientDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
`;

const ClientCode = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
    font-weight: 500;
    line-height: 1.5;
    margin: 0;
    
    svg {
        font-size: 0.7rem;
        opacity: 0.7;
    }
`;

const ClientName = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color:  'rgba(0, 0, 0, 0.87)';
    font-weight: 500;
    line-height: 1.4;
    margin: 0;
    overflow: hidden;
    
    svg {
        font-size: 0.8rem;
        opacity: 0.8;
        flex-shrink: 0;
    }
    
    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const BalanceSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
`;

const BalanceLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
    font-weight: 500;
    line-height: 1.5;
    margin: 0;
    
    svg {
        font-size: 0.7rem;
        opacity: 0.7;
    }
`;

const BalanceValue = styled.span`
    font-size: 1rem;
    color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
    font-weight: 600;
    line-height: 1.4;
    margin: 0;
`;

const PaymentSection = styled.div`
    display: flex;
    align-items: center;
`;

const PaymentButton = styled(Button)`
    height: 28px;
    padding: 0 12px;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.4;
    border-radius: 4px;
    box-shadow: none;
    
    .anticon {
        font-size: 0.75rem;
    }
    
    &:hover, &:focus {
        box-shadow: none;
    }
`;