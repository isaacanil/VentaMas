import type {
  InvoiceClient,
  InvoiceData,
  InvoiceProduct,
} from '@/types/invoice';
import type { TimestampLike } from '@/utils/date/types';

export type DebitNoteStatus =
  | 'issued'
  | 'paid'
  | 'partially_paid'
  | 'cancelled'
  | 'voided'
  | 'electronic_pending'
  | 'electronic_failed';

export interface DebitNoteActor {
  uid?: string;
  displayName?: string;
}

export interface DebitNoteRecord extends Record<string, unknown> {
  id?: string;
  numberID?: string | number;
  number?: string;
  ncf?: string;
  eNcf?: string;
  status?: DebitNoteStatus | string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: DebitNoteActor;
  client?: InvoiceClient | null;
  items?: InvoiceProduct[];
  reason?: string;
  totalAmount?: number;
  taxAmount?: number;
  invoiceId?: string;
  invoiceNcf?: string;
  invoiceNumber?: string | number;
  invoiceDate?: TimestampLike;
  invoiceTotalAmount?: number;
  modificationCode?: string;
  electronicTaxReceipt?: InvoiceData['electronicTaxReceipt'];
  fiscalMode?: string;
  documentFormat?: string;
}

export type DebitNoteCreateInput = Omit<
  DebitNoteRecord,
  | 'id'
  | 'numberID'
  | 'number'
  | 'ncf'
  | 'eNcf'
  | 'status'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
>;

export interface DebitNoteFilters {
  startDate?: TimestampLike;
  endDate?: TimestampLike;
  clientId?: string | number;
  status?: DebitNoteStatus | string;
}
