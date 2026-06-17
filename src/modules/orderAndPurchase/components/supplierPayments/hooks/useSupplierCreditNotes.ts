import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { SupplierCreditNote } from '@/types/payments';

import { normalizeSupplierCreditNotes } from '../utils/supplierPaymentMethods';

export const useSupplierCreditNotes = (
  businessId: string | null | undefined,
  supplierId: string | null | undefined,
  isOpen: boolean,
) => {
  const [creditNotes, setCreditNotes] = useState<SupplierCreditNote[]>([]);
  const [hasResolved, setHasResolved] = useState(false);

  useEffect(() => {
    if (!businessId || !supplierId || !isOpen) {
      return undefined;
    }

    const creditNotesRef = collection(
      db,
      'businesses',
      businessId,
      'supplierCreditNotes',
    );
    const creditNotesQuery = query(
      creditNotesRef,
      where('supplierId', '==', supplierId),
    );

    const unsubscribe = onSnapshot(
      creditNotesQuery,
      (snapshot) => {
        const nextCreditNotes = normalizeSupplierCreditNotes(
          snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as SupplierCreditNote),
            id: docSnap.id,
          })),
        );

        setCreditNotes(nextCreditNotes);
        setHasResolved(true);
      },
      (error) => {
        console.error('Error fetching supplier credit notes:', error);
        setCreditNotes([]);
        setHasResolved(true);
      },
    );

    return unsubscribe;
  }, [businessId, isOpen, supplierId]);

  return {
    creditNotes: businessId && supplierId && isOpen ? creditNotes : [],
    loading: businessId && supplierId && isOpen ? !hasResolved : false,
  };
};
