/**
 * Asegura que el valor dado sea un array.
 */
export function ensureArray<T>(value: ReadonlyArray<T> | null | undefined): T[];
export function ensureArray<T = unknown>(value: unknown): T[];
export function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Devuelve true si `value` no es un array con al menos un elemento.
 */
export const isArrayEmpty = (value: unknown) => ensureArray(value).length === 0;

/**
 * Encuentra un elemento en un array por su propiedad name
 */
export const findByName = <T extends { name: string }>(
  array: ReadonlyArray<T>,
  name: string,
): T | undefined => array.find((item) => item.name === name);
