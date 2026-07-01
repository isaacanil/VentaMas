export const shouldSelectZeroPriceInput = (value: unknown): boolean => {
  const normalizedValue = String(value ?? '')
    .trim()
    .replaceAll(',', '');
  if (!normalizedValue) return false;
  const numericValue = Number(normalizedValue);
  return Number.isFinite(numericValue) && numericValue === 0;
};
