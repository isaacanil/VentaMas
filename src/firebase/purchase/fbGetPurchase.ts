import { doc, onSnapshot } from 'firebase/firestore';
import type { DocumentData, DocumentSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';

export const subscribeSinglePurchase = (
  businessID: string,
  purchaseId: string,
  callback: (snapshot: DocumentSnapshot<DocumentData>) => void,
): Unsubscribe => {
  const docRef = doc(db, 'businesses', businessID, 'purchases', purchaseId);
  return onSnapshot(docRef, callback);
};

