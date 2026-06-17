import { db } from '../../../core/config/firebase.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';

export const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const toMillis = (value) => {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const toUserRef = (userId) => {
  const normalized = toCleanString(userId);
  return normalized ? db.doc(`users/${normalized}`) : null;
};

const lastPathSegment = (segments) =>
  Array.isArray(segments) ? toCleanString(segments.slice(-1)[0]) || null : null;

export const resolveCashCountEmployeeId = (employee) => {
  if (!employee) return null;
  if (typeof employee === 'string') {
    const parts = employee.split('/');
    return toCleanString(parts[parts.length - 1]) || null;
  }

  return (
    lastPathSegment(employee?._path?.segments) ||
    lastPathSegment(employee?._key?.path?.segments) ||
    toCleanString(employee.id) ||
    toCleanString(employee.uid) ||
    toCleanString(employee.userId) ||
    null
  );
};
