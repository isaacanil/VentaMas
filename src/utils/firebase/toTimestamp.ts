import { Timestamp } from 'firebase/firestore';
import type { TimestampLike } from '@/utils/date/types';

const NUMBER_LIKE = ['number', 'bigint'] as const;

type NumberLike = number | bigint;

type ValueLike = TimestampLike & {
  valueOf?: () => unknown;
  nanoseconds?: number;
};

const normalizeMillisInput = (value: ValueLike | NumberLike | null | undefined): number | null => {
  if (value == null) return null;
  if (value instanceof Timestamp) return value.toMillis();
  if (NUMBER_LIKE.includes(typeof value as (typeof NUMBER_LIKE)[number])) {
    const millis = Number(value);
    return Number.isFinite(millis) ? millis : null;
  }
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof (value as { valueOf?: () => unknown }).valueOf === 'function') {
    const raw = (value as { valueOf: () => unknown }).valueOf();
    if (NUMBER_LIKE.includes(typeof raw as (typeof NUMBER_LIKE)[number])) {
      return Number(raw);
    }
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof (value as { seconds?: number }).seconds === 'number') {
    const nanos =
      typeof (value as { nanoseconds?: number }).nanoseconds === 'number'
        ? (value as { nanoseconds?: number }).nanoseconds
        : 0;
    return (value as { seconds: number }).seconds * 1000 + Math.floor(nanos / 1e6);
  }

  return null;
};

/**
 * Acepta millis, Date, Luxon DateTime, Timestamp o un objeto {seconds, nanoseconds} y lo devuelve como Timestamp.
 */
export const toTimestamp = (
  input: TimestampLike,
  fallback: TimestampLike | undefined = undefined,
): Timestamp => {
  if (input instanceof Timestamp) return input;

  const millis = normalizeMillisInput(input) ?? normalizeMillisInput(fallback);
  if (millis == null) {
    throw new Error(`Formato de fecha no soportado: ${String(input)}`);
  }

  return Timestamp.fromMillis(millis);
};

export const toMillis = (ts: TimestampLike): number | null => normalizeMillisInput(ts);
