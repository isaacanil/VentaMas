import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { CreditNoteRecord } from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

export const useFbGetCreditNotesByInvoice = (
  invoiceId?: string | null,
): { creditNotes: CreditNoteRecord[]; loading: boolean } => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>([]);
  const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(null);

  const businessID = user?.businessID ?? null;
  const queryKey = useMemo(
    () => `${businessID ?? 'no-business'}-${invoiceId ?? 'no-invoice'}`,
    [businessID, invoiceId],
  );

  useEffect(() => {
    if (!businessID || !invoiceId) {
      return undefined;
    }

    const ref = collection<CreditNoteRecord>(
      db,
      'businesses',
      businessID,
      'creditNotes',
    );
    const q = query(ref, where('invoiceId', '==', invoiceId));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setCreditNotes(list);
        setResolvedQueryKey(queryKey);
      },
      (err) => {
        console.error('Error fetching credit notes by invoice:', err);
        setResolvedQueryKey(queryKey);
      },
    );

    return () => unsubscribe();
  }, [businessID, invoiceId, queryKey]);

  const loading = Boolean(businessID && invoiceId) && queryKey !== resolvedQueryKey;
  const visibleCreditNotes = businessID && invoiceId ? creditNotes : [];

  return { creditNotes: visibleCreditNotes, loading };
};
