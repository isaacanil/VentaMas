export const compareClientCartByJSON = (
  obj1: unknown,
  obj2: unknown,
): boolean => {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  const obj1Record = obj1 as Record<string, unknown>;
  const obj2Record = obj2 as Record<string, unknown>;

  if (!Object.keys(obj1Record).length || !Object.keys(obj2Record).length) {
    return false;
  }

  return JSON.stringify(obj1Record) === JSON.stringify(obj2Record);
};
