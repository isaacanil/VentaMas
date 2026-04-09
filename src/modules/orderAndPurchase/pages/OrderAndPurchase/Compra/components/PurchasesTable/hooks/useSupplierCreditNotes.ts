import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { SupplierCreditNote } from '@/types/payments';
import { toMillis } from '@/utils/date/toMillis';

const THRESHOLD = 0.01;

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveRemainingAmount = (creditNote: SupplierCreditNote): number => {
  const totalAmount = roundToTwoDecimals(
    toFiniteNumber(creditNote.totalAmount) ?? 0,
  );
  const appliedAmount = roundToTwoDecimals(
    toFiniteNumber(creditNote.appliedAmount) ?? 0,
  );

  return roundToTwoDecimals(
    Math.max(
      toFiniteNumber(creditNote.remainingAmount) ??
        Math.max(totalAmount - appliedAmount, 0),
      0,
    ),
  );
};

const normalizeSupplierCreditNote = (
  id: string,
  value: unknown,
): SupplierCreditNote => {
  const creditNote = value as SupplierCreditNote;

  return {
    ...creditNote,
    id,
    remainingAmount: resolveRemainingAmount(creditNote),
  };
};

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
        const nextCreditNotes = snapshot.docs
          .map((docSnap) =>
            normalizeSupplierCreditNote(docSnap.id, docSnap.data()),
          )
          .filter((creditNote) => {
            const status = String(creditNote.status || '').toLowerCase();
            return (
              status !== 'void' && (creditNote.remainingAmount ?? 0) > THRESHOLD
            );
          })
          .sort(
            (left, right) =>
              (toMillis(left.createdAt) ?? toMillis(left.updatedAt) ?? 0) -
              (toMillis(right.createdAt) ?? toMillis(right.updatedAt) ?? 0),
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
