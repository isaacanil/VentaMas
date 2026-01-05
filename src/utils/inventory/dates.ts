import { DateTime } from 'luxon';

import { CLEAR_SENTINEL } from './constants';
import type { TimestampLike } from './types';

export function formatDate(d: TimestampLike) {
  if (!d) return '';
  try {
    let date: Date;
    if (DateTime.isDateTime(d)) {
      date = d.toJSDate();
    } else if (d instanceof Date) {
      date = d;
    } else if (typeof d === 'object' && 'toDate' in d && typeof d.toDate === 'function') {
      date = d.toDate();
    } else if (typeof d === 'object' && 'seconds' in d && typeof d.seconds === 'number') {
      date = new Date(d.seconds * 1000);
    } else if (typeof d === 'string' || typeof d === 'number') {
      date = new Date(d);
    } else {
      return '';
    }
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatInputDate(d: TimestampLike) {
  if (!d) return '';
  try {
    let date: Date;
    if (DateTime.isDateTime(d)) {
      date = d.toJSDate();
    } else if (d instanceof Date) {
      date = d;
    } else if (typeof d === 'object' && 'toDate' in d && typeof d.toDate === 'function') {
      date = d.toDate();
    } else if (typeof d === 'object' && 'seconds' in d && typeof d.seconds === 'number') {
      date = new Date(d.seconds * 1000);
    } else if (typeof d === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
        const [dd, mm, yyyy] = d.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(d)) {
        const [yyyy, mm, dd] = d.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
      date = new Date(d);
    } else if (typeof d === 'number') {
      date = new Date(d);
    } else {
      return '';
    }
    if (Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  } catch {
    return '';
  }
}

export function normalizeExpirationValue(
  value: TimestampLike | string | null | undefined,
) {
  if (!value || value === CLEAR_SENTINEL) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return formatInputDate(value) || '';
}

export function toExpirationTimestamp(value: TimestampLike | null | undefined) {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.toMillis === 'function') return value.toMillis();
  }
  return null;
}

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

export function formatDateTime(
  value: unknown,
  format = 'dd/MM/yyyy HH:mm',
) {
  const normalized = normalizeToDateTime(value);
  return normalized ? normalized.toFormat(format) : '';
}
