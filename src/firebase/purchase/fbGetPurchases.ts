import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type {
  DocumentData,
  Query,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { createReference, getDocFromRef } from '@/utils/refereceUtils';

export const convertFirestoreTimestamps = (
  dates: Record<string, unknown>,
  fields: string[],
) => {
  const typedDates = dates as Record<string, { seconds?: number }>;
  fields.forEach((field) => {
    const timestamp = typedDates[field]?.seconds;
    if (timestamp) dates[field] = timestamp * 1000;
  });
};

export interface PurchaseFilters {
  status?: string;
  condition?: string;
  providerId?: string;
}

export const subscribeToPurchase = (
  businessID: string,
  filters: PurchaseFilters | null,
  callback: (snapshot: QuerySnapshot<DocumentData>) => void,
): Unsubscribe => {
  const collectionRef = collection(db, 'businesses', businessID, 'purchases');
  let q: Query<DocumentData> = collectionRef;

  if (filters) {
    const conditions = [] as ReturnType<typeof where>[];

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
  providerId?: string,
): Promise<Record<string, unknown>> => {
  if (!providerId) return {};
  const providerRef = createReference(
    ['businesses', businessID, 'providers'],
    providerId,
  );
  const providerDoc = (await getDocFromRef(providerRef)) as
    | { provider?: Record<string, unknown> }
    | null;
  return providerDoc?.provider || {};
};

export const processPurchase = async (
  data: Record<string, unknown>,
  businessID: string,
) => {
  const provider = await getProvider(businessID, data?.provider as string);
  return { ...data, provider };
};

