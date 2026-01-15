export const { isArray } = Array;

export function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}
