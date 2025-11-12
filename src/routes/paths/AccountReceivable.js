import { jsx as _jsx } from 'react/jsx-runtime';

import AccountReceivableInfo from '../../views/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo';
import { AccountReceivableList } from '../../views/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList';
import { ReceivablePaymentReceipt } from '../../views/pages/InvoicesPage/ReceivablePaymentReceipt';
import ROUTES_NAME from '../routesName';

const {
  ACCOUNT_RECEIVABLE_LIST,
  ACCOUNT_RECEIVABLE_INFO,
  RECEIVABLE_PAYMENT_RECEIPTS,
} = ROUTES_NAME.ACCOUNT_RECEIVABLE;
const routes = [
  { path: ACCOUNT_RECEIVABLE_LIST, element: _jsx(AccountReceivableList, {}) },
  { path: ACCOUNT_RECEIVABLE_INFO, element: _jsx(AccountReceivableInfo, {}) },
  {
    path: RECEIVABLE_PAYMENT_RECEIPTS,
    element: _jsx(ReceivablePaymentReceipt, {}),
  },
];
export default routes;
