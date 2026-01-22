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

export const formatLocaleMonthYear = (date: TimestampLike | null | undefined) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).setLocale('es-ES').toFormat('MMMM yyyy');
};

export const formatDateTime = (date: TimestampLike | null | undefined) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy HH:mm');
};

export const formatDate = (date: TimestampLike | null | undefined) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy');
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
) => (timestamp?.seconds ? DateTime.fromMillis(timestamp.seconds * 1000) : null);

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
  if (!milliseconds) return null;
  if (
    typeof milliseconds === 'object' &&
    milliseconds !== null &&
    typeof milliseconds.seconds === 'number'
  ) {
    milliseconds =
      milliseconds.seconds * 1000 + (milliseconds.nanoseconds ?? 0) / 1000000;
  } else if (typeof milliseconds === 'string') {
    milliseconds = JSON.parse(milliseconds);
  }
  const date = DateTime.fromMillis(milliseconds);
  return date.toFormat(format);
};

export const convertTimestampToMillis = (
  timestamp: Timestamp | TimestampSeconds | null | undefined,
) => {
  if (!timestamp) return null;
  return timestamp.seconds * 1000 + (timestamp.nanoseconds ?? 0) / 1000000;
};

export const convertMillisToLuxonDate = (
  millis: number | string | null | undefined,
) => {
  if (!millis) return null;
  if (typeof millis === 'string') millis = JSON.parse(millis);
  return DateTime.fromMillis(millis);
};

export const convertMillisToLuxonDateTime = (
  millis: number | string | null | undefined,
) => {
  if (!millis) return null;
  if (typeof millis === 'string') millis = JSON.parse(millis);
  return DateTime.fromMillis(millis);
};

export const convertMillisToFriendlyDate = (millis: MillisInput) => {
  if (!millis)
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
    });

  // Handle Firestore Timestamp objects
  if (
    typeof millis === 'object' &&
    millis !== null &&
    typeof millis.seconds === 'number'
  ) {
    millis = millis.seconds * 1000 + millis.nanoseconds / 1000000;
  } else if (typeof millis === 'string') {
    millis = JSON.parse(millis);
  }

  const date = DateTime.fromMillis(millis);
  return date.isValid
    ? date.toFormat('dd/MM/yyyy HH:mm')
    : 'Invalid milliseconds';
};

export const formatLuxonDateTime = (
  dateTime: DateTime | TimestampLike | number | string | null | undefined,
) => {
  if (!dateTime) return '';
  if (!(dateTime instanceof DateTime)) {
    const millis = toMillis(dateTime as TimestampLike);
    dateTime = millis ? DateTime.fromMillis(millis) : null;
  }
  return dateTime?.toFormat('dd/MM/yyyy HH:mm') || '';
};

export const formatLuxonDate = (
  dateTime: DateTime | TimestampLike | null | undefined,
) => {
  if (!dateTime) return '';
  const millis = toMillis(dateTime);
  if (!(dateTime instanceof DateTime)) {
    dateTime = millis ? DateTime.fromMillis(millis) : null;
  }
  return dateTime?.toFormat('dd/MM/yyyy') || '';
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
