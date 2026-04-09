import { closeUserNotification } from '@/features/UserNotification/UserNotificationSlice';
import type { NavigateFunction } from 'react-router-dom';

export const redirectToCashReconciliationOpening = (
  navigate: NavigateFunction,
  dispatch: (action: unknown) => void,
) => {
  const handleCloseCashReconciliation = () => {
    dispatch(closeUserNotification());
  };
  const handleSubmitCashReconciliation = () => {
    handleCloseCashReconciliation();
    navigate('/cash-register-opening', { state: { from: 'factura' } });
  };
  return handleSubmitCashReconciliation();
};
