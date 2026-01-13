import { DateTime } from 'luxon';
import type { UtilityExpenseEntry, UtilityInvoiceEntry } from '@/modules/utility/pages/Utility/types';
import { getInvoiceTimestamp, getInvoiceTotalValue } from '../utils/invoiceUtils';

// Calcular el total de ventas por mes
export const getTotalSalesPerMonth = (
  invoices: UtilityInvoiceEntry[],
): Record<string, number> => {
  const salesPerMonth: Record<string, number> = {};

  invoices.forEach((invoice) => {
    const timestamp = getInvoiceTimestamp(invoice);
    if (!timestamp) return;
    const date = DateTime.fromMillis(timestamp);
    const monthYearStr = date.toFormat('yyyy-MM');
    salesPerMonth[monthYearStr] =
      (salesPerMonth[monthYearStr] || 0) + getInvoiceTotalValue(invoice);
  });

  return salesPerMonth;
};

// Calcular el total de gastos por mes
type ExpenseRecord = Record<string, unknown> & {
  amount?: number | string | null;
  dates?: { expenseDate?: number | string | { seconds?: number; toMillis?: () => number } | null };
  date?: number | string | { seconds?: number; toMillis?: () => number } | null;
};

const getExpenseTimestamp = (entry: UtilityExpenseEntry): number | null => {
  const expense = entry?.expense as ExpenseRecord | undefined;
  const rawDate = expense?.dates?.expenseDate ?? expense?.date;
  if (typeof rawDate === 'number') return rawDate;
  if (typeof rawDate === 'string') {
    const parsed = Date.parse(rawDate);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (rawDate && typeof rawDate === 'object') {
    if (typeof rawDate.toMillis === 'function') return rawDate.toMillis();
    if (typeof rawDate.seconds === 'number') return rawDate.seconds * 1000;
  }
  return null;
};

const getExpenseAmount = (entry: UtilityExpenseEntry): number => {
  const expense = entry?.expense as ExpenseRecord | undefined;
  const rawAmount = expense?.amount;
  if (typeof rawAmount === 'number') return rawAmount;
  const parsed = Number(rawAmount);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getTotalExpensesPerMonth = (
  expenses: UtilityExpenseEntry[],
): Record<string, number> => {
  const expensesPerMonth: Record<string, number> = {};

  expenses.forEach((entry) => {
    const timestamp = getExpenseTimestamp(entry);
    if (!timestamp) return;
    const date = DateTime.fromMillis(timestamp);
    const monthYearStr = date.toFormat('yyyy-MM');
    expensesPerMonth[monthYearStr] =
      (expensesPerMonth[monthYearStr] || 0) + getExpenseAmount(entry);
  });

  return expensesPerMonth;
};
