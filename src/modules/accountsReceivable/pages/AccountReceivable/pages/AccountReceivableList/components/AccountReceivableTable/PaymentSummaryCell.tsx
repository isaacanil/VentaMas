import styled from 'styled-components';

import { getTimeElapsed } from '@/utils/date/formatTime';
import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format';

import type { TimestampLike } from '@/utils/accountsReceivable/types';

type PaymentStatus = 'unpaid' | 'partial' | 'paid';

const statusBg: Record<PaymentStatus, string> = {
  unpaid: '#fee2e2', // rojo claro acentuado
  partial: '#fef3c7', // amarillo claro acentuado
  paid: '#dcfce7', // verde claro acentuado
};

const statusBorder: Record<PaymentStatus, string> = {
  unpaid: '#fca5a5', // rojo borde
  partial: '#fcd34d', // amarillo borde
  paid: '#86efac', // verde borde
};

const Wrapper = styled.div<{ $status: PaymentStatus }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
  color: #1f2937;
  background: ${({ $status }) => statusBg[$status]};
  border: 1px solid ${({ $status }) => statusBorder[$status]};
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 170px;
  width: fit-content;
`;

const PaidRow = styled.span`
  font-weight: 600;
  white-space: nowrap;
`;

const LastPaymentRow = styled.span`
  font-size: 0.8em;
  color: #4b5563;
  white-space: nowrap;
`;

interface PaymentSummaryCellProps {
  totalPaid: number;
  initialAmount: number;
  lastPaymentDate?: TimestampLike;
}

const getStatus = (totalPaid: number, initialAmount: number): PaymentStatus => {
  const balance = initialAmount - totalPaid;
  if (balance <= 0.01) return 'paid';
  if (totalPaid > 0.01) return 'partial';
  return 'unpaid';
};

export const PaymentSummaryCell = ({
  totalPaid,
  initialAmount,
  lastPaymentDate,
}: PaymentSummaryCellProps) => {
  const time = toMillis(lastPaymentDate) ?? null;
  const lastPaymentText = time ? getTimeElapsed(time, 0) : 'Sin pagos';
  const status = getStatus(totalPaid, initialAmount);

  return (
    <Wrapper $status={status}>
      <PaidRow>
        {formatPrice(totalPaid)} / {formatPrice(initialAmount)}
      </PaidRow>
      <LastPaymentRow>Último: {lastPaymentText}</LastPaymentRow>
    </Wrapper>
  );
};
