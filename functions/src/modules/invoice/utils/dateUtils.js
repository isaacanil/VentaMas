// functions/src/modules/invoice/utils/dateUtils.js
import * as admin from 'firebase-admin';

/**
 * Convierte una marca de tiempo en milisegundos a un Timestamp de Firestore
 * @param {number} milliseconds - Marca de tiempo en milisegundos
 * @returns {admin.firestore.Timestamp} Timestamp de Firestore
 */
export function millisecondsToTimestamp(milliseconds) {
  if (!milliseconds) return null;
  return admin.firestore.Timestamp.fromMillis(milliseconds);
}

/**
 * Obtiene la marca de tiempo actual como Timestamp de Firestore
 * @returns {admin.firestore.Timestamp} Timestamp actual
 */
export function getCurrentTimestamp() {
  return admin.firestore.Timestamp.now();
}

/**
 * Añade información de fecha de vencimiento al objeto
 * @param {Object} object - Objeto al que añadir la fecha
 * @param {number} dueDate - Fecha de vencimiento en milisegundos
 * @returns {Object} Objeto con fecha de vencimiento añadida
 */
export function addDueDate(object, dueDate) {
  if (!dueDate) return object;

  const date = millisecondsToTimestamp(dueDate);

  return {
    ...object,
    dueDate: date,
    hasDueDate: true,
  };
}
