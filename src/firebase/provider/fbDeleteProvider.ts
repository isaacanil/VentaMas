import { doc, deleteDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

export const fbDeleteProvider = async (
  id: string,
  user: UserWithBusiness | null | undefined,
): Promise<void> => {
  if (!user?.businessID) return;
  const providerRef = doc(db, 'businesses', user.businessID, 'providers', id);
  try {
    await deleteDoc(providerRef);
    // Deleting provider
  } catch (error) {
    console.error('Error deleting provider:', error);
  }
};
