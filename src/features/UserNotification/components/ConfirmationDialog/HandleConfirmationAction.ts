import { closeUserNotification } from '@/features/UserNotification/UserNotificationSlice';
import {
  CONFIRMATION_TASK_TYPE,
  type CashReconciliationConfirmationTask,
} from '@/features/UserNotification/confirmationTaskTypes';

import { handlerExistingCROpen } from './functions/CashReconciliation/handleExistingCROpen';
import { redirectToCashReconciliationOpening } from './functions/CashReconciliation/redirectToCashReconciliationOpening';
import type { Dispatch } from 'react';
import type { NavigateFunction } from 'react-router-dom';

type ConfirmationResource = {
  isExistingOpenCR?: boolean;
};

type ConfirmationActionType =
  | CashReconciliationConfirmationTask
  | string
  | (() => void)
  | null;

export const HandleConfirmationAction = (
  type: ConfirmationActionType,
  navigate: NavigateFunction,
  dispatch: Dispatch<unknown>,
  resource?: ConfirmationResource,
) => {
  if (typeof type === 'function') {
    return type();
  }
  switch (type) {
    case CONFIRMATION_TASK_TYPE.CASH_RECONCILIATION.REDIRECT_CR_OPENING:
      return redirectToCashReconciliationOpening(navigate, dispatch);
    case CONFIRMATION_TASK_TYPE.CASH_RECONCILIATION.CHECK_IS_OPEN:
      return handlerExistingCROpen(navigate, dispatch, resource);

    default:
      return dispatch(closeUserNotification());
  }
};
