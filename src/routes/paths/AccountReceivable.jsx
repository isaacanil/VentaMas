import ROUTES_NAME from "../routesName";
import { lazyImport } from "../lazyImport";

const AccountReceivableInfo = lazyImport(() => import("../../views/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo"));
const AccountReceivableList = lazyImport(() => import("../../views/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList"), "AccountReceivableList");
const ReceivablePaymentReceipt = lazyImport(() => import("../../views/pages/InvoicesPage/ReceivablePaymentReceipt"), "ReceivablePaymentReceipt");

const { ACCOUNT_RECEIVABLE_LIST, ACCOUNT_RECEIVABLE_INFO, RECEIVABLE_PAYMENT_RECEIPTS } = ROUTES_NAME.ACCOUNT_RECEIVABLE;

const Routes = [
    { path: ACCOUNT_RECEIVABLE_LIST, element: <AccountReceivableList /> },
    { path: ACCOUNT_RECEIVABLE_INFO, element: <AccountReceivableInfo /> },
    { path: RECEIVABLE_PAYMENT_RECEIPTS, element: <ReceivablePaymentReceipt /> },
]

export default Routes;
