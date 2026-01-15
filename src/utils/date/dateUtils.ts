import { Timestamp } from 'firebase/firestore';
import { DateTime } from 'luxon';

import { toMillis } from './toMillis';

export * from './toMillis';

const toLuxonFormat = (format = 'DD-MM-YYYY') =>
  format
    .replace(/YYYY/g, 'yyyy')
    .replace(/YY/g, 'yy')
    .replace(/DD/g, 'dd')
    .replace(/D/g, 'd')
    .replace(/MM/g, 'LL')
    .replace(/M/g, 'L');

export const formatLocaleDate = (date: any, options: any = {}) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis)
    .setLocale('es-ES')
    .toLocaleString(options || DateTime.DATE_SHORT);
};

export const formatLocaleMonthYear = (date: any) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).setLocale('es-ES').toFormat('MMMM yyyy');
};

export const formatDateTime = (date: any) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy HH:mm');
};

export const formatDate = (date: any) => {
  const millis = toMillis(date);
  if (!millis) return '';
  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy');
};

export const convertDayjsToMillis = (dateObj: any) => {
  if (!dateObj) return null;
  if (typeof dateObj?.toMillis === 'function') return dateObj.toMillis();
  if (dateObj instanceof Date) return dateObj.getTime();
  if (typeof dateObj?.valueOf === 'function') return dateObj.valueOf();
  return null;
};

export const convertDayjsToTimestamp = (dateObj: any) => {
  const millis = convertDayjsToMillis(dateObj);
  return millis ? Timestamp.fromMillis(millis) : null;
};

export const convertMillisToTimestamp = (millis: any) =>
  millis ? Timestamp.fromMillis(millis) : null;

export const convertTimestampToDayjs = (timestamp: any) =>
  timestamp?.seconds ? DateTime.fromMillis(timestamp.seconds * 1000) : null;

export const convertMillisToDayjs = (input: any, dateFormat = 'DD-MM-YYYY') => {
  if (typeof input === 'string' && /^\d+$/.test(input)) input = Number(input);
  if (typeof input === 'number') return DateTime.fromMillis(input);
  if (typeof input === 'string') {
    const parsedDate = DateTime.fromFormat(input, toLuxonFormat(dateFormat));
    return parsedDate.isValid ? parsedDate : null;
  }
  return null;
};

export const convertMillisToISODate = (milliseconds: any, format = 'dd/MM/yyyy') => {
  if (!milliseconds) return null;
  if (typeof milliseconds === 'object' && milliseconds.seconds !== undefined) {
    milliseconds =
      milliseconds.seconds * 1000 + milliseconds.nanoseconds / 1000000;
  } else if (typeof milliseconds === 'string') {
    milliseconds = JSON.parse(milliseconds);
  }
  const date = DateTime.fromMillis(milliseconds);
  return date.toFormat(format);
};

export const convertTimestampToMillis = (timestamp: any) => {
  if (!timestamp) return null;
  return timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
};

export const convertMillisToLuxonDate = (millis: any) => {
  if (!millis) return null;
  if (typeof millis === 'string') millis = JSON.parse(millis);
  return DateTime.fromMillis(millis);
};

export const convertMillisToLuxonDateTime = (millis: any) => {
  if (!millis) return null;
  if (typeof millis === 'string') millis = JSON.parse(millis);
  return DateTime.fromMillis(millis);
};

export const convertMillisToFriendlyDate = (millis: any) => {
  if (!millis)
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
    });

  // Handle Firestore Timestamp objects
  if (typeof millis === 'object' && millis.seconds !== undefined) {
    millis = millis.seconds * 1000 + millis.nanoseconds / 1000000;
  } else if (typeof millis === 'string') {
    millis = JSON.parse(millis);
  }

  const date = DateTime.fromMillis(millis);
  return date.isValid
    ? date.toFormat('dd/MM/yyyy HH:mm')
    : 'Invalid milliseconds';
};

export const formatLuxonDateTime = (dateTime: any) => {
  if (!dateTime) return '';
  if (!(dateTime instanceof DateTime))
    dateTime = convertMillisToLuxonDate(dateTime);
  return dateTime?.toFormat('dd/MM/yyyy HH:mm') || '';
};

export const formatLuxonDate = (dateTime: any) => {
  if (!dateTime) return '';
  const millis = toMillis(dateTime);
  if (!(dateTime instanceof DateTime))
    dateTime = convertMillisToLuxonDate(millis);
  return dateTime?.toFormat('dd/MM/yyyy') || '';
};

export const convertDateToMillis = (jsDate: any) =>
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
