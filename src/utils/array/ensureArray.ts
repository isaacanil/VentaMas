// @ts-nocheck
/**
 * Asegura que el valor dado sea un array.
 * @param {*} value
 * @returns {Array}
 */
export const ensureArray = (value) => (Array.isArray(value) ? value : []);

/**
 * Devuelve true si `value` no es un array con al menos un elemento.
 * @param {*} value
 * @returns {boolean}
 */
export const isArrayEmpty = (value) => ensureArray(value).length === 0;

/**
 * Encuentra un elemento en un array por su propiedad name
 * @param {Array} array - Array donde buscar
 * @param {string} name - Nombre a buscar
 * @returns {*} El elemento encontrado o undefined
 */
export const findByName = (array, name) => {
  const data = array.find((item) => item.name === name);
  return data;
};
