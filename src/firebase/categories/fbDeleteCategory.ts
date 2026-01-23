import { deleteDoc, doc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

export const fbDeleteCategory = async (
  user: UserWithBusiness | null | undefined,
  id: string,
): Promise<void> => {
  if (!user?.businessID) return;

  const { businessID } = user;
  const categoryRef = doc(db, 'businesses', businessID, 'categories', id);
  try {
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error(error);
  }
};
