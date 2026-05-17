import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser, type InvoiceDoc } from './types';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

interface DeleteDraftInvoiceRequest {
  businessId: string;
  invoiceId: string;
  sessionToken?: string;
}

interface DeleteDraftInvoiceResponse {
  ok: boolean;
  invoiceId: string;
}

const deleteDraftInvoiceCallable = httpsCallable<
  DeleteDraftInvoiceRequest,
  DeleteDraftInvoiceResponse
>(functions, 'deleteDraftInvoice');

export async function fbDeleteMultipleInvoices(
  user: UserIdentity | null | undefined,
  invoices: InvoiceDoc[],
): Promise<void> {
  if (!isInvoiceUser(user)) return;
  const ids = invoices.map(({ data }) => data?.id).filter(isNonEmptyString);
  const { sessionToken } = getStoredSession();

  for (const invoiceId of ids) {
    await deleteDraftInvoiceCallable({
      businessId: user.businessID,
      invoiceId,
      ...(sessionToken ? { sessionToken } : {}),
    });
  }
}
