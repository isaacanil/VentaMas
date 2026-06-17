export const loadExpensesCreateRoute = () =>
  import('./pages/Expenses/ExpensesForm/ExpensesForm');

export const loadExpensesListRoute = () =>
  import('./pages/Expenses/ExpensesList/ExpensesList').then((module) => ({
    default: module.ExpensesList,
  }));
