import {
  toCleanString,
  toFiniteNumber,
} from '../../../versions/v2/billing/utils/billingCommon.util.js';

const roundToTwoDecimals = (value) =>
  Math.round(toFiniteNumber(value) * 100) / 100;

export const resolveMovementSignedAmount = (
  movementRecord,
  { allowNonPositiveAmount = false } = {},
) => {
  const amount = roundToTwoDecimals(movementRecord?.amount);
  if (!allowNonPositiveAmount && amount <= 0) return 0;
  return movementRecord?.direction === 'out' ? -amount : amount;
};

export const isMovementPosted = (movementRecord) => {
  const normalizedStatus = toCleanString(movementRecord?.status)?.toLowerCase();
  return normalizedStatus !== 'void' && normalizedStatus !== 'draft';
};

export const isCashMovementReconciledOrLinked = (movementRecord) =>
  Boolean(
    toCleanString(movementRecord?.reconciliationId) ||
      toCleanString(movementRecord?.bankStatementLineId) ||
      toCleanString(movementRecord?.reconciliationStatus)?.toLowerCase() ===
        'reconciled',
  );
