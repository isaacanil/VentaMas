import { DateTime } from 'luxon';

export const parseTimestamp = (value) => {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value;
  if (typeof value === 'number') return DateTime.fromMillis(value);
  if (value.seconds) return DateTime.fromSeconds(value.seconds);
  if (value._seconds) return DateTime.fromSeconds(value._seconds);
  if (typeof value === 'string') {
    const iso = DateTime.fromISO(value);
    return iso.isValid ? iso : DateTime.fromJSDate(new Date(value));
  }
  if (value.toDate instanceof Function) {
    return DateTime.fromJSDate(value.toDate());
  }
  return null;
};

export const formatDateTime = (value, fallback = 'ƒ?"') => {
  const parsed = parseTimestamp(value);
  return parsed ? parsed.toFormat('dd/MM/yyyy HH:mm:ss') : fallback;
};
