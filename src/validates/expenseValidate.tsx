import type { Expense } from '@/utils/expenses/types';

export interface ExpenseValidationErrors {
  description?: string;
  amount?: string;
  category?: string;
  dates?: {
    expenseDate?: string;
  };
}

export const validateExpense = (expense: Expense): ExpenseValidationErrors => {
  const errors: ExpenseValidationErrors = {};

  if (!expense.description) {
    errors.description = 'Descripción es requerida';
  }
  if (!expense.amount) {
    errors.amount = 'Importe es requerido';
  }
  if (!expense.categoryId) {
    errors.category = 'Categoría es requerida';
  }
  if (!expense.dates?.expenseDate) {
    errors.dates = { expenseDate: 'Fecha de gasto es requerida' };
  }

  return errors;
};
