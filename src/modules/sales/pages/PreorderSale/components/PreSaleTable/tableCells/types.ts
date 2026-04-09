import type { Client } from '@/features/cart/types';
import type { InvoiceData } from '@/types/invoice';

export type PreorderActionCellValue = {
  data?: InvoiceData | null;
};

export type TimestampRecord = {
  seconds?: number;
  nanoseconds?: number;
  toMillis?: () => number;
};

export type AccountsReceivableState = {
  paymentFrequency?: string;
  totalInstallments?: number;
  installmentAmount?: number;
  paymentDate?: number | null;
  comments?: string;
  totalReceivable?: number;
  currentBalance?: number;
};

export type ClientLike = {
  id?: string | number | null;
  name?: string;
  tel?: string;
  address?: string;
  personalID?: string;
  delivery?: Client['delivery'];
};
