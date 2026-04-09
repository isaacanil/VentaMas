import type { Transaction } from 'firebase/firestore';

import {
  assertAccountingPeriodOpenForBusiness,
  assertAccountingPeriodOpenForBusinessInTransaction,
} from '@/utils/accounting/periodClosures';
import type { Expense } from '@/utils/expenses/types';

export const EXPENSE_CLOSED_PERIOD_MESSAGE =
  'El período seleccionado está cerrado. Usa otra fecha o reabre el período.';

export const resolveExpenseEffectiveDate = (
  expense: Expense | null | undefined,
): unknown =>
  expense?.dates?.expenseDate ??
  expense?.expenseDate ??
  expense?.dates?.createdAt ??
  expense?.createdAt ??
  Date.now();

const buildClosedExpensePeriodMessage = (): string =>
  EXPENSE_CLOSED_PERIOD_MESSAGE;

export const assertExpenseAccountingPeriodOpen = async ({
  businessId,
  expense,
}: {
  businessId: string | null | undefined;
  expense: Expense | null | undefined;
}): Promise<string | null> =>
  assertAccountingPeriodOpenForBusiness({
    businessId,
    effectiveDate: resolveExpenseEffectiveDate(expense),
    operationLabel: 'registrar este gasto',
    buildMessage: buildClosedExpensePeriodMessage,
  });

export const assertExpenseAccountingPeriodOpenInTransaction = async ({
  transaction,
  businessId,
  expense,
}: {
  transaction: Transaction;
  businessId: string | null | undefined;
  expense: Expense | null | undefined;
}): Promise<string | null> =>
  assertAccountingPeriodOpenForBusinessInTransaction({
    transaction,
    businessId,
    effectiveDate: resolveExpenseEffectiveDate(expense),
    operationLabel: 'registrar este gasto',
    buildMessage: buildClosedExpensePeriodMessage,
  });
