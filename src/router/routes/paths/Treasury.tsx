import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Navigate } from 'react-router-dom';

import { loadTreasuryBankAccountsRoute } from '@/modules/treasury/public';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const TreasuryBankAccountsPage = lazy(loadTreasuryBankAccountsRoute);

const { TREASURY_HOME, TREASURY_BANK_ACCOUNTS, TREASURY_ACCOUNT_DETAIL } =
  ROUTES_NAME.TREASURY_TERM;

const Routes: AppRoute[] = [
  {
    path: TREASURY_HOME,
    element: <Navigate to={TREASURY_BANK_ACCOUNTS} replace />,
  },
  {
    path: TREASURY_BANK_ACCOUNTS,
    element: <TreasuryBankAccountsPage />,
  },
  {
    path: TREASURY_ACCOUNT_DETAIL,
    element: <TreasuryBankAccountsPage />,
  },
];

export default Routes;
