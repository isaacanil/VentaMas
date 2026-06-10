import type { Expense } from './types';

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

export const toExpenseFiscalNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readNestedNumber = (
  source: Record<string, unknown> | null | undefined,
  ...keys: string[]
): number | null => {
  if (!source) return null;
  for (const key of keys) {
    const value = toExpenseFiscalNumber(source[key]);
    if (value != null) return value;
  }
  return null;
};

export interface ExpenseFiscalTotals {
  subtotal: number;
  taxAmount: number;
  withholdingITBISAmount: number;
  withholdingISRAmount: number;
  total: number;
  netPayableAmount: number;
}

export const resolveExpenseFiscalTotals = (
  expense: Expense | Record<string, unknown>,
): ExpenseFiscalTotals => {
  const monetary = expense.monetary as Record<string, unknown> | null | undefined;
  const documentTotals = monetary?.documentTotals as
    | Record<string, unknown>
    | null
    | undefined;
  const rawTax =
    readNestedNumber(expense, 'taxAmount', 'itbisAmount') ??
    readNestedNumber(documentTotals, 'taxes', 'tax', 'taxAmount') ??
    0;
  const rawTotal =
    readNestedNumber(expense, 'total', 'amount') ??
    readNestedNumber(documentTotals, 'total') ??
    null;
  const rawSubtotal =
    readNestedNumber(expense, 'subtotal', 'subTotal', 'subtotalAmount') ??
    readNestedNumber(documentTotals, 'subtotal', 'subTotal', 'subtotalAmount') ??
    null;
  const subtotal = roundCurrency(
    Math.max(rawSubtotal ?? Math.max((rawTotal ?? 0) - rawTax, 0), 0),
  );
  const taxAmount = roundCurrency(Math.max(rawTax, 0));
  const total = roundCurrency(Math.max(rawTotal ?? subtotal + taxAmount, 0));
  const withholdingITBISAmount = roundCurrency(
    Math.max(
      readNestedNumber(expense, 'withholdingITBISAmount', 'itbisWithheld') ?? 0,
      0,
    ),
  );
  const withholdingISRAmount = roundCurrency(
    Math.max(
      readNestedNumber(expense, 'withholdingISRAmount', 'isrWithheld') ?? 0,
      0,
    ),
  );

  return {
    subtotal,
    taxAmount,
    withholdingITBISAmount,
    withholdingISRAmount,
    total,
    netPayableAmount: roundCurrency(
      Math.max(total - withholdingITBISAmount - withholdingISRAmount, 0),
    ),
  };
};
