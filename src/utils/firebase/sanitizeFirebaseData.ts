import { Timestamp } from 'firebase/firestore';

type FirebasePrimitive = string | number | boolean | null | undefined;
type FirebasePassthrough = Timestamp;
type FirebaseInput =
  | FirebasePrimitive
  | FirebasePassthrough
  | FirebaseInput[]
  | Record<string, unknown>;

export type SanitizedFirebaseData<T> = T extends FirebasePassthrough
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? {
          [K in keyof T as K extends ''
            ? never
            : T[K] extends undefined | ''
              ? never
              : K]: SanitizedFirebaseData<Exclude<T[K], undefined | ''>>;
        }
      : T;

/**
 * Sanitiza datos para Firebase eliminando propiedades vacÃ­as, undefined o invÃ¡lidas
 * @param {Object} data - Objeto a sanitizar
 * @returns {Object} - Objeto sanitizado seguro para Firebase
 */
export const sanitizeFirebaseData = <T extends FirebaseInput>(
  data: T,
): SanitizedFirebaseData<T> => {
  // Mantener instancias especiales (Timestamp) sin modificaciones
  if (data instanceof Timestamp) {
    return data as SanitizedFirebaseData<T>;
  }

  // Si no es un objeto o es null, devolverlo sin cambios
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return data as SanitizedFirebaseData<T>;
  }

  const result: Record<string, unknown> = {};
  const objectData = data as Record<string, FirebaseInput>;

  // Recorrer todas las propiedades del objeto
  for (const key in objectData) {
    // Saltar propiedades heredadas
    if (!Object.prototype.hasOwnProperty.call(objectData, key)) continue;

    // Ignorar campos vacÃ­os o con valores invÃ¡lidos para Firebase
    if (objectData[key] === undefined || objectData[key] === '' || key === '')
      continue;

    // Preservar Timestamps
    if (objectData[key] instanceof Timestamp) {
      result[key] = objectData[key];
      continue;
    }

    // Recursivamente sanitizar objetos anidados
    if (typeof objectData[key] === 'object' && objectData[key] !== null) {
      const sanitized = sanitizeFirebaseData(objectData[key]);

      // Solo incluir el objeto si tiene propiedades despuÃ©s de sanitizar
      if (
        Object.keys(sanitized).length > 0 ||
        Array.isArray(objectData[key])
      ) {
        result[key] = sanitized;
      }
    } else {
      // AÃ±adir valores primitivos directamente
      result[key] = objectData[key];
    }
  }

  return result as SanitizedFirebaseData<T>;
};
