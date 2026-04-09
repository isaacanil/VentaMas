import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';

import type { AppRoute } from '@/router/routes/routes';

const AccountReceivableAudit = lazy(
  () =>
    import('@/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableAudit/AccountReceivableAudit'),
);
const AccountReceivableInfo = lazy(
  () =>
    import('@/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo'),
);
const AccountReceivableList = lazy(() =>
  import('@/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList').then(
    (module) => ({ default: module.AccountReceivableList }),
  ),
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
  },
  { path: RECEIVABLE_PAYMENT_RECEIPTS, element: <ReceivablePaymentReceipt /> },
  {
    path: ACCOUNT_RECEIVABLE_AUDIT,
    element: <AccountReceivableAudit />,
    requiresManageAllAccess: true,
  },
];

export default routes;
