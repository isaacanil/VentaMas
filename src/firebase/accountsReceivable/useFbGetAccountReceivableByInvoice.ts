import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

type UserRootState = Parameters<typeof selectUser>[0];

type AccountRow = AccountsReceivableDoc & { id: string };

type AccountsReceivableSnapshot = {
  businessId: string | null;
  invoiceId: string | null;
  accountsReceivable: AccountRow[];
};

export const useFbGetAccountReceivableByInvoice = (
  invoiceId: string | null | undefined,
) => {
  const user = useSelector((state: UserRootState) => selectUser(state));
  const businessId = user?.businessID ?? null;
  const [snapshot, setSnapshot] = useState<AccountsReceivableSnapshot>({
    businessId: null,
    invoiceId: null,
    accountsReceivable: [],
  });

  const hasScope = Boolean(businessId && invoiceId);
  const hasCurrentSnapshot =
    hasScope &&
    snapshot.businessId === businessId &&
    snapshot.invoiceId === invoiceId;

  const accountsReceivable = hasCurrentSnapshot
    ? snapshot.accountsReceivable
    : [];
  const loading = hasScope && !hasCurrentSnapshot;

  useEffect(() => {
    if (!businessId || !invoiceId) {
      return undefined;
    }

    const ref = collection(
      db,
      'businesses',
      businessId,
      'accountsReceivable',
    );
    const q = query(ref, where('invoiceId', '==', invoiceId));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as AccountsReceivableDoc),
        }));
        setSnapshot({
          businessId,
          invoiceId,
          accountsReceivable: list,
        });
      },
      (err) => {
        console.error('Error fetching accounts receivable by invoice:', err);
        setSnapshot({
          businessId,
          invoiceId,
          accountsReceivable: [],
        });
      },
    );

    return () => unsubscribe();
  }, [businessId, invoiceId]);

  return { accountsReceivable, loading };
};
