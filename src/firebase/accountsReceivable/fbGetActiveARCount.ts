import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export async function fbGetActiveARCount(
  businessID: string | null | undefined,
  clientId: string | null | undefined,
): Promise<number> {
  if (!businessID || !clientId) return 0;
  const accountsReceivableRef = collection(
    db,
    `businesses/${businessID}/accountsReceivable`,
  );

  const q = query(
    accountsReceivableRef,
    where('clientId', '==', clientId),
    where('isActive', '==', true), // Aseguramos que solo se consideren las cuentas activas
  );

  try {
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return 0;
    }

    let activeAccountsCount = 0;

    querySnapshot.forEach(() => {
      activeAccountsCount++;
    });

    return activeAccountsCount;
  } catch (error) {
    console.error('Error getting documents: ', error);
    throw new Error('Error getting documents');
  }
}
