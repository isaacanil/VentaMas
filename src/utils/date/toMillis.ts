import type { TimestampLike } from '@/utils/date/types';

type UnknownRecord = Record<string, unknown>;

const asFiniteMillis = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === 'object';

const isPlainObject = (value: unknown): value is UnknownRecord => {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const hasTimestampShape = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return (
    typeof value.toDate === 'function' ||
    typeof value.toMillis === 'function' ||
    'seconds' in value ||
    '_seconds' in value
  );
};

export const toMillis = (d: TimestampLike): number | undefined => {
  if (d === null || d === undefined) return undefined;
  if (typeof d === 'number') return asFiniteMillis(d);
  if (typeof d === 'string') {
    const trimmed = d.trim();
    // Only parse as a raw number if the string is purely numeric (with optional decimals)
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const int = parseInt(trimmed.split('.')[0], 10);
      return asFiniteMillis(int);
    }
    // Otherwise treat as an ISO / date string
    const parsed = new Date(d).getTime();
    return asFiniteMillis(parsed);
  }
  if (d instanceof Date) return asFiniteMillis(d.getTime());
  if (typeof (d as { toDate?: () => Date }).toDate === 'function') {
    const millis = asFiniteMillis(
      (d as { toDate: () => Date }).toDate().getTime(),
    );
    if (millis !== undefined) return millis;
  }
  if (typeof (d as { toMillis?: () => number }).toMillis === 'function') {
    const millis = asFiniteMillis((d as { toMillis: () => number }).toMillis());
    if (millis !== undefined) return millis;
  }
  const secondsRaw =
    (d as { seconds?: unknown; _seconds?: unknown }).seconds ??
    (d as { _seconds?: unknown })._seconds;
  if (secondsRaw !== undefined) {
    const seconds =
      typeof secondsRaw === 'string' ? Number(secondsRaw) : secondsRaw;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      const nanosRaw =
        (d as { nanoseconds?: unknown; _nanoseconds?: unknown }).nanoseconds ??
        (d as { _nanoseconds?: unknown })._nanoseconds;
      const nanos = typeof nanosRaw === 'string' ? Number(nanosRaw) : nanosRaw;
      const nanosValue =
        typeof nanos === 'number' && Number.isFinite(nanos) ? nanos : 0;
      return asFiniteMillis(seconds * 1000 + nanosValue / 1e6);
    }
  }
  if (typeof (d as { valueOf?: () => unknown }).valueOf === 'function') {
    const millis = asFiniteMillis((d as { valueOf: () => unknown }).valueOf());
    if (millis !== undefined) return millis;
  }
  return asFiniteMillis(new Date(d as string | number | Date).getTime());
};

const toTimestampObjectMillis = (value: unknown): number | undefined => {
  if (value instanceof Date || hasTimestampShape(value)) {
    return toMillis(value as TimestampLike);
  }
  return undefined;
};

const serializeTimestampsToMillisInternal = (
  value: unknown,
  seen: WeakMap<object, unknown>,
): unknown => {
  const millis = toTimestampObjectMillis(value);
  if (millis !== undefined) return millis;

  if (Array.isArray(value)) {
    const cached = seen.get(value);
    if (cached !== undefined) return cached;

    const serialized: unknown[] = [];
    seen.set(value, serialized);

    value.forEach((item, index) => {
      serialized[index] = serializeTimestampsToMillisInternal(item, seen);
    });

    return serialized;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const cached = seen.get(value);
  if (cached !== undefined) return cached;

  const serialized: UnknownRecord = {};
  seen.set(value, serialized);

  Object.entries(value).forEach(([key, item]) => {
    serialized[key] = serializeTimestampsToMillisInternal(item, seen);
  });

  return serialized;
};

export const serializeTimestampsToMillis = <T>(value: T): T =>
  serializeTimestampsToMillisInternal(value, new WeakMap<object, unknown>()) as T;
