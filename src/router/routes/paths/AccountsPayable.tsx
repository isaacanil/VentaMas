import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import { loadAccountsPayableListRoute } from '@/modules/accountsPayable/public';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const AccountsPayable = lazy(loadAccountsPayableListRoute);

const { ACCOUNT_PAYABLE_LIST } = ROUTES_NAME.ACCOUNT_PAYABLE;

const ACCOUNTS_PAYABLE_ROUTE_ACCESS = {
  requiredCapabilities: ['accountingRead'],
  requiredCapabilitiesMode: 'any' as const,
};

const routes: AppRoute[] = [
  {
    path: ACCOUNT_PAYABLE_LIST,
    element: <AccountsPayable />,
    ...ACCOUNTS_PAYABLE_ROUTE_ACCESS,
    title: 'Cuentas por Pagar - Ventamax',
    metaDescription:
      'Gestiona obligaciones pendientes con suplidores y registra pagos en Ventamax POS.',
  },
];

export default routes;
