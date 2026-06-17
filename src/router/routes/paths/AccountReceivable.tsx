import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import {
  loadAccountReceivableAuditRoute,
  loadAccountReceivableInfoRoute,
  loadAccountReceivableListRoute,
} from '@/modules/accountsReceivable/public';
import { loadReceivablePaymentReceiptRoute } from '@/modules/invoice/public';
import ROUTES_NAME from '@/router/routes/routesName';

import type { AppRoute } from '@/router/types/routeTypes';

const AccountReceivableAudit = lazy(loadAccountReceivableAuditRoute);
const AccountReceivableInfo = lazy(loadAccountReceivableInfoRoute);
const AccountReceivableList = lazy(loadAccountReceivableListRoute);
const ReceivablePaymentReceipt = lazy(loadReceivablePaymentReceiptRoute);

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
