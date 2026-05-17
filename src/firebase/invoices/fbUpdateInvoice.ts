import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser } from './types';

interface UpdateInvoiceFinancialDocumentRequest {
  businessId: string;
  invoiceId: string;
  invoice: InvoiceData;
  sessionToken?: string;
}

interface UpdateInvoiceFinancialDocumentResponse {
  ok: boolean;
  invoiceId: string;
  status: string;
}

const updateInvoiceFinancialDocumentCallable = httpsCallable<
  UpdateInvoiceFinancialDocumentRequest,
  UpdateInvoiceFinancialDocumentResponse
>(functions, 'updateInvoiceFinancialDocument');

export const fbUpdateInvoice = async (
  user: UserIdentity | null | undefined,
  invoice: InvoiceData,
): Promise<void> => {
  if (!isInvoiceUser(user)) return;
  if (!invoice?.id) {
    throw new Error('No se encontró el ID de la factura a actualizar.');
  }

  const { sessionToken } = getStoredSession();
  await updateInvoiceFinancialDocumentCallable({
    businessId: user.businessID,
    invoiceId: invoice.id,
    invoice,
    ...(sessionToken ? { sessionToken } : {}),
  });
};
