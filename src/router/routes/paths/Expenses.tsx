import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import {
  loadExpensesCreateRoute,
  loadExpensesListRoute,
} from '@/modules/expenses/public';
import ROUTES_PATH from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const ExpensesForm = lazy(loadExpensesCreateRoute);
const ExpensesList = lazy(loadExpensesListRoute);

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
