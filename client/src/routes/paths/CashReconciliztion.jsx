import { CashReconciliation } from "../../views/pages/CashReconciliation/CashReconciliation";
import { CashRegisterClosure } from "../../views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure";
import { CashRegisterOpening } from "../../views/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening";
import { CashupInvoicesOverview } from "../../views/pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";

const {CASH_RECONCILIATION_CLOSING, CASH_RECONCILIATION_LIST, CASH_RECONCILIATION_OPENING, CASH_RECONCILIATION_INVOICE_OVERVIEW} = ROUTES_NAME.CASH_RECONCILIATION_TERM;

const routes = [
    {
        path: "/cash-reconciliation",
        element: validateRouteAccess(<CashReconciliation />),
        name: CASH_RECONCILIATION_LIST
    },
    {
        path: "/cash-register-closure/:id",
        element: validateRouteAccess(<CashRegisterClosure />),
        name: CASH_RECONCILIATION_CLOSING
    },
    {
        path: "/cash-register-opening",
        element: validateRouteAccess(<CashRegisterOpening />),
        name: CASH_RECONCILIATION_OPENING
    },
    {
        path: "/cash-register-invoices-overview",
        element: validateRouteAccess(<CashupInvoicesOverview />),
        name:  CASH_RECONCILIATION_INVOICE_OVERVIEW
    }
]

export default routes;