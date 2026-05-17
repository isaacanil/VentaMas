import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type {
  CreditNoteCreateInput,
  CreditNoteRecord,
} from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

type CreditNoteUser = UserIdentity & {
  displayName?: string | null;
};

interface CreateCustomerCreditNoteRequest {
  businessId: string;
  creditNote: CreditNoteCreateInput;
  displayName?: string;
  sessionToken?: string;
}

interface CreateCustomerCreditNoteResponse {
  ok: boolean;
  creditNote: CreditNoteRecord;
}

const createCustomerCreditNoteCallable = httpsCallable<
  CreateCustomerCreditNoteRequest,
  CreateCustomerCreditNoteResponse
>(functions, 'createCustomerCreditNote');

/**
 * Crea una nota de crédito por callable backend. Las notas emitidas ya no se
 * escriben directo desde cliente porque reservan NCF y disparan contabilidad.
 */
export const fbAddCreditNote = async (
  user: CreditNoteUser | null | undefined,
  creditNoteData: CreditNoteCreateInput,
): Promise<CreditNoteRecord> => {
  if (!user?.businessID) throw new Error('El usuario no tiene businessID');

  const { sessionToken } = getStoredSession();
  const response = await createCustomerCreditNoteCallable({
    businessId: user.businessID,
    creditNote: creditNoteData,
    displayName: user.displayName || user.name || '',
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data.creditNote;
};
