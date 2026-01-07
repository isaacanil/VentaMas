import { lazy } from 'react';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const CashReconciliation = lazy(() =>
  import('@/views/pages/CashReconciliation/CashReconciliation').then(
    (module) => ({ default: module.CashReconciliation }),
  ),
);
const CashRegisterClosure = lazy(() =>
  import(
    '@/views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure'
  ).then((module) => ({ default: module.CashRegisterClosure })),
);
const CashRegisterOpening = lazy(() =>
  import(
    '@/views/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening'
  ).then((module) => ({ default: module.CashRegisterOpening })),
);
const CashupInvoicesOverview = lazy(() =>
  import(
    '@/views/pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview'
  ).then((module) => ({ default: module.CashupInvoicesOverview })),
);

const {
  CASH_RECONCILIATION_CLOSURE,
  CASH_RECONCILIATION_LIST,
  CASH_RECONCILIATION_OPENING,
  CASH_RECONCILIATION_INVOICE_OVERVIEW,
} = ROUTES_NAME.CASH_RECONCILIATION_TERM;

const Routes: AppRoute[] = [
  {
    path: CASH_RECONCILIATION_LIST,
    element: <CashReconciliation />,
  },
  {
    path: CASH_RECONCILIATION_CLOSURE,
    element: <CashRegisterClosure />,
  },
  {
    path: CASH_RECONCILIATION_OPENING,
    element: <CashRegisterOpening />,
  },
  {
    path: CASH_RECONCILIATION_INVOICE_OVERVIEW,
    element: <CashupInvoicesOverview />,
  },
];

export default Routes;

