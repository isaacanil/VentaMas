import { Timestamp } from '../../../../core/config/firebase.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const timestampFromMillis = (value) =>
  Number.isFinite(value) ? Timestamp.fromMillis(value) : null;

const timestampFromDate = (value) =>
  value instanceof Date ? timestampFromMillis(value.getTime()) : null;

const resolveSeconds = (record) =>
  typeof record.seconds === 'number'
    ? record.seconds
    : typeof record._seconds === 'number'
      ? record._seconds
      : null;

const resolveNanoseconds = (record) =>
  typeof record.nanoseconds === 'number'
    ? record.nanoseconds
    : typeof record._nanoseconds === 'number'
      ? record._nanoseconds
      : 0;

export const resolveAccountingTimestamp = (...values) => {
  for (const value of values) {
    if (!value) continue;
    if (value instanceof Timestamp) {
      return value;
    }
    if (typeof value?.toMillis === 'function') {
      const resolved = timestampFromMillis(value.toMillis());
      if (resolved) return resolved;
    }
    if (typeof value?.toDate === 'function') {
      const resolved = timestampFromDate(value.toDate());
      if (resolved) return resolved;
    }
    if (value instanceof Date) {
      const resolved = timestampFromDate(value);
      if (resolved) return resolved;
    }
    if (typeof value === 'number') {
      const resolved = timestampFromMillis(value);
      if (resolved) return resolved;
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      const resolved = timestampFromMillis(parsed);
      if (resolved) return resolved;
    }
    if (typeof value === 'object') {
      const record = asRecord(value);
      const seconds = resolveSeconds(record);
      const nanoseconds = resolveNanoseconds(record);
      if (Number.isFinite(seconds) && Number.isFinite(nanoseconds)) {
        return new Timestamp(seconds, nanoseconds);
      }
    }
  }

  return Timestamp.now();
};
