import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

export const useFbGetCreditNotesByInvoice = (invoiceId) => {
  const user = useSelector(selectUser);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const queryKey = `${user?.businessID}-${invoiceId}`;
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);

  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey);
    if (user?.businessID && invoiceId) {
      setLoading(true);
    } else {
      setLoading(false);
      setCreditNotes([]);
    }
  }

  useEffect(() => {
    if (!user?.businessID || !invoiceId) {
      return undefined;
    }

    // setLoading(true) handled by derived state above

    const ref = collection(db, 'businesses', user.businessID, 'creditNotes');
    const q = query(ref, where('invoiceId', '==', invoiceId));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => doc.data());
        setCreditNotes(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching credit notes by invoice:', err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.businessID, invoiceId]);

  return { creditNotes, loading };
};
