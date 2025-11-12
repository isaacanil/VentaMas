import { query, getDocs, where, collection } from 'firebase/firestore';

import { db } from '../firebaseconfig';

export const fbLoadInvoicesForCashCount = async (user, cashCountID) => {
  if (!user.businessID || !cashCountID) return [];
  console.log('user.businessID', user.businessID);
  console.log('cashCountID', cashCountID);
  const invoicesRef = collection(db, 'businesses', user.businessID, 'invoices');

  const q = query(invoicesRef, where('data.cashCountId', '==', cashCountID));

  try {
    const invoiceSnap = await getDocs(q);
    return invoiceSnap.docs
      .map((doc) => doc.data())
      .filter((doc) => doc.data?.status !== 'cancelled')
      .sort((a, b) => {
        const timeA =
          typeof a.data.date.toMillis === 'function'
            ? a.data.date.toMillis()
            : new Date(a.data.date).getTime();
        const timeB =
          typeof b.data.date.toMillis === 'function'
            ? b.data.date.toMillis()
            : new Date(b.data.date).getTime();
        return timeB - timeA;
      });
  } catch (err) {
    console.error('Error al cargar facturas:', err);
    return [];
  }
};
