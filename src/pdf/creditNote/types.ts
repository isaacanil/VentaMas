import type {
  InvoiceBusinessInfo,
  InvoiceClient,
  InvoiceProduct,
} from '@/types/invoice';
import type { TimestampLike } from '@/utils/date/types';

export type CreditNoteBusinessInfo = InvoiceBusinessInfo;

export interface CreditNoteData {
  ncf?: string;
  createdAt?: TimestampLike | number | string | null;
  number?: string | number;
  invoiceNcf?: string;
  client?: InvoiceClient | null;
  items?: InvoiceProduct[];
  totalAmount?: number;
  reason?: string;
  [key: string]: unknown;
}
