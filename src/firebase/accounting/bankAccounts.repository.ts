import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { BankAccount } from '@/types/accounting';
import {
  buildBankAccountLabel,
  normalizeBankAccountRecord,
} from '@/utils/accounting/bankAccounts';

export interface ActiveBankAccountOption {
  account: BankAccount;
  label: string;
  value: string;
}

export const listenActiveBankAccountOptions = (
  businessId: string,
  onNext: (options: ActiveBankAccountOption[]) => void,
  onError: () => void,
) => {
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
          } satisfies ActiveBankAccountOption;
        })
        .sort((left, right) => left.label.localeCompare(right.label));

      onNext(options);
    },
    onError,
  );
};
