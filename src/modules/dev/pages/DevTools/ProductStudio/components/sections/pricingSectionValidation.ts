type OptionalPriceRow = {
  required?: boolean;
};

export const isUnsetOptionalPriceValue = (
  row: OptionalPriceRow,
  value: unknown,
): boolean => {
  if (row.required) return false;
  if (value === undefined || value === null || value === '') return true;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue <= 0;
};
