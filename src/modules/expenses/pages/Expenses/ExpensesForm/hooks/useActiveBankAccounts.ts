import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { BankAccount } from '@/types/accounting';
import {
  buildBankAccountLabel,
  normalizeBankAccountRecord,
} from '@/utils/accounting/bankAccounts';

export interface BankAccountOption {
  label: string;
  value: string;
  account: BankAccount;
}

interface ActiveBankAccountsState {
  businessId: string | null;
  options: BankAccountOption[];
  status: 'idle' | 'loaded' | 'error';
}

export const useActiveBankAccountsState = (
  businessId: string | null | undefined,
  isOpen: boolean,
): {
  error: boolean;
  loading: boolean;
  options: BankAccountOption[];
} => {
  const [state, setState] = useState<ActiveBankAccountsState>({
    businessId: null,
    options: [],
    status: 'idle',
  });

  useEffect(() => {
    if (!businessId || !isOpen) return;

    const ref = collection(db, 'businesses', businessId, 'bankAccounts');
    const q = query(ref, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextOptions = snapshot.docs
        .map((docSnap) => {
          const account = normalizeBankAccountRecord(
            docSnap.id,
            businessId,
            docSnap.data(),
          );

          return {
            value: account.id,
            label: buildBankAccountLabel(account),
            account,
          } satisfies BankAccountOption;
        })
        .sort((left, right) => left.label.localeCompare(right.label));

      setState({
        businessId,
        options: nextOptions,
        status: 'loaded',
      });
    }, () => {
      setState({
        businessId,
        options: [],
        status: 'error',
      });
    });

    return unsubscribe;
  }, [businessId, isOpen]);

  const isCurrentSnapshot =
    Boolean(businessId && isOpen) && state.businessId === businessId;

  return {
    error: isCurrentSnapshot && state.status === 'error',
    loading: Boolean(businessId && isOpen && !isCurrentSnapshot),
    options: isCurrentSnapshot ? state.options : [],
  };
};

export const useActiveBankAccounts = (
  businessId: string | null | undefined,
  isOpen: boolean,
): BankAccountOption[] => {
  const { options } = useActiveBankAccountsState(businessId, isOpen);

  return options;
};
