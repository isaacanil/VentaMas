export function readLocalStorageBoolean(key: string): boolean | undefined;
export function readLocalStorageBoolean(
  key: string,
  fallback: boolean,
): boolean;
export function readLocalStorageBoolean(
  key: string,
  fallback?: boolean,
): boolean | undefined {
  if (typeof localStorage === 'undefined') return fallback;

  let storedValue: string | null;

  try {
    storedValue = localStorage.getItem(key);
  } catch {
    return fallback;
  }

  if (storedValue === null) return fallback;

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;

    return typeof parsedValue === 'boolean' ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}
