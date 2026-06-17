import { collection, getDocs, query, where } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { AccountsReceivablePayment } from '@/utils/accountsReceivable/types';
import { toMillis } from '@/utils/date/toMillis';

export type AccountReceivablePaymentRecord = AccountsReceivablePayment & {
  id: string;
};

type AccountReceivablePaymentsByArIdParams = {
  businessId: string;
  arId: string;
};

type AccountReceivablePaymentsByArIdsParams = {
  businessId: string;
  arIds: string[];
};

export const normalizeAccountReceivablePaymentArIds = (ids: string[]) =>
  Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));

const getAccountReceivablePaymentsCollection = (businessId: string) =>
  collection(db, 'businesses', businessId, 'accountsReceivablePayments');

export const createAccountReceivablePaymentsByArIdQuery = ({
  businessId,
  arId,
}: AccountReceivablePaymentsByArIdParams) =>
  query(
    getAccountReceivablePaymentsCollection(businessId),
    where('arId', '==', arId),
  );

export const mapAccountReceivablePaymentDoc = (
  docSnapshot: QueryDocumentSnapshot<DocumentData>,
): AccountReceivablePaymentRecord => ({
  id: docSnapshot.id,
  ...(docSnapshot.data() as AccountsReceivablePayment),
});

export const sortAccountReceivablePaymentsByDateDesc = <
  T extends Pick<AccountsReceivablePayment, 'createdAt' | 'date'>,
>(
  payments: T[],
): T[] =>
  [...payments].sort((left, right) => {
    const leftMillis = toMillis(left.date ?? left.createdAt) ?? 0;
    const rightMillis = toMillis(right.date ?? right.createdAt) ?? 0;
    return rightMillis - leftMillis;
  });

export const fetchAccountReceivablePaymentsByArId = async ({
  businessId,
  arId,
}: AccountReceivablePaymentsByArIdParams): Promise<
  AccountReceivablePaymentRecord[]
> => {
  if (!businessId || !arId) return [];

  const snapshot = await getDocs(
    createAccountReceivablePaymentsByArIdQuery({ businessId, arId }),
  );

  return snapshot.docs.map(mapAccountReceivablePaymentDoc);
};

export const fetchAccountReceivablePaymentsByArIds = async ({
  businessId,
  arIds,
}: AccountReceivablePaymentsByArIdsParams): Promise<
  AccountReceivablePaymentRecord[]
> => {
  const normalizedArIds = normalizeAccountReceivablePaymentArIds(arIds);
  if (!businessId || normalizedArIds.length === 0) return [];

  const paymentGroups = await Promise.all(
    normalizedArIds.map((arId) =>
      fetchAccountReceivablePaymentsByArId({ businessId, arId }),
    ),
  );

  return sortAccountReceivablePaymentsByDateDesc(paymentGroups.flat());
};
