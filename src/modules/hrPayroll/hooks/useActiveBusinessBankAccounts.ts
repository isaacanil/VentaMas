import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { BankAccount } from '@/types/accounting';
import {
  buildBankAccountLabel,
  normalizeBankAccountRecord,
} from '@/utils/accounting/bankAccounts';

export interface HrBusinessBankAccountOption {
  account: BankAccount;
  label: string;
  value: string;
}

interface ActiveBankAccountsState {
  businessId: string | null;
  options: HrBusinessBankAccountOption[];
  status: 'idle' | 'loaded' | 'error';
}

export const useActiveBusinessBankAccounts = ({
  businessId,
  enabled,
}: {
  businessId?: string | null;
  enabled: boolean;
}): {
  error: boolean;
  loading: boolean;
  options: HrBusinessBankAccountOption[];
} => {
  const [state, setState] = useState<ActiveBankAccountsState>({
    businessId: null,
    options: [],
    status: 'idle',
  });

  useEffect(() => {
    if (!businessId || !enabled) return undefined;

    const bankAccountsRef = collection(
      db,
      'businesses',
      businessId,
      'bankAccounts',
    );
    const activeBankAccountsQuery = query(
      bankAccountsRef,
      where('status', '==', 'active'),
    );

    return onSnapshot(
      activeBankAccountsQuery,
      (snapshot) => {
        const options = snapshot.docs
          .map((docSnapshot) => {
            const account = normalizeBankAccountRecord(
              docSnapshot.id,
              businessId,
              docSnapshot.data(),
            );
            return {
              account,
              label: buildBankAccountLabel(account),
              value: account.id,
            };
          })
          .sort((left, right) => left.label.localeCompare(right.label));

        setState({
          businessId,
          options,
          status: 'loaded',
        });
      },
      () => {
        setState({
          businessId,
          options: [],
          status: 'error',
        });
      },
    );
  }, [businessId, enabled]);

  const hasCurrentSnapshot =
    Boolean(businessId && enabled) && state.businessId === businessId;

  return {
    error: hasCurrentSnapshot && state.status === 'error',
    loading: Boolean(businessId && enabled && !hasCurrentSnapshot),
    options: hasCurrentSnapshot ? state.options : [],
  };
};

