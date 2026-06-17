import type { Expense } from '@/utils/expenses/types';
import { resolveExpenseFiscalTotals } from '@/utils/expenses/fiscal';
import {
  isBankExpensePaymentMethod,
  isCashRegisterExpensePaymentMethod,
} from '@/utils/expenses/payment';

export interface ExpenseValidationErrors {
  description?: string;
  amount?: string;
  category?: string;
  dates?: {
    expenseDate?: string;
  };
  payment?: {
    bankAccountId?: string;
    cashAccountId?: string;
    cashRegister?: string;
  };
}

export const validateExpense = (
  expense: Expense,
  { requireBankAccount = true }: { requireBankAccount?: boolean } = {},
): ExpenseValidationErrors => {
  const errors: ExpenseValidationErrors = {};

  if (!expense.description) {
    errors.description = 'Descripción es requerida';
  }
  const fiscalTotals = resolveExpenseFiscalTotals(expense);
  const withholdingTotal =
    fiscalTotals.withholdingITBISAmount + fiscalTotals.withholdingISRAmount;
  if (fiscalTotals.total <= 0) {
    errors.amount = 'Importe es requerido';
  } else if (withholdingTotal > fiscalTotals.total) {
    errors.amount = 'Las retenciones no pueden exceder el total';
  }
  if (!expense.categoryId) {
    errors.category = 'Categoría es requerida';
  }
  if (!expense.dates?.expenseDate) {
    errors.dates = { expenseDate: 'Fecha de gasto es requerida' };
  }

  const paymentMethod = expense.payment?.method;
  if (
    requireBankAccount &&
    isBankExpensePaymentMethod(paymentMethod) &&
    !expense.payment?.bankAccountId
  ) {
    errors.payment = {
      ...errors.payment,
      bankAccountId: 'Cuenta bancaria es requerida',
    };
  }

  if (paymentMethod === 'cash' && !expense.payment?.cashAccountId) {
    errors.payment = {
      ...errors.payment,
      cashAccountId: 'Cuenta de caja es requerida',
    };
  }

  if (
    isCashRegisterExpensePaymentMethod(paymentMethod) &&
    !expense.payment?.cashRegister
  ) {
    errors.payment = {
      ...errors.payment,
      cashRegister: 'Cuadre de caja es requerido',
    };
  }

  return errors;
};
