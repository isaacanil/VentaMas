import { DateTime } from 'luxon';

import { toMillis } from '@/utils/date/toMillis';

export const MIN_VALID_TRANSACTION_MILLIS = 946684800000; // 2000-01-01T00:00:00.000Z

export const normalizeTransactionMillis = (value: unknown): number | null => {
  const rawMillis = toMillis(value as any);
  if (typeof rawMillis !== 'number' || !Number.isFinite(rawMillis)) {
    return null;
  }

  const normalized = rawMillis < 100_000_000_000 ? rawMillis * 1000 : rawMillis;
  return normalized >= MIN_VALID_TRANSACTION_MILLIS ? normalized : null;
};

export const hasValidTransactionDate = (value: unknown): boolean => {
  return normalizeTransactionMillis(value) !== null;
};

export const parseTransactionDate = (value: unknown): DateTime | null => {
  const millis = normalizeTransactionMillis(value);
  if (typeof millis === 'number') {
    return DateTime.fromMillis(millis);
  }

  if (DateTime.isDateTime(value) && value.isValid) return value;
  return null;
};
