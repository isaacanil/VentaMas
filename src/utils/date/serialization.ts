import { Timestamp } from 'firebase/firestore';
import { toMillis } from '@/utils/firebase/toTimestamp';
import type { TimestampLike } from '@/utils/date/types';

/**
 * Convierte cualquier fecha (Timestamp, Date, string ISO) a milisegundos (number).
 * Ideal para guardar fechas en Redux de forma serializable y precisa.
 * 
 * @param value - Valor de fecha (Timestamp, Date, string, number)
 * @returns number (milisegundos) o null si es inválido
 */
export const toSerializableDate = (value: TimestampLike | undefined): number | null => {
  return toMillis(value);
};

/**
 * Recorre un objeto y convierte recursivamente todas las instancias de Firestore Timestamp
 * a milisegundos (number).
 * 
 * Útil para normalizar payloads enteros desde Firebase antes de guardarlos en Redux.
 * 
 * @param obj - Objeto o array a serializar
 * @returns Copia del objeto con las fechas convertidas a números
 */
export const serializeDates = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Si es un Timestamp de Firestore, convertir directamente
  if (obj instanceof Timestamp) {
    return obj.toMillis() as unknown as T;
  }

  // Si es un array, mapear cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDates(item)) as unknown as T;
  }

  // Si es un objeto, recorrer sus claves
  const serialized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key];
      serialized[key] = serializeDates(value);
    }
  }

  return serialized as T;
};
