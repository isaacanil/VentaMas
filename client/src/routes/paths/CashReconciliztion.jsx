import { CashReconciliation } from "../../views/pages/CashReconciliation/CashReconciliation";
import { CashRegisterClosure } from "../../views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure";
import { CashRegisterOpening } from "../../views/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening";
import { CashupInvoicesOverview } from "../../views/pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";

const {CASH_RECONCILIATION_CLOSURE, CASH_RECONCILIATION_LIST, CASH_RECONCILIATION_OPENING, CASH_RECONCILIATION_INVOICE_OVERVIEW} = ROUTES_NAME.CASH_RECONCILIATION_TERM;

const routes = [
    {
        path: CASH_RECONCILIATION_LIST,
        element: validateRouteAccess(<CashReconciliation />),
    },
    {
        path:  CASH_RECONCILIATION_CLOSURE,
        element: validateRouteAccess(<CashRegisterClosure />),
    },
    {
        path: CASH_RECONCILIATION_OPENING,
        element: validateRouteAccess(<CashRegisterOpening />),
    },
    {
        path: CASH_RECONCILIATION_INVOICE_OVERVIEW,
        element: validateRouteAccess(<CashupInvoicesOverview />), 
    }
]

export default routes;