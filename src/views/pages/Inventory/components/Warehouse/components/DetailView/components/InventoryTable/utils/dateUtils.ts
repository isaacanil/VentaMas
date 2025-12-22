import { DateTime } from 'luxon';

const CUSTOM_FORMATS = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'yyyy/MM/dd'];

export const normalizeToDateTime = (value: unknown): DateTime | null => {
  if (value === null || value === undefined || value === '') return null;
  if (DateTime.isDateTime(value)) return value;

  if (value instanceof Date) {
    return DateTime.fromJSDate(value);
  }

  if (typeof value === 'number') {
    const isSeconds = value < 1e12;
    return isSeconds ? DateTime.fromSeconds(value) : DateTime.fromMillis(value);
  }

  if (typeof value === 'object') {
    const maybeValue = value as {
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
      toMillis?: () => number;
      toDate?: () => Date;
    } | null;

    if (maybeValue) {
      if (typeof maybeValue.seconds === 'number') {
        const millis =
          maybeValue.seconds * 1000 + (maybeValue.nanoseconds || 0) / 1_000_000;
        return DateTime.fromMillis(millis);
      }

      if (typeof maybeValue._seconds === 'number') {
        const millis =
          maybeValue._seconds * 1000 +
          (maybeValue._nanoseconds || 0) / 1_000_000;
        return DateTime.fromMillis(millis);
      }

      if (typeof maybeValue.toMillis === 'function') {
        return DateTime.fromMillis(maybeValue.toMillis());
      }

      if (typeof maybeValue.toDate === 'function') {
        return DateTime.fromJSDate(maybeValue.toDate());
      }
    }
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      const isSeconds = numericValue < 1e12;
      return isSeconds
        ? DateTime.fromSeconds(numericValue)
        : DateTime.fromMillis(numericValue);
    }

    const trimmed = value.trim();
    const isoParse = DateTime.fromISO(trimmed);
    if (isoParse.isValid) return isoParse;

    for (const format of CUSTOM_FORMATS) {
      const parsed = DateTime.fromFormat(trimmed, format);
      if (parsed.isValid) return parsed;
    }

    return null;
  }

  return null;
};

export const toMillis = (value: unknown): number | null => {
  const normalized = normalizeToDateTime(value);
  return normalized ? normalized.toMillis() : null;
};
