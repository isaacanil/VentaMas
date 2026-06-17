import DateUtils, { formatDate } from '@/utils/date/dateUtils';

type FirestoreTimestampLike = {
  seconds: number;
  nanoseconds: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFirestoreTimestampLike = (
  value: unknown,
): value is FirestoreTimestampLike =>
  isRecord(value) &&
  typeof value.seconds === 'number' &&
  typeof value.nanoseconds === 'number';

export const normalizeInvoiceTimestamp = (input: unknown): number | null => {
  if (!input) return null;
  if (typeof input === 'number') {
    return input > 1e12 ? input : input * 1000;
  }
  if (typeof input === 'string') {
    const numeric = Number(input);
    if (Number.isFinite(numeric)) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }
    const dateFromString = new Date(input);
    if (!Number.isNaN(dateFromString.getTime())) {
      return dateFromString.getTime();
    }
  }
  if (input instanceof Date) {
    return input.getTime();
  }
  if (isRecord(input) && typeof input.toMillis === 'function') {
    const millis = input.toMillis();
    return typeof millis === 'number' && Number.isFinite(millis) ? millis : null;
  }
  if (isFirestoreTimestampLike(input)) {
    return DateUtils.convertTimestampToMillis(input);
  }
  return null;
};

export const convertInvoiceDateToMillis = normalizeInvoiceTimestamp;

// Re-use central logic
export const resolveInvoiceDateMillis = (value: unknown): number | null => {
  return normalizeInvoiceTimestamp(value);
};

export const formatInvoiceDate = (value: unknown): string => {
  const millis = normalizeInvoiceTimestamp(value);
  return millis === null ? '' : formatDate(millis, 'dd/MM/yyyy');
};
