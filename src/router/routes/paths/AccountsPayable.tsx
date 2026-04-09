import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const AccountsPayable = lazy(() =>
  import('@/modules/accountsPayable/pages/AccountsPayable/AccountsPayable').then(
    (module) => ({
      default: module.AccountsPayable,
    }),
  ),
);

const { ACCOUNT_PAYABLE_LIST } = ROUTES_NAME.ACCOUNT_PAYABLE;

const routes: AppRoute[] = [
  {
    path: ACCOUNT_PAYABLE_LIST,
    element: <AccountsPayable />,
    title: 'Cuentas por Pagar - Ventamax',
    metaDescription:
      'Gestiona obligaciones pendientes con suplidores y registra pagos en Ventamax POS.',
  },
];

export default routes;
