export const validateExpense = (expense) => {
  let errors = {};

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
