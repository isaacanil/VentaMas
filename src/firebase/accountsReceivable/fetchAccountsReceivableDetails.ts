import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import type { UserIdentity } from '@/types/users';
import type {
  AccountsReceivableDetail,
  AccountsReceivableDoc,
  AccountsReceivableInstallment,
  AccountsReceivableInstallmentPayment,
  AccountsReceivablePayment,
} from '@/utils/accountsReceivable/types';

async function fetchAccountsReceivableDetails(
  user: UserIdentity | null | undefined,
  id?: string,
): Promise<AccountsReceivableDetail> {
  if (!user?.businessID) {
    throw new Error('User business ID is missing');
  }
  if (!id) {
    throw new Error('Account Receivable ID is missing');
  }

  const accountReceivableRef = doc(
    db,
    `businesses/${user.businessID}/accountsReceivable`,
    id,
  );
  const accountReceivableDoc = await getDoc(accountReceivableRef);

  if (!accountReceivableDoc.exists()) {
    throw new Error('Account Receivable not found');
  }

  const accountReceivableData =
    (accountReceivableDoc.data() as AccountsReceivableDoc | undefined) || {};

  const fetchRelatedData = async <T extends object>(
    collectionName: string,
    queryField: string,
    queryValue: string,
  ): Promise<T[]> => {
    const collectionRef = collection(
      db,
      `businesses/${user.businessID}/${collectionName}`,
    );
    const dataQuery = query(collectionRef, where(queryField, '==', queryValue));
    const snapshot = await getDocs(dataQuery);
    return snapshot.docs.map(
      (docSnap) =>
        ({ id: docSnap.id, ...(docSnap.data() || {}) }) as unknown as T,
    );
  };

  const installmentsData = await fetchRelatedData<AccountsReceivableInstallment>(
    'accountsReceivableInstallments',
    'arId',
    id,
  );
  const installmentPaymentsData =
    await fetchRelatedData<AccountsReceivableInstallmentPayment>(
    'accountsReceivableInstallmentPayments',
    'arId',
    id,
  );

  const paymentsData = await fetchRelatedData<AccountsReceivablePayment>(
    'accountsReceivablePayments',
    'arId',
    id,
  );

  return {
    ar: { id: accountReceivableDoc.id, ...accountReceivableData },
    installments: installmentsData,
    installmentPayments: installmentPaymentsData,
    payments: paymentsData,
  };
}

export default fetchAccountsReceivableDetails;
