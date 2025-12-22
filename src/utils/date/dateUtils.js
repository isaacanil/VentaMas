import { Timestamp } from 'firebase/firestore';
import { DateTime } from 'luxon';

import { toMillis } from './toMillis';

const toLuxonFormat = (format = 'DD-MM-YYYY') =>
  format
    .replace(/YYYY/g, 'yyyy')
    .replace(/YY/g, 'yy')
    .replace(/DD/g, 'dd')
    .replace(/D/g, 'd')
    .replace(/MM/g, 'LL')
    .replace(/M/g, 'L');

const DateUtils = {
  // Convert Date-like to Milliseconds
  convertDayjsToMillis: (dateObj) => {
    if (!dateObj) return null;
    if (typeof dateObj?.toMillis === 'function') return dateObj.toMillis();
    if (dateObj instanceof Date) return dateObj.getTime();
    if (typeof dateObj?.valueOf === 'function') return dateObj.valueOf();
    return null;
  },

  // Convert Date-like to Firestore Timestamp
  convertDayjsToTimestamp: (dateObj) => {
    const millis = DateUtils.convertDayjsToMillis(dateObj);
    return millis ? Timestamp.fromMillis(millis) : null;
  },

  // Convert Milliseconds to Firestore Timestamp
  convertMillisToTimestamp: (millis) =>
    millis ? Timestamp.fromMillis(millis) : null,

  // Convert Firestore Timestamp to Luxon DateTime
  convertTimestampToDayjs: (timestamp) =>
    timestamp?.seconds ? DateTime.fromMillis(timestamp.seconds * 1000) : null,

  // Convert Milliseconds to Luxon DateTime
  convertMillisToDayjs: (input, dateFormat = 'DD-MM-YYYY') => {
    if (typeof input === 'string' && /^\d+$/.test(input)) input = Number(input);
    if (typeof input === 'number') return DateTime.fromMillis(input);
    if (typeof input === 'string') {
      const parsedDate = DateTime.fromFormat(
        input,
        toLuxonFormat(dateFormat),
      );
      return parsedDate.isValid ? parsedDate : null;
    }
    return null;
  },

  // Convert Milliseconds to ISO Date
  convertMillisToISODate: (milliseconds, format = 'dd/MM/yyyy') => {
    if (!milliseconds) return null;
    if (
      typeof milliseconds === 'object' &&
      milliseconds.seconds !== undefined
    ) {
      milliseconds =
        milliseconds.seconds * 1000 + milliseconds.nanoseconds / 1000000;
    } else if (typeof milliseconds === 'string') {
      milliseconds = JSON.parse(milliseconds);
    }
    const date = DateTime.fromMillis(milliseconds);
    return date.toFormat(format);
  },

  // Convert Firestore Timestamp to Milliseconds
  convertTimestampToMillis: (timestamp) => {
    if (!timestamp) return null;
    return timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
  },

  // Convert Milliseconds to Luxon Date
  convertMillisToLuxonDate: (millis) => {
    if (!millis) return null;
    if (typeof millis === 'string') millis = JSON.parse(millis);
    return DateTime.fromMillis(millis);
  },

  // Convert Milliseconds to Luxon DateTime
  convertMillisToLuxonDateTime: (millis) => {
    if (!millis) return null;
    if (typeof millis === 'string') millis = JSON.parse(millis);
    return DateTime.fromMillis(millis);
  },

  // Convert Milliseconds to Friendly Date
  convertMillisToFriendlyDate: (millis) => {
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
  },

  // Format Luxon DateTime
  formatLuxonDateTime: (dateTime) => {
    if (!dateTime) return '';
    if (!(dateTime instanceof DateTime))
      dateTime = DateUtils.convertMillisToLuxonDate(dateTime);
    return dateTime?.toFormat('dd/MM/yyyy HH:mm') || '';
  },

  // Format Luxon Date to Date Only
  formatLuxonDate: (dateTime) => {
    if (!dateTime) return '';
    const millis = toMillis(dateTime);
    if (!(dateTime instanceof DateTime))
      dateTime = DateUtils.convertMillisToLuxonDate(millis);
    return dateTime?.toFormat('dd/MM/yyyy') || '';
  },

  // Convert JavaScript Date to Milliseconds
  convertDateToMillis: (jsDate) =>
    jsDate instanceof Date ? jsDate.valueOf() : null,
};

export default DateUtils;
