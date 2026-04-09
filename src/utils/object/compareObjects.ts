/**
 * Verifica si un valor es un objeto plano
 * @param {*} obj - Valor a verificar
 * @returns {boolean} - true si es un objeto plano
 */
export const isObject = (obj: unknown): obj is Record<string, unknown> => {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * Compara dos objetos de forma profunda (deep comparison)
 * @param {*} obj1 - Primer objeto a comparar
 * @param {*} obj2 - Segundo objeto a comparar
 * @returns {boolean} - true si son iguales, false si no
 */
export function compareObjects(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const obj1Record = obj1 as Record<string, unknown>;
  const obj2Record = obj2 as Record<string, unknown>;
  const obj1Keys = Object.keys(obj1Record);
  const obj2Keys = Object.keys(obj2Record);

  if (obj1Keys.length !== obj2Keys.length) return false;

  for (const key of obj1Keys) {
    if (!obj2Keys.includes(key)) return false;
    if (!compareObjects(obj1Record[key], obj2Record[key])) return false;
  }

  return true;
}

/**
 * Compara dos objetos usando JSON.stringify
 * Útil para comparaciones rápidas pero menos precisa que compareObjects
 * @param {object} obj1 - Primer objeto a comparar
 * @param {object} obj2 - Segundo objeto a comparar
 * @returns {boolean} - true si son iguales, false si no
 */
export const compareObjectsByJSON = (obj1: unknown, obj2: unknown): boolean => {
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
