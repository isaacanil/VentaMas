import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';

export const fbAddExpenseCategory = async (user, category) => {
  if (!user || !user.businessID) return false;

  try {
    category = {
      ...category,
      createdAt: Timestamp.now(),
      id: nanoid(12),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };
    const categoriesRef = doc(
      db,
      'businesses',
      user.businessID,
      'expensesCategories',
      category.id,
    );

    await setDoc(categoriesRef, { category });

    console.log('Category added to expense successfully');

    return true;
  } catch (error) {
    console.error('Error adding category to expense: ', error);

    return false;
  }
};
