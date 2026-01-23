import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { DocumentData, QueryConstraint, QuerySnapshot, Unsubscribe } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { createReference, getDocFromRef } from '@/utils/refereceUtils';

type TimestampLike =
  | {
      seconds?: number;
    }
  | number;

type OrderFilters = {
  status?: string;
  condition?: string;
  providerId?: string;
};

export const convertFirestoreTimestamps = (
  dates: Record<string, TimestampLike | undefined>,
  fields: string[],
): void => {
  fields.forEach((field) => {
    const timestamp = dates[field]?.seconds;
    if (timestamp) dates[field] = timestamp * 1000;
  });
};

export const subscribeToOrder = (
  businessID: string,
  filters: OrderFilters | null | undefined,
  callback: (snapshot: QuerySnapshot<DocumentData>) => void,
): Unsubscribe => {
  const collectionRef = collection(db, 'businesses', businessID, 'orders');
  let q = collectionRef;

  if (filters) {
    const conditions: QueryConstraint[] = [];

    if (filters.status) {
      conditions.push(where('status', '==', filters.status));
    }
    if (filters.condition) {
      conditions.push(where('condition', '==', filters.condition));
    }
    if (filters.providerId) {
      conditions.push(where('provider', '==', filters.providerId));
    }

    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }
  }

  return onSnapshot(q, callback);
};

export const getProvider = async (
  businessID: string,
  providerId: string,
): Promise<Record<string, unknown>> => {
  if (!providerId) return {};
  const providerRef = createReference(
    ['businesses', businessID, 'providers'],
    providerId,
  );
  const providerDoc = await getDocFromRef(providerRef);
  return (providerDoc?.provider || {}) as Record<string, unknown>;
};

export const processOrder = async (
  data: Record<string, unknown> | undefined,
  businessID: string,
): Promise<Record<string, unknown>> => {
  const providerId = typeof data?.provider === 'string' ? data.provider : '';
  const provider = await getProvider(businessID, providerId);
  return { ...data, provider };
};
