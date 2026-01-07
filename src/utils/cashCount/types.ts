import type { DocumentReference } from 'firebase/firestore';
import type { TimestampLike } from '@/utils/date/types';

export type CashCountState =
  | 'open'
  | 'closing'
  | 'closed'
  | 'pending'
  | 'none'
  | (string & {});

export interface CashCountEmployee {
  id?: string;
  uid?: string;
  name?: string;
  realName?: string;
}

export interface CashCountBanknote {
  ref: string;
  value: number;
  quantity: number | null | string;
}

export interface CashCountBoxStatus {
  initialized?: boolean;
  employee?: CashCountEmployee | DocumentReference | null;
  approvalEmployee?: CashCountEmployee | DocumentReference | null;
  date?: TimestampLike;
  banknotes?: CashCountBanknote[];
  banknotesTotal?: number;
  banknotesAmount?: number;
  comments?: string | null;
  totals?: Record<string, unknown> | null;
}

export interface CashCountRecord {
  id?: string;
  incrementNumber?: number | string;
  state?: CashCountState;
  opening?: CashCountBoxStatus;
  closing?: CashCountBoxStatus;
  sales?: unknown[];
  receivablePayments?: unknown[];
  totalCard?: number;
  totalTransfer?: number;
  totalCharged?: number;
  totalReceivables?: number;
  totalDiscrepancy?: number;
  totalRegister?: number;
  totalSystem?: number;
  totalExpenses?: number;
  totalSales?: number;
  total?: number;
  totalFacturado?: number;
  discrepancy?: number;
  stateHistory?: Array<{
    state?: CashCountState;
    timestamp?: TimestampLike;
    updatedBy?: string;
  }>;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface CashCountInvoice {
  id?: string;
  data?: {
    date?: TimestampLike;
    status?: string;
    cashCountId?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CashCountExpense {
  id?: string;
  description?: string;
  category?: string;
  dateExpense?: TimestampLike;
  amount?: number;
  receiptImg?: string | null;
  status?: string;
  payment?: {
    cashRegister?: string | null;
    comment?: string;
    method?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
