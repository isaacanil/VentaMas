/**
 * Ensures the value is an array
 * @param value - Single value or array
 * @returns Array containing the value(s)
 */
export const ensureArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];
