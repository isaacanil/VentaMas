import { CashReconciliation } from '../../views/pages/CashReconciliation/CashReconciliation';
import { CashRegisterClosure } from '../../views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure';
import { CashRegisterOpening } from '../../views/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening';
import { CashupInvoicesOverview } from '../../views/pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview';
import ROUTES_NAME from '../routesName';

const {
  CASH_RECONCILIATION_CLOSURE,
  CASH_RECONCILIATION_LIST,
  CASH_RECONCILIATION_OPENING,
  CASH_RECONCILIATION_INVOICE_OVERVIEW,
} = ROUTES_NAME.CASH_RECONCILIATION_TERM;

const routes = [
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

export default routes;
