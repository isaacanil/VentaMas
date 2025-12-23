import { isArray, toNumber } from '@/utils/validators';

export function getTotalValue(banknotes) {
  if (!isArray(banknotes)) return 0;
  return banknotes.reduce((sum, { value, quantity }) => {
    const val = toNumber(value) || 0;
    const qty = toNumber(quantity) || 0;
    return sum + val * qty;
  }, 0);
}

export function getTotalPieces(banknotes) {
  if (!isArray(banknotes)) return 0;
  return banknotes.reduce(
    (sum, { quantity }) => sum + toNumber(quantity) || 0,
    0,
  );
}

export function prepareForFirebase(banknotes) {
  if (!isArray(banknotes)) return [];
  return banknotes.map(({ ref, value, quantity }) => ({
    ref,
    value: toNumber(value) || 0,
    quantity: toNumber(quantity) || 0,
  }));
}
