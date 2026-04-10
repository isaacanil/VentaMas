import BusinessFeatureRouteGate from '@/components/availability/BusinessFeatureRouteGate';
import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';
import type { JSX } from 'react';

const CashReconciliation = lazy(() =>
  import('@/modules/cashReconciliation/pages/CashReconciliation/CashReconciliation').then(
    (module) => ({ default: module.CashReconciliation }),
  ),
);
const CashRegisterClosure = lazy(() =>
  import('@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure').then(
    (module) => ({ default: module.CashRegisterClosure }),
  ),
);
const CashRegisterOpening = lazy(() =>
  import('@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening').then(
    (module) => ({ default: module.CashRegisterOpening }),
  ),
);
const CashupInvoicesOverview = lazy(() =>
  import('@/modules/cashReconciliation/pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview').then(
    (module) => ({ default: module.CashupInvoicesOverview }),
  ),
);

const {
  CASH_RECONCILIATION_CLOSURE,
  CASH_RECONCILIATION_LIST,
  CASH_RECONCILIATION_OPENING,
  CASH_RECONCILIATION_INVOICE_OVERVIEW,
} = ROUTES_NAME.CASH_RECONCILIATION_TERM;
const { GENERAL_CONFIG_MODULES } = ROUTES_NAME.SETTING_TERM;

const withTreasuryGate = (element: JSX.Element) => (
  <BusinessFeatureRouteGate
    feature="treasury"
    fallbackTo={GENERAL_CONFIG_MODULES}
  >
    {element}
  </BusinessFeatureRouteGate>
);

const Routes: AppRoute[] = [
  {
    path: CASH_RECONCILIATION_LIST,
    element: withTreasuryGate(<CashReconciliation />),
  },
  {
    path: CASH_RECONCILIATION_CLOSURE,
    element: withTreasuryGate(<CashRegisterClosure />),
  },
  {
    path: CASH_RECONCILIATION_OPENING,
    element: withTreasuryGate(<CashRegisterOpening />),
  },
  {
    path: CASH_RECONCILIATION_INVOICE_OVERVIEW,
    element: withTreasuryGate(<CashupInvoicesOverview />),
  },
];

export default Routes;
