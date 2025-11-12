import AccountReceivableInfo from "../../views/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo";
import { AccountReceivableList } from "../../views/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList";
import { ReceivablePaymentReceipt } from "../../views/pages/InvoicesPage/ReceivablePaymentReceipt";
import ROUTES_NAME from "../routesName";

import type { AppRoute } from "../routes";

const { ACCOUNT_RECEIVABLE_LIST, ACCOUNT_RECEIVABLE_INFO, RECEIVABLE_PAYMENT_RECEIPTS } = ROUTES_NAME.ACCOUNT_RECEIVABLE;

const routes: AppRoute[] = [
    { path: ACCOUNT_RECEIVABLE_LIST, element: <AccountReceivableList /> },
    { path: ACCOUNT_RECEIVABLE_INFO, element: <AccountReceivableInfo /> },
    { path: RECEIVABLE_PAYMENT_RECEIPTS, element: <ReceivablePaymentReceipt /> },
];

export default routes;
