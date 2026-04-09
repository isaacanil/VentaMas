import type {
  InvoiceClient,
  InvoiceData,
  InvoiceProduct,
} from '@/types/invoice';
import type { TimestampLike } from '@/utils/date/types';

export type CreditNoteStatus =
  | 'issued'
  | 'applied'
  | 'fully_used'
  | 'cancelled';

export interface CreditNoteActor {
  uid?: string;
  displayName?: string;
}

export interface CreditNoteRecord extends Record<string, unknown> {
  id?: string;
  numberID?: string | number;
  number?: string;
  ncf?: string;
  status?: CreditNoteStatus | string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: CreditNoteActor;
  client?: InvoiceClient | null;
  items?: InvoiceProduct[];
  reason?: string;
  totalAmount?: number;
  availableAmount?: number;
  invoiceId?: string;
  invoiceNcf?: string;
  invoiceNumber?: string | number;
}

export interface CreditNoteApplicationRecord extends Record<string, unknown> {
  id?: string;
  creditNoteId?: string;
  creditNoteNcf?: string;
  invoiceId?: string;
  invoiceNcf?: string | number;
  invoiceNumber?: string | number;
  clientId?: string | number;
  amountApplied?: number;
  previousBalance?: number;
  newBalance?: number;
  appliedAt?: TimestampLike;
  appliedBy?: CreditNoteActor;
  createdAt?: TimestampLike;
}

export type CreditNoteCreateInput = Omit<
  CreditNoteRecord,
  | 'id'
  | 'numberID'
  | 'number'
  | 'ncf'
  | 'status'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
>;

export type CreditNoteApplicationInput = Omit<
  CreditNoteApplicationRecord,
  'id' | 'appliedAt' | 'appliedBy' | 'createdAt'
>;

export interface CreditNotePayment {
  id: string;
  amountUsed: number;
  ncf?: string;
  originalAmount?: number;
}

export type CreditNoteSelection = {
  id?: string | number;
  creditNote?: CreditNoteRecord;
  amountToUse?: number;
  amountUsed?: number;
};

export interface CreditNoteFilters {
  startDate?: TimestampLike;
  endDate?: TimestampLike;
  clientId?: string | number;
  status?: CreditNoteStatus | string;
}

export interface CreditNoteApplicationFilters {
  creditNoteId?: string;
  invoiceId?: string;
  clientId?: string | number;
}

export type CreditNoteInvoiceInput = Partial<InvoiceData> &
  Record<string, unknown>;
