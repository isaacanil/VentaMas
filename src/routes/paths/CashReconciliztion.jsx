import ROUTES_NAME from "../routesName";
import { lazyImport } from "../lazyImport";

const CashReconciliation = lazyImport(() => import("../../views/pages/CashReconciliation/CashReconciliation"), "CashReconciliation");
const CashRegisterClosure = lazyImport(() => import("../../views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure"), "CashRegisterClosure");
const CashRegisterOpening = lazyImport(() => import("../../views/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening"), "CashRegisterOpening");
const CashupInvoicesOverview = lazyImport(() => import("../../views/pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview"), "CashupInvoicesOverview");

const {CASH_RECONCILIATION_CLOSURE, CASH_RECONCILIATION_LIST, CASH_RECONCILIATION_OPENING, CASH_RECONCILIATION_INVOICE_OVERVIEW} = ROUTES_NAME.CASH_RECONCILIATION_TERM;

const routes = [
    {
        path: CASH_RECONCILIATION_LIST,
        element: <CashReconciliation />,
    },
    {
        path:  CASH_RECONCILIATION_CLOSURE,
        element: <CashRegisterClosure />,
    },
    {
        path: CASH_RECONCILIATION_OPENING,
        element: <CashRegisterOpening />,
    },
    {
        path: CASH_RECONCILIATION_INVOICE_OVERVIEW,
        element: <CashupInvoicesOverview />, 
    }
]

export default routes;
