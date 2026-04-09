import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableInstallment } from '@/utils/accountsReceivable/types';

// Function to get the last installment amount for a specific AR ID
export const getLastInstallmentAmountByArId = async (
  user: UserIdentity,
  arId: string,
): Promise<number | null> => {
  try {
    const installmentsRef = collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivableInstallments',
    );
    const q = query(
      installmentsRef,
      where('arId', '==', arId),
      where('isActive', '==', true),
      orderBy('installmentDate', 'asc'),
      limit(1),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const lastInstallment =
      querySnapshot.docs[0].data() as AccountsReceivableInstallment;
    return lastInstallment?.installmentBalance ?? null;
  } catch (error) {
    console.error('Error getting last installment amount by AR ID:', error);
    throw error;
  }
};
