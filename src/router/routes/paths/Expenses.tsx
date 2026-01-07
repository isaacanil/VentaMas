import { lazy } from 'react';

import ROUTES_PATH from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const ExpensesForm = lazy(() =>
  import('@/views/pages/Expenses/ExpensesForm/ExpensesForm'),
);
const ExpensesList = lazy(() =>
  import('@/views/pages/Expenses/ExpensesList/ExpensesList').then(
    (module) => ({ default: module.ExpensesList }),
  ),
);

const { EXPENSES_LIST, EXPENSES_CREATE } = ROUTES_PATH.EXPENSES_TERM;
const route: AppRoute[] = [
  {
    path: EXPENSES_LIST,
    element: <ExpensesList />,
  },
  {
    path: EXPENSES_CREATE,
    element: <ExpensesForm />,
  },
];

export default route;

