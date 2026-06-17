import { Timestamp, serverTimestamp } from 'firebase/firestore';
import type { FieldValue } from 'firebase/firestore';
import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';

export type SafeTimestampFallback = 'now' | 'server' | 'null';
type FirestoreTimestampField =
  | {
      seconds?: number;
    }
  | number
  | undefined;

export const safeTimestamp = (
  value: TimestampLike,
  fallback: SafeTimestampFallback = 'null',
): Timestamp | FieldValue | null => {
  const fallbackValue: Timestamp | FieldValue | null =
    fallback === 'server'
      ? serverTimestamp()
      : fallback === 'now'
        ? Timestamp.now()
        : null;

  if (value === null || value === undefined) return fallbackValue;

  const millis = toMillis(value);
  if (!Number.isFinite(millis)) return fallbackValue;
  return Timestamp.fromMillis(millis as number);
};

export const convertFirestoreTimestamps = (
  record: Record<string, FirestoreTimestampField>,
  fields: string[],
): void => {
  fields.forEach((field) => {
    const value = record[field];
    const timestamp =
      typeof value === 'object' && value !== null && 'seconds' in value
        ? value.seconds
        : undefined;
    if (typeof timestamp === 'number') {
      record[field] = timestamp * 1000;
    }
  });
};
