import { FieldValue } from '../../../core/config/firebase.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

export const resolveClientPendingBalance = (clientDoc) => {
  const record = asRecord(clientDoc);
  const nestedClient = asRecord(record.client);

  return roundToTwoDecimals(
    nestedClient.pendingBalance ?? record.pendingBalance ?? 0,
  );
};

export const buildClientPendingBalanceUpdate = ({
  currentClientDoc,
  delta,
}) => {
  const nextPendingBalance = roundToTwoDecimals(
    Math.max(resolveClientPendingBalance(currentClientDoc) + safeNumber(delta), 0),
  );

  return {
    'client.pendingBalance': nextPendingBalance,
    pendingBalance: FieldValue.delete(),
  };
};
