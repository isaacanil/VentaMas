import { faUser, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';


export const ClientBalanceInfo = ({ client, pendingBalance }) => {
  const dispatch = useDispatch();
  const handlePayment = () => {
    dispatch(
      setAccountPayment({
        isOpen: true,
        paymentDetails: {
          paymentScope: 'balance',
          totalAmount: pendingBalance,
          clientId: client.id,
        },
      }),
    );
  };
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
          <BalanceValue>{formatPrice(pendingBalance)}</BalanceValue>
        </BalanceSection>
        <PaymentSection>
          <PaymentButton type="primary" onClick={handlePayment}>
            Pagar
          </PaymentButton>
        </PaymentSection>
      </ClientInfoSection>
    </Container>
  );
};

const Container = styled.div`
  padding: 0 12px;
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
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};

  svg {
    font-size: 0.7rem;
    opacity: 0.7;
  }
`;

const ClientName = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  color: 'rgba(0, 0, 0, 0.87)';

  svg {
    flex-shrink: 0;
    font-size: 0.8rem;
    opacity: 0.8;
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
  gap: 4px;
  align-items: flex-end;
`;

const BalanceLabel = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};

  svg {
    font-size: 0.7rem;
    opacity: 0.7;
  }
`;

const BalanceValue = styled.span`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
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

  &:hover,
  &:focus {
    box-shadow: none;
  }
`;
