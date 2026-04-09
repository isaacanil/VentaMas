import { toMillis } from './toMillis';
import type { TimestampLike } from './types';

export const toValidDate = (value: TimestampLike): Date | null => {
  const millis = toMillis(value);
  if (!Number.isFinite(millis)) return null;
  const d = new Date(millis as number);
  return Number.isFinite(d.getTime()) ? d : null;
};
