import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser, type InvoiceDoc } from './types';

// Function to get preorders from Firebase
export async function fbGetPreorders(
  user: UserIdentity | null | undefined,
  callback: (preorders: InvoiceDoc[]) => void,
): Promise<(() => void) | undefined> {
  try {
    if (!isInvoiceUser(user)) return undefined;
    const preordersCollection = collection(
      db,
      'businesses',
      user.businessID,
      'invoices',
    );
    const q = query(
      preordersCollection,
      where('data.status', '==', 'pending'),
      where('data.preorderDetails.isOrWasPreorder', '==', true),
      orderBy('data.preorderDetails.date', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const preordersList = snapshot.docs.map((doc) => doc.data() as InvoiceDoc);
      callback(preordersList);
    });

    // Retorna la función para desuscribirse del listener
    return unsubscribe;
  } catch (error) {
    console.error('Error fetching preorders: ', error);
    return undefined;
  }
}
