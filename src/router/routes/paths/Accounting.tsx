import BusinessFeatureRouteGate from '@/components/availability/BusinessFeatureRouteGate';
import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Navigate } from 'react-router-dom';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';
import type { JSX } from 'react';

const AccountingWorkspace = lazy(
  () =>
    import('@/modules/accounting/pages/AccountingWorkspace/AccountingWorkspace'),
);

const {
  ACCOUNTING,
  ACCOUNTING_JOURNAL_BOOK,
  ACCOUNTING_GENERAL_LEDGER,
  ACCOUNTING_MANUAL_ENTRIES,
  ACCOUNTING_REPORTS,
  ACCOUNTING_FISCAL_COMPLIANCE,
  ACCOUNTING_PERIOD_CLOSE,
} = ROUTES_NAME.ACCOUNTING_TERM;
const { HOME } = ROUTES_NAME.BASIC_TERM;

const withAccountingGate = (element: JSX.Element) => (
  <BusinessFeatureRouteGate feature="accounting" fallbackTo={HOME}>
    {element}
  </BusinessFeatureRouteGate>
);

const Routes: AppRoute[] = [
  {
    path: ACCOUNTING,
    element: withAccountingGate(<AccountingWorkspace />),
  },
  {
    path: ACCOUNTING_JOURNAL_BOOK,
    element: withAccountingGate(<AccountingWorkspace />),
  },
  {
    path: ACCOUNTING_GENERAL_LEDGER,
    element: withAccountingGate(<AccountingWorkspace />),
  },
  {
    path: ACCOUNTING_MANUAL_ENTRIES,
    element: withAccountingGate(<AccountingWorkspace />),
  },
  {
    path: ACCOUNTING_REPORTS,
    element: withAccountingGate(<AccountingWorkspace />),
  },
  {
    path: ACCOUNTING_FISCAL_COMPLIANCE,
    element: withAccountingGate(<AccountingWorkspace />),
  },
  {
    path: ACCOUNTING_PERIOD_CLOSE,
    element: withAccountingGate(<AccountingWorkspace />),
  },
  {
    path: '/contabilidad',
    element: <Navigate to={ACCOUNTING} replace />,
  },
  {
    path: '/contabilidad/libro-diario',
    element: <Navigate to={ACCOUNTING_JOURNAL_BOOK} replace />,
  },
  {
    path: '/contabilidad/libro-mayor',
    element: <Navigate to={ACCOUNTING_GENERAL_LEDGER} replace />,
  },
  {
    path: '/contabilidad/asientos-manuales',
    element: <Navigate to={ACCOUNTING_MANUAL_ENTRIES} replace />,
  },
  {
    path: '/contabilidad/reportes',
    element: <Navigate to={ACCOUNTING_REPORTS} replace />,
  },
  {
    path: '/contabilidad/compliance-fiscal',
    element: <Navigate to={ACCOUNTING_FISCAL_COMPLIANCE} replace />,
  },
  {
    path: '/contabilidad/cierre-periodo',
    element: <Navigate to={ACCOUNTING_PERIOD_CLOSE} replace />,
  },
];

export default Routes;
