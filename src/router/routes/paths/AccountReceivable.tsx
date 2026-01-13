import { lazy } from 'react';

import { accountReceivableInfoLoader } from '@/router/routes/loaders/accountReceivableLoaders'; // Import loader
import ROUTES_NAME from '@/router/routes/routesName';
import { ErrorBoundary } from '@/modules/app/pages/ErrorElement/ErrorBoundary'; // Import ErrorBoundary

import type { AppRoute } from '@/router/routes/routes';

const AccountReceivableAudit = lazy(() =>
  import(
    '@/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableAudit/AccountReceivableAudit'
  ),
);
const AccountReceivableInfo = lazy(() =>
  import(
    '@/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo'
  ),
);
const AccountReceivableList = lazy(() =>
  import(
    '@/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList'
  ).then((module) => ({ default: module.AccountReceivableList })),
);
const ReceivablePaymentReceipt = lazy(() =>
  import('@/modules/invoice/pages/InvoicesPage/ReceivablePaymentReceipt').then(
    (module) => ({ default: module.ReceivablePaymentReceipt }),
  ),
);

const {
  ACCOUNT_RECEIVABLE_LIST,
  ACCOUNT_RECEIVABLE_INFO,
  RECEIVABLE_PAYMENT_RECEIPTS,
  ACCOUNT_RECEIVABLE_AUDIT,
} = ROUTES_NAME.ACCOUNT_RECEIVABLE;

const routes: AppRoute[] = [
  { path: ACCOUNT_RECEIVABLE_LIST, element: <AccountReceivableList /> },
  {
    path: ACCOUNT_RECEIVABLE_INFO,
    element: <AccountReceivableInfo />,
    loader: accountReceivableInfoLoader, // Add loader
    errorElement: <ErrorBoundary />, // Add errorElement
  },
  { path: RECEIVABLE_PAYMENT_RECEIPTS, element: <ReceivablePaymentReceipt /> },
  { path: ACCOUNT_RECEIVABLE_AUDIT, element: <AccountReceivableAudit /> },
];

export default routes;

