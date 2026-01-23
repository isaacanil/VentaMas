import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { CreditNoteApplicationRecord } from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

/**
 * Hook para obtener aplicaciones de notas de crédito por factura
 * @param {string} invoiceId - ID de la factura
 * @returns {Object} - { applications, loading }
 */
export const useFbGetCreditNoteApplicationsByInvoice = (invoiceId: string | null | undefined) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [applications, setApplications] = useState<CreditNoteApplicationRecord[]>([]);
  const [loading, setLoading] = useState(
    () => Boolean(user?.businessID && invoiceId),
  );

  useEffect(() => {
    if (!user?.businessID || !invoiceId) {
      return;
    }

    const applicationsRef = collection(
      db,
      'businesses',
      user.businessID,
      'creditNoteApplications',
    );
    const q = query(
      applicationsRef,
      where('invoiceId', '==', invoiceId),
      orderBy('appliedAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as CreditNoteApplicationRecord),
          id: docSnap.id,
        }));
        setApplications(list);
        setLoading(false);
      },
      (error) => {
        console.error(
          'Error fetching credit note applications by invoice:',
          error,
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.businessID, invoiceId]);

  return { applications, loading };
};
