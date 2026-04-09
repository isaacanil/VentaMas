import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type {
  DocumentData,
  Query,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export interface VendorBillFilters {
  condition?: string | null;
  providerId?: string | null;
}

export const subscribeToVendorBills = (
  businessID: string,
  filters: VendorBillFilters | null,
  callback: (snapshot: QuerySnapshot<DocumentData>) => void,
): Unsubscribe => {
  const collectionRef = collection(db, 'businesses', businessID, 'vendorBills');
  let q: Query<DocumentData> = collectionRef;

  if (filters) {
    const conditions = [] as ReturnType<typeof where>[];

    if (filters.condition) {
      conditions.push(where('paymentTerms.condition', '==', filters.condition));
    }
    if (filters.providerId) {
      conditions.push(where('supplierId', '==', filters.providerId));
    }

    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }
  }

  return onSnapshot(q, callback);
};
