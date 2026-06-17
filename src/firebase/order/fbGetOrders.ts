import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type {
  DocumentData,
  Query,
  QueryConstraint,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { getProviderPayloadById } from '@/firebase/provider/providerLookup';
import { normalizeOrderRecord } from '@/utils/order/status';

type OrderFilters = {
  status?: string;
  condition?: string;
  providerId?: string;
};

export const subscribeToOrder = (
  businessID: string,
  filters: OrderFilters | null | undefined,
  callback: (snapshot: QuerySnapshot<DocumentData>) => void,
): Unsubscribe => {
  const collectionRef = collection(db, 'businesses', businessID, 'orders');
  let q: Query<DocumentData> = collectionRef;

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

export const processOrder = async (
  data: Record<string, unknown> | undefined,
  businessID: string,
  orderId?: string,
): Promise<Record<string, unknown>> => {
  const normalizedOrder = normalizeOrderRecord(data, orderId);
  const providerId =
    typeof normalizedOrder?.provider === 'string'
      ? normalizedOrder.provider
      : '';
  const provider = await getProviderPayloadById(businessID, providerId);
  return { ...normalizedOrder, provider };
};
