import type { TimestampLike } from '@/utils/date/types';

const asFiniteMillis = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
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
