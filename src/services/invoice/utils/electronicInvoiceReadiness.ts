import type { InvoiceData } from '@/types/invoice';
import { asRecord } from '@/utils/object/record';

import type { UnknownRecord } from '../types';

const hasKeys = (value: unknown): boolean => Object.keys(asRecord(value)).length > 0;

const startsWithElectronicPrefix = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().toUpperCase().startsWith('E');

export const expectsElectronicTaxReceiptProjection = (
  invoiceMeta?: UnknownRecord | null,
): boolean => {
  const snapshot = asRecord(invoiceMeta?.snapshot);
  const ncf = asRecord(snapshot.ncf);

  return (
    snapshot.fiscalMode === 'electronic_ecf' ||
    snapshot.documentFormat === 'electronic' ||
    ncf.documentFormat === 'electronic' ||
    hasKeys(snapshot.electronicTaxReceipt)
  );
};

export const hasElectronicTaxReceiptProjection = (
  invoice?: InvoiceData | null,
): boolean => {
  if (!invoice) return false;

  return (
    hasKeys(invoice.electronicTaxReceipt) ||
    hasKeys(invoice.fiscal?.electronic) ||
    startsWithElectronicPrefix(invoice.eNcf) ||
    startsWithElectronicPrefix(invoice.NCF)
  );
};

export const isCanonicalInvoiceReadyForFrontend = ({
  canonicalInvoice,
  invoiceMeta,
}: {
  canonicalInvoice?: InvoiceData | null;
  invoiceMeta?: UnknownRecord | null;
}): boolean => {
  if (!expectsElectronicTaxReceiptProjection(invoiceMeta)) {
    return true;
  }

  return hasElectronicTaxReceiptProjection(canonicalInvoice);
};
