import { onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  createAccountReceivablePaymentsByArIdQuery,
  mapAccountReceivablePaymentDoc,
  sortAccountReceivablePaymentsByDateDesc,
  type AccountReceivablePaymentRecord,
} from './accountReceivablePayments.repository';

type UserRootState = Parameters<typeof selectUser>[0];

type PaymentRow = AccountReceivablePaymentRecord;
type PaymentsSnapshotState = {
  scopeKey: string | null;
  payments: PaymentRow[];
};

export const useFbGetAccountReceivablePayments = (
  arId: string | null | undefined,
) => {
  const user = useSelector((state: UserRootState) => selectUser(state));
  const [snapshotState, setSnapshotState] = useState<PaymentsSnapshotState>({
    scopeKey: null,
    payments: [],
  });
  const businessID = user?.businessID ?? null;
  const scopeKey = businessID && arId ? `${businessID}:${arId}` : null;

  useEffect(() => {
    if (!businessID || !arId || !scopeKey) {
      return undefined;
    }

    const paymentsQuery = createAccountReceivablePaymentsByArIdQuery({
      businessId: businessID,
      arId,
    });

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snap) => {
        const list = sortAccountReceivablePaymentsByDateDesc(
          snap.docs.map(mapAccountReceivablePaymentDoc),
        );
        setSnapshotState({ scopeKey, payments: list });
      },
      (err) => {
        console.error('Error fetching accounts receivable payments:', err);
        setSnapshotState({ scopeKey, payments: [] });
      },
    );

    return () => unsubscribe();
  }, [businessID, arId, scopeKey]);

  const isCurrentSnapshot = snapshotState.scopeKey === scopeKey;
  const payments = scopeKey && isCurrentSnapshot ? snapshotState.payments : [];
  const loading = Boolean(scopeKey) && !isCurrentSnapshot;

  return { payments, loading };
};
