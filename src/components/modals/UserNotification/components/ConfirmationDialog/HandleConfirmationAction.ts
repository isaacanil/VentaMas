import { closeUserNotification } from '@/features/UserNotification/UserNotificationSlice';

import { handlerExistingCROpen } from './functions/CashReconciliation/handleExistingCROpen';
import { redirectToCashReconciliationOpening } from './functions/CashReconciliation/redirectToCashReconciliationOpening';
import type { Dispatch } from 'react';
import type { NavigateFunction } from 'react-router-dom';

const CASH_RECONCILIATION = {
  REDIRECT_CR_OPENING: 'redirectCROpening',
  CHECK_IS_OPEN: 'handleExistingOpenCR',
};

export const CONFIRMATION_TASK_TYPE = {
  CASH_RECONCILIATION,
};

type ConfirmationResource = {
  isExistingOpenCR?: boolean;
};

type ConfirmationActionType =
  | (typeof CASH_RECONCILIATION)[keyof typeof CASH_RECONCILIATION]
  | string
  | null;

export const HandleConfirmationAction = (
  type: ConfirmationActionType,
  navigate: NavigateFunction,
  dispatch: Dispatch<unknown>,
  resource?: ConfirmationResource,
) => {
  switch (type) {
    case CASH_RECONCILIATION.REDIRECT_CR_OPENING:
      return redirectToCashReconciliationOpening(navigate, dispatch);
    case CASH_RECONCILIATION.CHECK_IS_OPEN:
      return handlerExistingCROpen(navigate, dispatch, resource);

    default:
      return dispatch(closeUserNotification());
  }
};
