// utils/date/toTimestamp.js
import { Timestamp } from 'firebase/firestore';

const NUMBER_LIKE = ['number', 'bigint'];

const normalizeMillisInput = (value) => {
  if (value == null) return null;
  if (value instanceof Timestamp) return value.toMillis();

  if (NUMBER_LIKE.includes(typeof value)) {
    const millis = Number(value);
    return Number.isFinite(millis) ? millis : null;
  }

  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value?.valueOf === 'function') {
    const raw = value.valueOf();
    if (NUMBER_LIKE.includes(typeof raw)) {
      return Number(raw);
    }
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof value?.seconds === 'number') {
    const nanos = typeof value.nanoseconds === 'number' ? value.nanoseconds : 0;
    return value.seconds * 1000 + Math.floor(nanos / 1e6);
  }

  return null;
};

/**
 * Acepta millis, Date, Luxon DateTime, Timestamp o un objeto {seconds, nanoseconds} y lo devuelve como Timestamp.
 */
export const toTimestamp = (input, fallback = undefined) => {
  if (input instanceof Timestamp) return input;

  const millis = normalizeMillisInput(input) ?? normalizeMillisInput(fallback);
  if (millis == null) {
    throw new Error(`Formato de fecha no soportado: ${String(input)}`);
  }

  return Timestamp.fromMillis(millis);
};

export const toMillis = (ts) => normalizeMillisInput(ts);
