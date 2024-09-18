// src/utils/dateUtils.js

import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';

/**
 * Convierte un objeto Day.js a un timestamp en milisegundos.
 * @param {Object} dateObj - Objeto Day.js a convertir.
 * @returns {number|null} - Timestamp en milisegundos o null si el input es inválido.
 */

export const dayjsToMillis = (dateObj) => {
  return dateObj ? dateObj.valueOf() : null;
};

export  const dayjsToTimestamp = (dateObj) => {
    return dateObj ? Timestamp.fromMillis(dateObj.valueOf()) : null;
    }

export  const millisToTimestamp = (millis) => {
    return millis ? Timestamp.fromMillis(millis).toISOString() : null;
    }

/**
 * Convierte un timestamp en milisegundos a un objeto Day.js.
 * @param {number} timestamp - Timestamp en milisegundos a convertir.
 * @returns {Object|null} - Objeto Day.js o null si el input es inválido.
 */
export const timestampToDayjs = (timestamp) => {
  return timestamp?.seconds ? dayjs(timestamp?.seconds * 1000) : null;
};

export const convertDayjs = {
    dayjsToMillis,
    millisToTimestamp,
    dayjsToTimestamp,
    timestampToDayjs
}