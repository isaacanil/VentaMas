/**
 * Verifica si un valor es un objeto plano
 * @param {*} obj - Valor a verificar
 * @returns {boolean} - true si es un objeto plano
 */
export const isObject = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * Compara dos objetos de forma profunda (deep comparison)
 * @param {*} obj1 - Primer objeto a comparar
 * @param {*} obj2 - Segundo objeto a comparar
 * @returns {boolean} - true si son iguales, false si no
 */
export function compareObjects(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);

  if (obj1Keys.length !== obj2Keys.length) return false;

  for (const key of obj1Keys) {
    if (!obj2Keys.includes(key)) return false;
    if (!compareObjects(obj1[key], obj2[key])) return false;
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
export const compareObjectsByJSON = (obj1, obj2) => {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  
  if (!Object.keys(obj1).length || !Object.keys(obj2).length) {
    return false;
  }

  return JSON.stringify(obj1) === JSON.stringify(obj2);
};
