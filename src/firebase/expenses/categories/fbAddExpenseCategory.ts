import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { ExpenseCategory } from '@/utils/expenses/types';

export const fbAddExpenseCategory = async (
  user: UserIdentity | null | undefined,
  category: ExpenseCategory,
): Promise<boolean> => {
  if (!user?.businessID) return false;

  try {
    const categoryPayload: ExpenseCategory = {
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
      categoryPayload.id,
    );

    await setDoc(categoriesRef, { category: categoryPayload });

    console.log('Category added to expense successfully');

    return true;
  } catch (error) {
    console.error('Error adding category to expense: ', error);

    return false;
  }
};
