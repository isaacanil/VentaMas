import { closeUserNotification } from "../../../../../../../../features/UserNotification/UserNotificationSlice"


export const redirectToCashReconciliationOpening = (navigate, dispatch) => {
    const handleCloseCashReconciliation = () => {
        dispatch(closeUserNotification())
    }
    const handleSubmitCashReconciliation = () => {
        handleCloseCashReconciliation()
        navigate('/cash-register-opening', {state: {from: 'factura'}})
    }
    return handleSubmitCashReconciliation();
}





