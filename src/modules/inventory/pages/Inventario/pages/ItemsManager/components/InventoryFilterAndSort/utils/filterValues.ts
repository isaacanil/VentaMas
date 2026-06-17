export const normalizeFilterArrayForExactComparison = (
  value: unknown,
): unknown[] => (Array.isArray(value) ? value : value == null ? [] : [value]);

export const normalizeFilterArrayForSortedComparison = (
  value: unknown = [],
): unknown[] => (Array.isArray(value) ? [...value].sort() : []);
