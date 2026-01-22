import { doc, onSnapshot, Timestamp, type Unsubscribe } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export type BusinessInfoData = Record<string, unknown>;

type BusinessInfoHandler = (business: BusinessInfoData | null) => void;

type ErrorHandler = (error: unknown) => void;

/**
 * Subscribes to real-time updates of a business document in Firestore.
 */
export const subscribeToBusinessInfo = (
  businessID: string,
  onNext: BusinessInfoHandler,
  onError: ErrorHandler = console.error,
): Unsubscribe | undefined => {
  if (typeof businessID !== 'string' || !businessID.trim()) {
    console.warn('subscribeToBusinessInfo: businessID invalido');
    return undefined;
  }
  if (typeof onNext !== 'function') {
    console.warn('subscribeToBusinessInfo: onNext no es una funcion');
    return undefined;
  }

  const businessRef = doc(db, 'businesses', businessID);

  const sanitizeTimestamps = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (value instanceof Timestamp) {
      return value.toMillis();
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeTimestamps);
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return Object.entries(record).reduce<Record<string, unknown>>(
        (acc, [key, entryValue]) => {
          acc[key] = sanitizeTimestamps(entryValue);
          return acc;
        },
        {},
      );
    }
    return value;
  };

  const unsubscribe = onSnapshot(
    businessRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        console.info(`Negocio ${businessID} no encontrado.`);
        onNext(null);
        return;
      }
      const business = (snapshot.get('business') ?? null) as BusinessInfoData | null;

      onNext(sanitizeTimestamps(business) as BusinessInfoData | null);
    },
    (err) => {
      onError(err);
      onNext(null);
    },
  );

  return unsubscribe;
};
