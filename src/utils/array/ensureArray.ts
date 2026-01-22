/**
 * Asegura que el valor dado sea un array.
 */
export const ensureArray = <T>(value: ReadonlyArray<T> | null | undefined): T[];
export const ensureArray = <T = unknown>(value: unknown): T[];
export const ensureArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

/**
 * Devuelve true si `value` no es un array con al menos un elemento.
 */
export const isArrayEmpty = (value: unknown) =>
  ensureArray(value).length === 0;

/**
 * Encuentra un elemento en un array por su propiedad name
 */
export const findByName = <T extends { name: string }>(
  array: ReadonlyArray<T>,
  name: string,
): T | undefined => array.find((item) => item.name === name);
