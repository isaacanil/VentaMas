const CASH_RECONCILIATION = {
  REDIRECT_CR_OPENING: 'redirectCROpening',
  CHECK_IS_OPEN: 'handleExistingOpenCR',
} as const;

export const CONFIRMATION_TASK_TYPE = {
  CASH_RECONCILIATION,
} as const;

export type CashReconciliationConfirmationTask =
  (typeof CASH_RECONCILIATION)[keyof typeof CASH_RECONCILIATION];
