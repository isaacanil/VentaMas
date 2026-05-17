import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { CreditNoteRecord } from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

interface UpdateCustomerCreditNoteRequest {
  businessId: string;
  creditNoteId: string;
  updates: Partial<CreditNoteRecord>;
  sessionToken?: string;
}

interface UpdateCustomerCreditNoteResponse {
  ok: boolean;
  creditNoteId: string;
}

const updateCustomerCreditNoteCallable = httpsCallable<
  UpdateCustomerCreditNoteRequest,
  UpdateCustomerCreditNoteResponse
>(functions, 'updateCustomerCreditNote');

/**
 * Actualiza una nota no emitida por callable. Las notas emitidas/aplicadas son
 * inmutables desde cliente.
 */
export const fbUpdateCreditNote = async (
  user: UserIdentity | null | undefined,
  creditNoteId: string,
  updates: Partial<CreditNoteRecord>,
): Promise<void> => {
  if (!user?.businessID) throw new Error('Usuario sin businessID');
  if (!creditNoteId) throw new Error('creditNoteId requerido');

  const { sessionToken } = getStoredSession();
  await updateCustomerCreditNoteCallable({
    businessId: user.businessID,
    creditNoteId,
    updates,
    ...(sessionToken ? { sessionToken } : {}),
  });
};
