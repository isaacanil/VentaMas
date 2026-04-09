import {
  doc,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export type BusinessInfoData = Record<string, unknown>;

type BusinessInfoHandler = (business: BusinessInfoData | null) => void;

type ErrorHandler = (error: unknown) => void;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveBusinessPayload = (snapshotData: unknown): BusinessInfoData | null => {
  const root = isRecord(snapshotData) ? snapshotData : null;
  if (!root) return null;

  const businessNode = isRecord(root.business) ? root.business : null;
  const nestedBusinessNode =
    businessNode && isRecord(businessNode.business)
      ? businessNode.business
      : null;

  const merged: BusinessInfoData = {
    ...root,
    ...(businessNode || {}),
    ...(nestedBusinessNode || {}),
  };

  // Normaliza el nombre para no caer en fallback cuando existe en algún nivel.
  const resolvedName =
    toCleanString(merged.name) ||
    toCleanString((businessNode || {}).name) ||
    toCleanString((nestedBusinessNode || {}).name) ||
    null;

  if (resolvedName) {
    merged.name = resolvedName;
  }

  return merged;
};

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
      const business = resolveBusinessPayload(snapshot.data());

      onNext(sanitizeTimestamps(business) as BusinessInfoData | null);
    },
    (err) => {
      onError(err);
      // Mantener el ultimo valor conocido; el consumer decide como reaccionar.
    },
  );

  return unsubscribe;
};
