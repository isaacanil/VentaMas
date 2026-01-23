import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { CREDIT_NOTE_STATUS } from '@/constants/creditNoteStatus';
import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { CreditNoteRecord } from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

export const useFbGetAvailableCreditNotes = (clientId: string | null | undefined) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>([]);
  const [loading, setLoading] = useState(
    () => Boolean(user?.businessID && clientId),
  );

  useEffect(() => {
    if (!user?.businessID || !clientId) {
      return;
    }

    const ref = collection(db, 'businesses', user.businessID, 'creditNotes');
    const q = query(
      ref,
      where('client.id', '==', clientId),
      where('status', 'in', [
        CREDIT_NOTE_STATUS.ISSUED,
        CREDIT_NOTE_STATUS.APPLIED,
      ]),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as CreditNoteRecord;
          return {
            ...data,
            id: d.id,
            availableAmount: data.availableAmount ?? (data.totalAmount || 0),
          };
        });
        setCreditNotes(list.filter((n) => (n.availableAmount || 0) > 0));
        setLoading(false);
      },
      (err) => {
        console.error('get available credit notes', err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [clientId, user?.businessID]);

  const totalAvailable = creditNotes.reduce(
    (s, n) => s + (n.availableAmount || 0),
    0,
  );

  return { creditNotes, loading, totalAvailable };
};
