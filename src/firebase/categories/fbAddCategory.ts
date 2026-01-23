import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

import type { CategoryDocument, CategoryRecord } from './types';

export const fbAddCategory = async (
  user: UserWithBusiness | null | undefined,
  category: CategoryRecord,
): Promise<void> => {
  const businessID = user?.businessID;
  if (!businessID) {
    return;
  }

  const id = nanoid(10);
  const nextCategory: CategoryRecord = {
    ...category,
    id,
    createdAt: Timestamp.now(),
  };
  const categoryRef = doc<CategoryDocument>(
    db,
    'businesses',
    businessID,
    'categories',
    id,
  );
  await setDoc(categoryRef, { category: nextCategory }).catch((error) => {
    console.error(error);
  });
};
