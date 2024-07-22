

import AccountReceivableInfo from "../../views/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo";
import { LoginV2 } from "../../views/pages/Login/Loginv2/Loginv2";
import { ReceivablePaymentReceipt } from "../../views/pages/Registro copy/ReceivablePaymentReceipt";
import ROUTES_NAME from "../routesName";

const {ACCOUNT_RECEIVABLE_INFO, RECEIVABLE_PAYMENT_RECEIPTS} = ROUTES_NAME.ACCOUNT_RECEIVABLE;
const Routes = [
    { path: ACCOUNT_RECEIVABLE_INFO, element: <AccountReceivableInfo /> },
    { path: RECEIVABLE_PAYMENT_RECEIPTS, element: <ReceivablePaymentReceipt /> },
]

export default Routes;