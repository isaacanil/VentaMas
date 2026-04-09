import { DateTime } from 'luxon';

type TimestampLike = {
  seconds?: number;
  _seconds?: number;
  toDate?: () => Date;
};

export const parseTimestamp = (value: unknown): DateTime | null => {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value;
  if (typeof value === 'number') return DateTime.fromMillis(value);
  if (typeof value === 'string') {
    const iso = DateTime.fromISO(value);
    return iso.isValid ? iso : DateTime.fromJSDate(new Date(value));
  }
  if (typeof value === 'object') {
    const timestamp = value as TimestampLike;
    if (typeof timestamp.seconds === 'number') {
      return DateTime.fromSeconds(timestamp.seconds);
    }
    if (typeof timestamp._seconds === 'number') {
      return DateTime.fromSeconds(timestamp._seconds);
    }
    if (typeof timestamp.toDate === 'function') {
      return DateTime.fromJSDate(timestamp.toDate());
    }
  }
  return null;
};

export const formatDateTime = (value: unknown, fallback = 'ƒ?"') => {
  const parsed = parseTimestamp(value);
  return parsed ? parsed.toFormat('dd/MM/yyyy HH:mm:ss') : fallback;
};
