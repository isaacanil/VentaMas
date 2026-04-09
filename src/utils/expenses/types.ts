import type { TimestampLike } from '@/utils/date/types';

export interface ExpenseAttachment {
  id?: string;
  name?: string;
  type?: string;
  url?: string | { url?: string } | null;
}

export interface ExpenseAttachmentInput {
  id: string;
  name?: string;
  type?: string;
  file: File;
}

export interface ExpenseDates {
  expenseDate?: TimestampLike | null;
  createdAt?: TimestampLike | null;
  updatedAt?: TimestampLike | null;
}

export type ExpensePaymentMethod =
  | 'open_cash'
  | 'cash'
  | 'credit_card'
  | 'check'
  | 'bank_transfer'
  | (string & {});

export interface ExpensePayment {
  method?: ExpensePaymentMethod;
  sourceType?: 'cash_drawer' | 'cash' | 'bank' | null;
  cashRegister?: string | null;
  bankAccountId?: string | null;
  bank?: string | null;
  reference?: string | null;
  comment?: string | null;
  [key: string]: unknown;
}

export interface Expense {
  id?: string;
  expenseId?: string;
  _id?: string;
  numberId?: number | string;
  number?: number | string;
  description?: string;
  category?: string;
  categoryId?: string;
  amount?: number | string;
  dates?: ExpenseDates;
  payment?: ExpensePayment;
  invoice?: {
    ncf?: string;
    [key: string]: unknown;
  };
  attachments?: ExpenseAttachment[];
  receiptImageUrl?: string;
  status?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  expenseDate?: TimestampLike;
  monetary?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ExpenseDoc {
  id: string;
  expense: Expense;
}

export interface ExpenseCategory {
  id?: string;
  name?: string;
  status?: string;
  createdAt?: TimestampLike | null;
  deletedAt?: TimestampLike | null;
  deletedBy?: string | null;
  isDeleted?: boolean;
  [key: string]: unknown;
}

export interface ExpenseCategoryDoc {
  category: ExpenseCategory;
}
