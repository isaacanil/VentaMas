import { lazy } from 'react';

import { ErrorBoundary } from '../../views/pages/ErrorElement/ErrorBoundary'; // Import ErrorBoundary
import { accountReceivableInfoLoader } from '../loaders/accountReceivableLoaders'; // Import loader
import ROUTES_NAME from '../routesName';

import type { AppRoute } from '../routes';

const AccountReceivableAudit = lazy(() =>
  import(
    '../../views/pages/AccountReceivable/pages/AccountReceivableAudit/AccountReceivableAudit'
  ),
);
const AccountReceivableInfo = lazy(() =>
  import(
    '../../views/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo'
  ),
);
const AccountReceivableList = lazy(() =>
  import(
    '../../views/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList'
  ).then((module) => ({ default: module.AccountReceivableList })),
);
const ReceivablePaymentReceipt = lazy(() =>
  import('../../views/pages/InvoicesPage/ReceivablePaymentReceipt').then(
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
