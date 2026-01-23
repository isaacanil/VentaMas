import { doc, onSnapshot } from 'firebase/firestore';
import type { DocumentData, DocumentSnapshot, Unsubscribe } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const subscribeSingleOrder = (
  businessID: string,
  orderId: string,
  callback: (snapshot: DocumentSnapshot<DocumentData>) => void,
): Unsubscribe => {
  const docRef = doc(db, 'businesses', businessID, 'orders', orderId);
  return onSnapshot(docRef, callback);
};
