import { Timestamp } from '../../../core/config/firebase.js';
export { sanitizeForResponse } from '../../../core/utils/responseSerialization.util.js';

export const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value?.toMillis === 'function') {
    const parsed = value.toMillis();
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

export const timestampFromMillis = (value) => {
  if (typeof Timestamp.fromMillis === 'function') {
    return Timestamp.fromMillis(value);
  }
  return new Timestamp(value);
};
