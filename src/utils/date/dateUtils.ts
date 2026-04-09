import { Timestamp } from 'firebase/firestore';
import { DateTime } from 'luxon';

import { toMillis } from './toMillis';
import type { TimestampLike } from './types';

export * from './toMillis';

type TimestampSeconds = { seconds: number; nanoseconds?: number };
type MillisInput = number | string | TimestampSeconds | null | undefined;
type DayjsLike = { toMillis?: () => number; valueOf?: () => number };
type DateInput = TimestampLike | DayjsLike | null | undefined;

const toLuxonFormat = (format = 'DD-MM-YYYY') =>
  format
    .replace(/YYYY/g, 'yyyy')
    .replace(/YY/g, 'yy')
    .replace(/DD/g, 'dd')
    .replace(/D/g, 'd')
    .replace(/MM/g, 'LL')
    .replace(/M/g, 'L');

const toMillisInput = (value: MillisInput): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value.seconds === 'number'
  ) {
    const nanos =
      typeof value.nanoseconds === 'number' ? value.nanoseconds : 0;
    return value.seconds * 1000 + nanos / 1e6;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
    try {
      const jsonValue = JSON.parse(trimmed) as unknown;
      return typeof jsonValue === 'number' && Number.isFinite(jsonValue)
        ? jsonValue
        : null;
    } catch {
      return null;
    }
  }
  return null;
};

const toDateTime = (
  value: DateTime | TimestampLike | number | string | null | undefined,
): DateTime | null => {
  if (!value) return null;
  if (value instanceof DateTime) return value;
  const millis = toMillis(value as TimestampLike);
  return typeof millis === 'number' ? DateTime.fromMillis(millis) : null;
};

export const formatLocaleDate = (
  date: TimestampLike | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis)
    .setLocale('es-ES')
    .toLocaleString(options ?? DateTime.DATE_SHORT);
};

export const formatLocaleMonthYear = (
  date: TimestampLike | null | undefined,
) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).setLocale('es-ES').toFormat('MMMM yyyy');
};

export const formatDateTime = (date: TimestampLike | null | undefined) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy HH:mm');
};

export const formatDate = (
  date: TimestampLike | null | undefined,
  format = 'dd/MM/yyyy',
) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).toFormat(format);
};

export const convertDayjsToMillis = (dateObj: DateInput) => {
  if (!dateObj) return null;
  if (typeof (dateObj as DayjsLike).toMillis === 'function') {
    return (dateObj as DayjsLike).toMillis?.() ?? null;
  }
  if (dateObj instanceof Date) return dateObj.getTime();
  if (typeof (dateObj as DayjsLike).valueOf === 'function') {
    return (dateObj as DayjsLike).valueOf?.() ?? null;
  }
  return null;
};

export const convertDayjsToTimestamp = (dateObj: DateInput) => {
  const millis = convertDayjsToMillis(dateObj);
  return millis ? Timestamp.fromMillis(millis) : null;
};

export const convertMillisToTimestamp = (millis: number | null | undefined) =>
  typeof millis === 'number' ? Timestamp.fromMillis(millis) : null;

export const convertTimestampToDayjs = (
  timestamp: Timestamp | TimestampSeconds | null | undefined,
) =>
  timestamp?.seconds ? DateTime.fromMillis(timestamp.seconds * 1000) : null;

export const convertMillisToDayjs = (
  input: string | number | null | undefined,
  dateFormat = 'DD-MM-YYYY',
) => {
  if (typeof input === 'string' && /^\d+$/.test(input)) input = Number(input);
  if (typeof input === 'number') return DateTime.fromMillis(input);
  if (typeof input === 'string') {
    const parsedDate = DateTime.fromFormat(input, toLuxonFormat(dateFormat));
    return parsedDate.isValid ? parsedDate : null;
  }
  return null;
};

export const convertMillisToISODate = (
  milliseconds: MillisInput,
  format = 'dd/MM/yyyy',
) => {
  const millis = toMillisInput(milliseconds);
  if (millis === null) return null;
  const date = DateTime.fromMillis(millis);
  return date.toFormat(format);
};

export const convertTimestampToMillis = (
  timestamp: Timestamp | TimestampSeconds | null | undefined,
) => {
  if (!timestamp) return null;
  return timestamp.seconds * 1000 + (timestamp.nanoseconds ?? 0) / 1000000;
};

export const convertMillisToLuxonDate = (
  millis: MillisInput,
) => {
  const resolvedMillis = toMillisInput(millis);
  if (resolvedMillis === null) return null;
  return DateTime.fromMillis(resolvedMillis);
};

export const convertMillisToLuxonDateTime = (
  millis: MillisInput,
) => {
  const resolvedMillis = toMillisInput(millis);
  if (resolvedMillis === null) return null;
  return DateTime.fromMillis(resolvedMillis);
};

export const convertMillisToFriendlyDate = (millis: MillisInput) => {
  if (!millis)
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
    });

  const resolvedMillis = toMillisInput(millis);
  if (resolvedMillis === null) return 'Invalid milliseconds';

  const date = DateTime.fromMillis(resolvedMillis);
  return date.isValid
    ? date.toFormat('dd/MM/yyyy HH:mm')
    : 'Invalid milliseconds';
};

export const formatLuxonDateTime = (
  dateTime: DateTime | TimestampLike | number | string | null | undefined,
) => {
  const resolved = toDateTime(dateTime);
  return resolved?.toFormat('dd/MM/yyyy HH:mm') || '';
};

export const formatLuxonDate = (
  dateTime: DateTime | TimestampLike | null | undefined,
) => {
  const resolved = toDateTime(dateTime);
  return resolved?.toFormat('dd/MM/yyyy') || '';
};

export const convertDateToMillis = (jsDate: Date | null | undefined) =>
  jsDate instanceof Date ? jsDate.valueOf() : null;

const DateUtils = {
  toMillis,
  formatLocaleDate,
  formatLocaleMonthYear,
  formatDateTime,
  formatDate,
  convertDayjsToMillis,
  convertDayjsToTimestamp,
  convertMillisToTimestamp,
  convertTimestampToDayjs,
  convertMillisToDayjs,
  convertMillisToISODate,
  convertTimestampToMillis,
  convertMillisToLuxonDate,
  convertMillisToLuxonDateTime,
  convertMillisToFriendlyDate,
  formatLuxonDateTime,
  formatLuxonDate,
  convertDateToMillis,
};

export default DateUtils;
