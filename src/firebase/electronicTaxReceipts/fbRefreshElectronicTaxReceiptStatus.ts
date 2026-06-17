import type { ElectronicTaxReceiptSnapshot } from '@/types/invoice';

import { createElectronicTaxReceiptCallable } from './callElectronicTaxReceipt';

export interface RefreshElectronicTaxReceiptStatusInput {
  businessId: string;
  invoiceId?: string;
  creditNoteId?: string;
  debitNoteId?: string;
  documentId?: string;
  documentKind?: 'invoice' | 'creditNote' | 'debitNote' | string;
  refreshRemote?: boolean;
}

export interface RefreshElectronicTaxReceiptStatusResult {
  ok: boolean;
  businessId: string;
  invoiceId?: string | null;
  creditNoteId?: string | null;
  debitNoteId?: string | null;
  documentId?: string | null;
  documentKind?: 'invoice' | 'creditNote' | 'debitNote' | string;
  submissionId: string;
  electronicTaxReceipt: ElectronicTaxReceiptSnapshot;
}

const refreshElectronicTaxReceiptStatusCallable =
  createElectronicTaxReceiptCallable<
    RefreshElectronicTaxReceiptStatusInput,
    RefreshElectronicTaxReceiptStatusResult
  >('refreshElectronicTaxReceiptStatus');

export const fbRefreshElectronicTaxReceiptStatus = (
  input: RefreshElectronicTaxReceiptStatusInput,
): Promise<RefreshElectronicTaxReceiptStatusResult> =>
  refreshElectronicTaxReceiptStatusCallable(input);
