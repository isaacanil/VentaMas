import {
  generateIdempotencyKey,
  submitInvoice,
  waitForInvoiceResult,
} from '@/services/invoice/invoice.service';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser } from './types';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveLegacyNcfType = (invoice: InvoiceData): string | null => {
  const record = asRecord(invoice);
  const taxReceipt = asRecord(record.taxReceipt);
  return (
    toCleanString(record.ncfType) ||
    toCleanString(record.taxReceiptName) ||
    toCleanString(record.selectedTaxReceiptType) ||
    toCleanString(taxReceipt.type) ||
    null
  );
};

export const fbAddInvoice = async (
  data: InvoiceData,
  user: UserIdentity | null | undefined,
): Promise<InvoiceData | null> => {
  if (!isInvoiceUser(user)) return null;

  try {
    const ncfType = resolveLegacyNcfType(data);
    const submission = await submitInvoice({
      cart: data as any,
      user,
      client: (data as any).client ?? null,
      accountsReceivable:
        (data as any).accountsReceivable ?? (data as any).receivableState ?? null,
      taxReceiptEnabled: Boolean(
        (data as any).taxReceiptEnabled || (data as any).NCF || (data as any).ncf,
      ),
      ncfType,
      ncf: {
        enabled: Boolean(
          (data as any).taxReceiptEnabled ||
            (data as any).NCF ||
            (data as any).ncf,
        ),
        type: ncfType,
      },
      dueDate: (data as any).dueDate ?? (data as any).paymentDate ?? null,
      invoiceComment: (data as any).invoiceComment ?? null,
      idempotencyKey: data?.id
        ? `legacy-invoice:${data.id}`
        : generateIdempotencyKey(),
      businessId: user.businessID,
    });
    const result = await waitForInvoiceResult({
      businessId: submission.businessId,
      invoiceId: submission.invoiceId,
    });

    return result.invoice ?? null;
  } catch (error) {
    console.log(error);
    return null;
  }
};
