import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser } from './types';

export interface CancelInvoiceReasonInput {
  reasonCode: string;
  reasonLabel: string;
  note?: string;
}

interface VoidInvoiceRequest {
  businessId: string;
  invoiceId: string;
  cancellation: CancelInvoiceReasonInput;
  sessionToken?: string;
}

interface VoidInvoiceResponse {
  ok: boolean;
  invoiceId: string;
  status: string;
  reused?: boolean;
  reversalEntryId?: string | null;
}

const voidInvoiceFinancialDocumentCallable = httpsCallable<
  VoidInvoiceRequest,
  VoidInvoiceResponse
>(functions, 'voidInvoiceFinancialDocument');

export const fbCancelInvoice = async (
  user: UserIdentity | null | undefined,
  invoice: InvoiceData | null | undefined,
  cancellation: CancelInvoiceReasonInput,
): Promise<void> => {
  if (!invoice?.id || !isInvoiceUser(user)) {
    throw new Error('No se ha podido cancelar la factura. Faltan datos.');
  }

  if (
    typeof cancellation?.reasonCode !== 'string' ||
    !cancellation.reasonCode.trim() ||
    typeof cancellation?.reasonLabel !== 'string' ||
    !cancellation.reasonLabel.trim()
  ) {
    throw new Error('Debe indicar un motivo DGII válido para anular la factura.');
  }

  const { sessionToken } = getStoredSession();
  await voidInvoiceFinancialDocumentCallable({
    businessId: user.businessID,
    invoiceId: invoice.id,
    cancellation,
    ...(sessionToken ? { sessionToken } : {}),
  });
};
