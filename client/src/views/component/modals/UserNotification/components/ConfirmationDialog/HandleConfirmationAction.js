import { closeUserNotification } from "../../../../../../features/UserNotification/UserNotificationSlice";
import { handlerExistingCROpen } from "./functions/CashReconciliation/handleExistingCROpen";
import { redirectToCashReconciliationOpening } from "./functions/CashReconciliation/redirectToCashReconciliationOpening"

const CASH_RECONCILIATION = {
    REDIRECT_CR_OPENING: 'redirectCROpening',
    CHECK_IS_OPEN: 'handleExistingOpenCR',
}

export const CONFIRMATION_TASK_TYPE = {
    CASH_RECONCILIATION
}

export const HandleConfirmationAction = (type, navigate, dispatch, resource) => {
    switch (type) {
        case CASH_RECONCILIATION.REDIRECT_CR_OPENING:
            return redirectToCashReconciliationOpening(navigate, dispatch);
        case CASH_RECONCILIATION.CHECK_IS_OPEN:
            return handlerExistingCROpen(dispatch, resource);
        
        default:
            return dispatch(closeUserNotification())
    }
}