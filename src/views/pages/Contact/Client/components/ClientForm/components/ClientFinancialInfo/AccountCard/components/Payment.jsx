import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as antd from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { setAccountPayment } from '../../../../../../../../../../features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectClient } from '../../../../../../../../../../features/clientCart/clientCartSlice';
import { formatPrice } from '../../../../../../../../../../utils/formatPrice';

const { Button } = antd;

export function Payment({
  installments,
  balance,
  isActive,
  account,
  client: propClient,
}) {
  const dispatch = useDispatch();
  const storeClient = useSelector(selectClient);
  const client = propClient || storeClient;

  const handleOpenPayment = () => {
    dispatch(
      setAccountPayment({
        isOpen: true,
        paymentDetails: {
          clientId: client.id,
          arId: account.id,
          paymentScope: 'account',
          totalAmount: balance,
        },
        extra: {
          ...account,
        },
      }),
    );
  };

  const getProgress = () => {
    const paid = account?.paidInstallments?.length || 0;
    return (paid / installments) * 100;
  };

  return (
    <PaymentContainer>
      <PaymentInfo>
        <ProgressBar>
          <ProgressFill $percentage={getProgress()} />
        </ProgressBar>
      </PaymentInfo>

      <PaymentActions>
        <BalanceAmount $isPaid={balance === 0}>
          {formatPrice(balance)}
        </BalanceAmount>
        <PaymentButton
          type="primary"
          disabled={!isActive}
          onClick={handleOpenPayment}
          icon={<FontAwesomeIcon icon={faMoneyBillWave} />}
        >
          Pagar
        </PaymentButton>
      </PaymentActions>
    </PaymentContainer>
  );
}

const PaymentContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;

  @media (width <= 480px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
`;

const PaymentInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 3px;
`;

const ProgressFill = styled.div`
  width: ${({ $percentage }) => $percentage}%;
  height: 100%;
  background: #2e7d32;
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const PaymentActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;

  @media (width <= 480px) {
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
`;

const BalanceAmount = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $isPaid }) => ($isPaid ? '#2e7d32' : '#cf1322')};
  text-align: right;

  @media (width <= 480px) {
    font-size: 14px;
  }
`;

const PaymentButton = styled(Button)`
  display: flex;
  gap: 6px;
  align-items: center;
  height: 32px;
  font-weight: 500;
  border-radius: 6px;

  &:disabled {
    opacity: 0.5;
  }

  svg {
    font-size: 12px;
  }
`;

export const PaymentRow = styled.div`
  display: grid;
  grid-template-columns: min-content 0.7fr 1fr min-content;
  padding: 0.4em;
`;
