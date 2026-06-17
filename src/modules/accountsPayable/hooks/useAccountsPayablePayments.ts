import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { AccountsPayablePayment } from '@/types/payments';
import { toMillis } from '@/utils/date/toMillis';

const normalizeAccountsPayablePayment = (
  id: string,
  value: unknown,
): AccountsPayablePayment => ({
  ...(value as AccountsPayablePayment),
  id,
});

interface UseAccountsPayablePaymentsOptions {
  includeVoided?: boolean;
}

export const useAccountsPayablePayments = (
  businessId: string | null | undefined,
  purchaseId: string | null | undefined,
  isOpen: boolean,
  options: UseAccountsPayablePaymentsOptions = {},
) => {
  const [payments, setPayments] = useState<AccountsPayablePayment[]>([]);
  const [hasResolved, setHasResolved] = useState(false);
  const includeVoided = options.includeVoided === true;

  useEffect(() => {
    if (!businessId || !purchaseId || !isOpen) {
      return undefined;
    }

    const paymentsRef = collection(
      db,
      'businesses',
      businessId,
      'accountsPayablePayments',
    );
    const paymentsQuery = query(
      paymentsRef,
      where('purchaseId', '==', purchaseId),
    );

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const nextPayments = snapshot.docs
          .map((docSnap) =>
            normalizeAccountsPayablePayment(docSnap.id, docSnap.data()),
          )
          .filter((payment) => {
            if (payment.status === 'draft') {
              return false;
            }
            if (!includeVoided && payment.status === 'void') {
              return false;
            }
            return true;
          })
          .sort(
            (left, right) =>
              (toMillis(right.occurredAt) ?? toMillis(right.createdAt) ?? 0) -
              (toMillis(left.occurredAt) ?? toMillis(left.createdAt) ?? 0),
          );

        setPayments(nextPayments);
        setHasResolved(true);
      },
      (error) => {
        console.error('Error fetching accounts payable payments:', error);
        setPayments([]);
        setHasResolved(true);
      },
    );

    return unsubscribe;
  }, [businessId, includeVoided, isOpen, purchaseId]);

  return {
    payments: businessId && purchaseId && isOpen ? payments : [],
    loading: businessId && purchaseId && isOpen ? !hasResolved : false,
  };
};
