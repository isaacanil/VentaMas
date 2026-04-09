import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/date/dateUtils';
import type { AccountsReceivablePayment } from '@/utils/accountsReceivable/types';

type UserRootState = Parameters<typeof selectUser>[0];

type PaymentRow = AccountsReceivablePayment & { id: string };

export const useFbGetAccountReceivablePayments = (
  arId: string | null | undefined,
) => {
  const user = useSelector((state: UserRootState) => selectUser(state));
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const deps = [user?.businessID, arId];
  const [prevDeps, setPrevDeps] = useState(deps);

  if (!user?.businessID || !arId) {
    if (payments.length > 0) setPayments([]);
    if (loading) setLoading(false);
  } else {
    const depsChanged = deps.some((d, i) => d !== prevDeps[i]);
    if (depsChanged) {
      setPrevDeps(deps);
      setLoading(true);
    }
  }

  useEffect(() => {
    if (!user?.businessID || !arId) {
      return undefined;
    }

    const ref = collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivablePayments',
    );
    const q = query(ref, where('arId', '==', arId));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as AccountsReceivablePayment),
        }));
        // Sort by date descending
        list.sort((a, b) => {
          const aMillis = toMillis(a.date) ?? 0;
          const bMillis = toMillis(b.date) ?? 0;
          return bMillis - aMillis;
        });
        setPayments(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching accounts receivable payments:', err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.businessID, arId]);

  return { payments, loading };
};
