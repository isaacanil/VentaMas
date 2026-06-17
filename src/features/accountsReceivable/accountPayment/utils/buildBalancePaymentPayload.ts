import type { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';

import type { AccountPaymentClientSummary } from '../components/AccountPaymentControl/types';

type BalancePaymentPayload = Parameters<typeof setAccountPayment>[0];

type BuildBalancePaymentPayloadInput = {
  client: AccountPaymentClientSummary;
  pendingBalance: number;
};

export function buildBalancePaymentPayload({
  client,
  pendingBalance,
}: BuildBalancePaymentPayloadInput): BalancePaymentPayload {
  return {
    isOpen: true,
    paymentDetails: {
      paymentScope: 'balance',
      totalAmount: pendingBalance,
      clientId: client.id ?? '',
    },
    extra: {
      clientName: client.name,
      clientCode: client.numberId ?? client.id,
    },
  };
}
