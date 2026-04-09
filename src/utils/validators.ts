import { toNumber as toSafeNumber } from '@/utils/number/toNumber';

export const { isArray } = Array;

export function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'string') {
    return toSafeNumber(value.replace(',', '.'));
  }
  return toSafeNumber(value);
}
