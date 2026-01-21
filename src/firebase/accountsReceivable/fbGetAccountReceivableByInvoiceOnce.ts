import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbGetAccountReceivableByInvoiceOnce = async (
  businessId?: string | null,
  invoiceId?: string | null,
) => {
  if (!businessId || !invoiceId) return [];

  const accountsRef = collection(
    db,
    'businesses',
    businessId,
    'accountsReceivable',
  );
  const q = query(accountsRef, where('invoiceId', '==', invoiceId));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
