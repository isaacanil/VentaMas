import type { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

import type { AccountPaymentClientSummary } from '../components/AccountPaymentControl/types';

type AccountPaymentPayload = Parameters<typeof setAccountPayment>[0];

type BuildAccountPaymentPayloadInput = {
  client: AccountPaymentClientSummary;
  account: AccountsReceivableDoc;
  balance: number;
};

export function buildAccountPaymentPayload({
  client,
  account,
  balance,
}: BuildAccountPaymentPayloadInput): AccountPaymentPayload {
  return {
    isOpen: true,
    paymentDetails: {
      clientId: client.id ?? '',
      arId: account.id ?? '',
      paymentScope: 'account',
      totalAmount: balance,
    },
    extra: {
      ...account,
      clientName: client.name,
      clientCode: client.numberId ?? client.id,
    },
  };
}
