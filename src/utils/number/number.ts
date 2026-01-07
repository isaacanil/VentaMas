// @ts-nocheck
export function formatNumber(input) {
  const inputAsString = String(input);
  // Elimina los ceros a la izquierda solo si están antes del punto decimal y no son el único dígito antes del punto
  const formattedString = inputAsString.replace(/^(0+)(\d)/, '$2');
  const result = Number(formattedString);
  return isNaN(result) ? 0 : result;
}

/**
 * Formatea un número agregando separadores de miles y decimales
 * @param {number} numb - El número a formatear
 * @returns {string} Número formateado con separadores de miles
 */
export const separator = (numb) => {
  const toNumber = Number(numb);
  if (isNaN(toNumber)) return 0;
  const n = toNumber.toFixed(2);
  const str = n.toString().split('.');
  str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return str.join('.');
};

/**
 * Elimina los ceros a la izquierda de un string numérico
 * @param {string|number} s - El valor a procesar
 * @returns {number} Número sin ceros a la izquierda
 */
export const quitarCeros = (s) => {
  const n = s.toString();
  return Number(n.replace(/^0+/, ''));
};

/**
 * Redondea un número a dos decimales
 * @param {number} n - El número a redondear
 * @returns {number} Número redondeado a 2 decimales
 */
export const roundToTwoDecimals = (n) => {
  return Math.round(n * 100) / 100;
};
