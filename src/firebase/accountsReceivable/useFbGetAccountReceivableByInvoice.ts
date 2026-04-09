import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

type UserRootState = Parameters<typeof selectUser>[0];

type AccountRow = AccountsReceivableDoc & { id: string };

export const useFbGetAccountReceivableByInvoice = (
  invoiceId: string | null | undefined,
) => {
  const user = useSelector((state: UserRootState) => selectUser(state));
  const [accountsReceivable, setAccountsReceivable] = useState<AccountRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const deps = [user?.businessID, invoiceId];
  const [prevDeps, setPrevDeps] = useState(deps);

  if (!user?.businessID || !invoiceId) {
    if (accountsReceivable.length > 0) setAccountsReceivable([]);
    if (loading) setLoading(false);
  } else {
    const depsChanged = deps.some((d, i) => d !== prevDeps[i]);
    if (depsChanged) {
      setPrevDeps(deps);
      setLoading(true);
    }
  }

  useEffect(() => {
    if (!user?.businessID || !invoiceId) {
      return undefined;
    }

    const ref = collection(
      db,
      'businesses',
      user.businessID,
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
        setAccountsReceivable(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching accounts receivable by invoice:', err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.businessID, invoiceId]);

  return { accountsReceivable, loading };
};
