import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as antd from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { setAccountPayment } from '../../../../../../../../../../features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectClient } from '../../../../../../../../../../features/clientCart/clientCartSlice';
import { formatPrice } from '../../../../../../../../../../utils/formatPrice';

const { Button } = antd;

export function Payment({ installments, balance, isActive, account }) {
  const dispatch = useDispatch();
  const client = useSelector(selectClient);

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
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const PaymentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #2e7d32;
  border-radius: 3px;
  width: ${({ $percentage }) => $percentage}%;
  transition: width 0.3s ease;
`;

const PaymentActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
`;

const BalanceAmount = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $isPaid }) => ($isPaid ? '#2e7d32' : '#cf1322')};
  text-align: right;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const PaymentButton = styled(Button)`
  height: 32px;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  &:disabled {
    opacity: 0.5;
  }

  svg {
    font-size: 12px;
  }
`;

export const PaymentRow = styled.div`
  display: grid;
  padding: 0.4em;
  grid-template-columns: min-content 0.7fr 1fr min-content;
`;
