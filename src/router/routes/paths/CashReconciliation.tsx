import BusinessFeatureRouteGate from '@/router/guards/availability/BusinessFeatureRouteGate';
import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import {
  loadCashReconciliationClosureRoute,
  loadCashReconciliationInvoiceOverviewRoute,
  loadCashReconciliationListRoute,
  loadCashReconciliationOpeningRoute,
} from '@/modules/cashReconciliation/public';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';
import type { JSX } from 'react';

const CashReconciliation = lazy(loadCashReconciliationListRoute);
const CashRegisterClosure = lazy(loadCashReconciliationClosureRoute);
const CashRegisterOpening = lazy(loadCashReconciliationOpeningRoute);
const CashupInvoicesOverview = lazy(loadCashReconciliationInvoiceOverviewRoute);

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
