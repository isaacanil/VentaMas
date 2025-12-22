/**
 * Reemplaza los parámetros dinámicos (`:paramName`) en una ruta con valores proporcionados.
 *
 * @param {string} path - Ruta con parámetros dinámicos, por ejemplo: "/orders/:orderId/items/:itemId".
 * @param {...string|string[]} args - Valores para reemplazar los parámetros, en orden.
 *                                     Pueden pasarse como un array o argumentos individuales.
 *
 * @returns {string} La ruta con los parámetros reemplazados.
 *
 * @throws {Error} Si faltan valores para los parámetros.
 *
 * @example
 * // Usando un array:
 * const path = "/orders/:orderId/items/:itemId";
 * replacePathParams(path, ["123", "456"]); // "/orders/123/items/456"
 *
 * @example
 * // Usando argumentos:
 * replacePathParams(path, "123", "456"); // "/orders/123/items/456"
 *
 * @example
 * // Error por valores faltantes:
 * replacePathParams(path, "123"); // Error: Missing value for parameter "itemId".
 */
// Single signature using union to avoid redeclare lint issues
export function replacePathParams(
  path: string,
  valuesOrArg1: string[] | string,
  ...rest: string[]
): string {
  const values = Array.isArray(valuesOrArg1)
    ? valuesOrArg1
    : [valuesOrArg1, ...rest];
  const params = path.match(/\/:([a-zA-Z0-9_]+)/g) || [];

  if (params.length > values.length) {
    const missingParam = params[values.length];
    const missingName = missingParam ? missingParam.slice(2) : 'param';
    throw new Error(`Missing value for parameter "${missingName}".`);
  }

  let index = 0;
  return path.replace(/\/:[a-zA-Z0-9_]+/g, () => `/${values[index++]}`);
}
