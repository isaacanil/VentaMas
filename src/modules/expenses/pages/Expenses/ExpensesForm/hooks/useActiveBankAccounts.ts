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

export const useActiveBankAccounts = (
  businessId: string | null | undefined,
  isOpen: boolean,
): BankAccountOption[] => {
  const [options, setOptions] = useState<BankAccountOption[]>([]);

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

      setOptions(nextOptions);
    });

    return unsubscribe;
  }, [businessId, isOpen]);

  return options;
};
