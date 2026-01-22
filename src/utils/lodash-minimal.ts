/**
 * Minimal debounce implementation to replace lodash.debounce
 */
type Debounced<T extends (...args: unknown[]) => unknown> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): Debounced<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const debounced: Debounced<T> = (...args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  return debounced;
};

/**
 * Minimal deep equal implementation to replace lodash.isEqual
 */
export const isEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false;
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !isEqual(objA[key], objB[key])
    ) {
      return false;
    }
  }

  return true;
};
