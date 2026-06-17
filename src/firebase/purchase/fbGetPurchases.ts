import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type {
  DocumentData,
  Query,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { getProviderPayloadById } from '@/firebase/provider/providerLookup';
import { enrichPurchaseWorkflow } from '@/utils/purchase/workflow';

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

export const processPurchase = async (
  data: Record<string, unknown>,
  businessID: string,
) => {
  const provider = await getProviderPayloadById(
    businessID,
    data?.provider as string,
  );
  return enrichPurchaseWorkflow({ ...data, provider });
};
