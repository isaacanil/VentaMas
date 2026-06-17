import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { DebitNoteRecord } from '@/modules/invoice/types/debitNote';
import type { UserIdentity } from '@/types/users';

interface UpdateCustomerDebitNoteRequest {
  businessId: string;
  debitNoteId: string;
  updates: Partial<DebitNoteRecord>;
  sessionToken?: string;
}

interface UpdateCustomerDebitNoteResponse {
  ok: boolean;
  debitNoteId: string;
}

const updateCustomerDebitNoteCallable = createFirebaseCallable<
  UpdateCustomerDebitNoteRequest,
  UpdateCustomerDebitNoteResponse
>('updateCustomerDebitNote');

export const fbUpdateDebitNote = async (
  user: UserIdentity | null | undefined,
  debitNoteId: string,
  updates: Partial<DebitNoteRecord>,
): Promise<void> => {
  if (!user?.businessID) throw new Error('Usuario sin businessID');
  if (!debitNoteId) throw new Error('debitNoteId requerido');

  const { sessionToken } = getStoredSession();
  await updateCustomerDebitNoteCallable({
    businessId: user.businessID,
    debitNoteId,
    updates,
    ...(sessionToken ? { sessionToken } : {}),
  });
};
