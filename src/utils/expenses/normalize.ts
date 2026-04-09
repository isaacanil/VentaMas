import { toMillis } from '@/utils/date/toMillis';
import type { Expense } from '@/utils/expenses/types';

const normalizeDate = (...candidates: unknown[]): number | null => {
  for (const candidate of candidates) {
    const millis = toMillis(candidate);
    if (Number.isFinite(millis)) {
      return millis;
    }
  }

  return null;
};

export const normalizeExpenseDates = (expense: Expense): Expense => {
  const dates = expense.dates ?? {};
  const createdAt = normalizeDate(
    dates.createdAt,
    expense.createdAt,
    expense.updatedAt,
  );
  const expenseDate = normalizeDate(
    dates.expenseDate,
    createdAt,
    expense.expenseDate,
    expense.createdAt,
  );

  return {
    ...expense,
    dates: {
      ...dates,
      createdAt,
      expenseDate,
    },
  };
};

export const normalizeExpenseStatus = (status: unknown): string => {
  if (typeof status === 'string' && status.trim()) {
    return status;
  }

  return 'active';
};

export const coerceExpenseAmount = (amount: unknown): number => {
  if (typeof amount === 'number' && Number.isFinite(amount)) {
    return amount;
  }

  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const coerceExpenseNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getExpenseReceiptUrl = (expense: Expense): string | null => {
  const attachments = Array.isArray(expense.attachments)
    ? expense.attachments
    : [];

  if (attachments.length > 0) {
    const firstAttachment = attachments[0];
    const url = firstAttachment?.url;

    if (typeof url === 'string') {
      return url;
    }

    if (url && typeof url === 'object' && typeof url.url === 'string') {
      return url.url;
    }
  }

  if (typeof expense.receiptImageUrl === 'string') {
    return expense.receiptImageUrl;
  }

  return null;
};
