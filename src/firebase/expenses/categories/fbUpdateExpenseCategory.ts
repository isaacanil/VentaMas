import { Timestamp, doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import { toTimestamp } from '@/utils/firebase/toTimestamp';
import type { ExpenseCategory } from '@/utils/expenses/types';

const normalizeTimestamp = (value: unknown): Timestamp | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Timestamp) return value;

  const converted = toTimestamp(value);
  return converted instanceof Timestamp ? converted : null;
};

export const fbUpdateExpenseCategory = async (
  user: UserIdentity | null | undefined,
  category: ExpenseCategory,
): Promise<boolean> => {
  console.log(category);
  if (!user?.businessID) return false;

  try {
    const categoryPayload: ExpenseCategory = {
      ...category,
      createdAt: normalizeTimestamp(category.createdAt) ?? Timestamp.now(),
      deletedAt: normalizeTimestamp(category.deletedAt),
      isDeleted: Boolean(category.isDeleted),
    };

    const categoriesRef = doc(
      db,
      'businesses',
      user.businessID,
      'expensesCategories',
      categoryPayload.id,
    );

    await updateDoc(categoriesRef, { category: categoryPayload });

    console.log('Category update successfully');
    return true;
  } catch (error) {
    console.error('Error updating category: ', error);
    return false;
  }
};
