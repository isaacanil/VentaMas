import { useDispatch, useSelector } from 'react-redux';

import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

import type { AccountPaymentClientSummary } from '../components/AccountPaymentControl/types';
import { buildAccountPaymentPayload } from '../utils/buildAccountPaymentPayload';

type ClientRootState = Parameters<typeof selectClient>[0];

type OpenAccountPaymentInput = {
  account: AccountsReceivableDoc;
  balance: number;
};

export function useOpenAccountPayment(
  propClient?: AccountPaymentClientSummary | null,
) {
  const dispatch = useDispatch();
  const storeClient = useSelector<
    ClientRootState,
    ReturnType<typeof selectClient>
  >(selectClient);
  const client =
    propClient ||
    (storeClient as AccountPaymentClientSummary | null | undefined);

  const openAccountPayment = ({
    account,
    balance,
  }: OpenAccountPaymentInput) => {
    if (!client?.id || !account?.id) return;

    dispatch(
      setAccountPayment(
        buildAccountPaymentPayload({
          client,
          account,
          balance,
        }),
      ),
    );
  };

  return { openAccountPayment };
}
