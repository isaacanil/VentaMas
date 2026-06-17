import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type {
  DebitNoteCreateInput,
  DebitNoteRecord,
} from '@/modules/invoice/types/debitNote';
import type { UserIdentity } from '@/types/users';

type DebitNoteUser = UserIdentity & {
  displayName?: string | null;
};

interface CreateCustomerDebitNoteRequest {
  businessId: string;
  debitNote: DebitNoteCreateInput;
  displayName?: string;
  sessionToken?: string;
}

interface CreateCustomerDebitNoteResponse {
  ok: boolean;
  debitNote: DebitNoteRecord;
}

const createCustomerDebitNoteCallable = createFirebaseCallable<
  CreateCustomerDebitNoteRequest,
  CreateCustomerDebitNoteResponse
>('createCustomerDebitNote');

export const fbAddDebitNote = async (
  user: DebitNoteUser | null | undefined,
  debitNoteData: DebitNoteCreateInput,
): Promise<DebitNoteRecord> => {
  if (!user?.businessID) throw new Error('El usuario no tiene businessID');

  const { sessionToken } = getStoredSession();
  const response = await createCustomerDebitNoteCallable({
    businessId: user.businessID,
    debitNote: debitNoteData,
    displayName: user.displayName || user.name || '',
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.debitNote;
};
