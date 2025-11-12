// src/utils/accountsReceivableUtils.js
import { format as formatDateFn } from 'date-fns';

/**
 * Formatea un timestamp a string local.
 *
 * @param {number|null} timestamp - Milisegundos desde epoch
 * @param {string} [fmt='dd/MM/yyyy'] - Formato date-fns
 * @returns {string}
 */
export function formatPaymentDate(timestamp, fmt = 'dd/MM/yyyy') {
  if (!timestamp) return '';
  return formatDateFn(new Date(timestamp), fmt);
}

/**
 * Devuelve un array de strings formateados.
 *
 * @param {Array<number>} dates - Timestamps
 * @param {string} [fmt='dd/MM/yyyy']
 * @returns {Array<string>}
 */
export function getFormattedDates(dates, fmt = 'dd/MM/yyyy') {
  return Array.isArray(dates)
    ? dates.map((ts) => formatPaymentDate(ts, fmt))
    : [];
}
