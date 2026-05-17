import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type {
  CreditNoteInvoiceInput,
  CreditNotePayment,
} from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

interface ApplyCustomerCreditNotesRequest {
  businessId: string;
  creditNotes: CreditNotePayment[];
  invoiceId: string;
  invoiceData: CreditNoteInvoiceInput;
  sessionToken?: string;
}

interface ApplyCustomerCreditNotesResponse {
  ok: boolean;
  applicationIds: string[];
}

const applyCustomerCreditNotesCallable = httpsCallable<
  ApplyCustomerCreditNotesRequest,
  ApplyCustomerCreditNotesResponse
>(functions, 'applyCustomerCreditNotes');

/**
 * Consume notas de crédito por callable transaccional. El cliente ya no debe
 * actualizar saldos ni crear creditNoteApplications directamente.
 */
export const fbConsumeCreditNotes = async (
  user: UserIdentity | null | undefined,
  creditNotePayments: CreditNotePayment[],
  invoiceId: string,
  invoiceData: CreditNoteInvoiceInput = {},
): Promise<void> => {
  if (!user?.businessID) throw new Error('Usuario sin businessID');
  if (!creditNotePayments?.length) return;
  if (!invoiceId) throw new Error('invoiceId requerido');

  const { sessionToken } = getStoredSession();
  await applyCustomerCreditNotesCallable({
    businessId: user.businessID,
    creditNotes: creditNotePayments,
    invoiceId,
    invoiceData,
    ...(sessionToken ? { sessionToken } : {}),
  });
};
