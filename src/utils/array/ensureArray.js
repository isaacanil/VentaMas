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
