import { useDispatch } from 'react-redux';

import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';

import type { AccountPaymentClientSummary } from '../components/AccountPaymentControl/types';
import { buildBalancePaymentPayload } from '../utils/buildBalancePaymentPayload';

export function useOpenBalancePayment(
  client?: AccountPaymentClientSummary | null,
) {
  const dispatch = useDispatch();

  const openBalancePayment = (pendingBalance: number) => {
    if (!client?.id) return;

    dispatch(
      setAccountPayment(
        buildBalancePaymentPayload({
          client,
          pendingBalance,
        }),
      ),
    );
  };

  return { openBalancePayment };
}
