import dayjs, { Dayjs } from 'dayjs';

export const normalizeToDayjs = (value: unknown): Dayjs | null => {
  if (value === null || value === undefined || value === '') return null;
  if (dayjs.isDayjs(value)) return value;

  if (value instanceof Date) {
    return dayjs(value.getTime());
  }

  if (typeof value === 'number') {
    const isSeconds = value < 1e12;
    return dayjs(isSeconds ? value * 1000 : value);
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
        return dayjs(millis);
      }

      if (typeof maybeValue._seconds === 'number') {
        const millis =
          maybeValue._seconds * 1000 +
          (maybeValue._nanoseconds || 0) / 1_000_000;
        return dayjs(millis);
      }

      if (typeof maybeValue.toMillis === 'function') {
        return dayjs(maybeValue.toMillis());
      }

      if (typeof maybeValue.toDate === 'function') {
        return dayjs(maybeValue.toDate().getTime());
      }
    }
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      const isSeconds = numericValue < 1e12;
      return dayjs(isSeconds ? numericValue * 1000 : numericValue);
    }

    const trimmed = value.trim();
    const directParse = dayjs(trimmed);
    if (directParse.isValid()) return directParse;

    const customParse = dayjs(
      trimmed,
      ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD'],
      true,
    );
    if (customParse.isValid()) return customParse;

    return null;
  }

  return null;
};

export const toMillis = (value: unknown): number | null => {
  const normalized = normalizeToDayjs(value);
  return normalized ? normalized.valueOf() : null;
};
