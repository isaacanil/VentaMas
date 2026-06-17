import { Timestamp } from '../config/firebase.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const isTimestampLike = (value) => {
  if (!value || typeof value !== 'object') return false;
  if (value instanceof Timestamp) return true;
  if (typeof value.toMillis === 'function') return true;
  const record = asRecord(value);
  return (
    typeof record.seconds === 'number' ||
    typeof record._seconds === 'number'
  );
};

const timestampLikeToMillis = (value) => {
  if (typeof value?.toMillis === 'function') {
    const parsed = value.toMillis();
    return Number.isFinite(parsed) ? parsed : null;
  }

  const record = asRecord(value);
  const seconds =
    typeof record.seconds === 'number'
      ? record.seconds
      : typeof record._seconds === 'number'
        ? record._seconds
        : null;
  const nanoseconds =
    typeof record.nanoseconds === 'number'
      ? record.nanoseconds
      : typeof record._nanoseconds === 'number'
        ? record._nanoseconds
        : 0;

  if (seconds == null) return null;
  return seconds * 1000 + Math.floor(nanoseconds / 1e6);
};

export const sanitizeForResponse = (value) => {
  if (isTimestampLike(value)) {
    const millis = timestampLikeToMillis(value);
    return millis ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForResponse(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const next = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (nestedValue === undefined) return;
    next[key] = sanitizeForResponse(nestedValue);
  });
  return next;
};
