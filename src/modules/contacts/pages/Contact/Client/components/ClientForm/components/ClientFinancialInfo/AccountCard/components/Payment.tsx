import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { formatPrice } from '@/utils/format';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

type ClientSummary = {
  id?: string;
} & Record<string, unknown>;

type PaymentProps = {
  installments: number;
  balance: number;
  isActive?: boolean;
  account: AccountsReceivableDoc;
  client?: ClientSummary | null;
};

type ClientRootState = Parameters<typeof selectClient>[0];

export function Payment({
  installments,
  balance,
  isActive,
  account,
  client: propClient,
}: PaymentProps) {
  const dispatch = useDispatch();
  const storeClient = useSelector<
    ClientRootState,
    ReturnType<typeof selectClient>
  >(selectClient);
  const client = propClient || storeClient;

  const handleOpenPayment = () => {
    if (!client?.id || !account?.id) return;
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
          clientName: client?.name,
          clientCode:
            (client as { numberId?: string | number })?.numberId ?? client?.id,
        },
      }),
    );
  };

  const getProgress = () => {
    const paid = account?.paidInstallments?.length || 0;
    return installments > 0 ? (paid / installments) * 100 : 0;
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

const ProgressFill = styled.div<{ $percentage: number }>`
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

const BalanceAmount = styled.div<{ $isPaid: boolean }>`
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
