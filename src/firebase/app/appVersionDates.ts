import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';

const toAppVersionMillis = (value: unknown): number | undefined => {
  return toMillis(value as TimestampLike);
};

export const formatClientAppVersionDate = (
  value: unknown,
): string | undefined => {
  const millis = toAppVersionMillis(value);
  if (millis === undefined) return undefined;

  return new Date(millis).toISOString();
};
