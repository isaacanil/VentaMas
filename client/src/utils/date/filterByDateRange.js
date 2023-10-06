import { DateTime } from "luxon";

/**
 * Filtra un arreglo basado en un rango de fechas.
 * 
 * @param {Array} array - El arreglo a filtrar.
 * @param {string} startDate - La fecha de inicio en formato ISO.
 * @param {string} endDate - La fecha de fin en formato ISO.
 * @param {string} dateKey - La clave en los objetos del arreglo que contiene la fecha.
 * @returns {Array} - El arreglo filtrado.
 */
const filterByDateRange = (array, startDate, endDate, dateKey) => {
  // const start = DateTime.fromISO(startDate);
  // const end = DateTime.fromISO(endDate);

  return array.filter(item => {
    const itemDate = item[dateKey];
    return itemDate >= startDate && itemDate <= endDate;
  });
}

export default filterByDateRange;
