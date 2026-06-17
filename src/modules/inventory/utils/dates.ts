import { DateTime } from 'luxon';

import { toMillis as toSharedMillis } from '@/utils/date/toMillis';
import { toValidDate as toSharedValidDate } from '@/utils/date/toValidDate';
import type { TimestampLike as SharedTimestampLike } from '@/utils/date/types';

import { CLEAR_SENTINEL } from '@/modules/inventory/utils/constants';
import type { TimestampLike } from '@/utils/inventory/types';

const CUSTOM_FORMATS = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'yyyy/MM/dd'];
const MILLIS_THRESHOLD = 1e12;
const NUMERIC_STRING = /^-?\d+(\.\d+)?$/;

const asFiniteMillis = (value: number | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const normalizeInventoryEpoch = (value: number): number =>
  value < MILLIS_THRESHOLD ? value * 1000 : value;

const toInventoryTimestampInput = (value: unknown): SharedTimestampLike => {
  if (typeof value === 'number') {
    return normalizeInventoryEpoch(value);
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return normalizeInventoryEpoch(numericValue);
    }
  }

  return value as SharedTimestampLike;
};

const toInventoryMillis = (value: unknown): number | null =>
  asFiniteMillis(toSharedMillis(toInventoryTimestampInput(value)));

const toDisplayDate = (value: TimestampLike): Date | null => {
  if (!value) return null;
  if (typeof value === 'string' && NUMERIC_STRING.test(value.trim())) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  return toSharedValidDate(value as SharedTimestampLike);
};

export function formatDate(d: TimestampLike): string {
  if (!d) return '';
  try {
    const date = toDisplayDate(d);
    if (!date) return '';
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatInputDate(d: TimestampLike): string {
  if (!d) return '';
  try {
    if (typeof d === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
        const [dd, mm, yyyy] = d.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(d)) {
        const [yyyy, mm, dd] = d.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
    }

    const date = toDisplayDate(d);
    if (!date) return '';
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
): string {
  if (!value || value === CLEAR_SENTINEL) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  return formatInputDate(value) || '';
}

export function toExpirationTimestamp(
  value: TimestampLike | null | undefined,
): number | null {
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

export const normalizeToDateTime = (value: unknown): DateTime | null => {
  if (value === null || value === undefined || value === '') return null;
  if (DateTime.isDateTime(value)) return value;

  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      const millis = toInventoryMillis(value);
      return millis === null ? null : DateTime.fromMillis(millis);
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

  const millis = toInventoryMillis(value);
  return millis === null ? null : DateTime.fromMillis(millis);
};

export const toMillis = (value: unknown): number | null => {
  const normalized = normalizeToDateTime(value);
  return normalized?.isValid ? normalized.toMillis() : null;
};

export function formatDateTime(
  value: unknown,
  format = 'dd/MM/yyyy HH:mm',
): string {
  const normalized = normalizeToDateTime(value);
  return normalized?.isValid ? normalized.toFormat(format) : '';
}
