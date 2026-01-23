import { doc, updateDoc, Timestamp } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { CreditNoteRecord } from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

/**
 * Actualiza una Nota de Crédito existente.
 * @param {Object} user - Usuario con businessID.
 * @param {string} creditNoteId - ID de la nota de crédito (document).
 * @param {Object} updates - Campos a actualizar.
 */
export const fbUpdateCreditNote = async (
  user: UserIdentity | null | undefined,
  creditNoteId: string,
  updates: Partial<CreditNoteRecord>,
): Promise<void> => {
  if (!user?.businessID) throw new Error('Usuario sin businessID');
  if (!creditNoteId) throw new Error('creditNoteId requerido');

  const creditNoteRef = doc(
    db,
    'businesses',
    user.businessID,
    'creditNotes',
    creditNoteId,
  );
  const dataWithTimestamp = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(creditNoteRef, dataWithTimestamp);
};
