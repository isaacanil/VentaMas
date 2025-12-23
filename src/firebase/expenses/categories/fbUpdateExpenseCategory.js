import { Timestamp, doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

const normalizeTimestamp = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Timestamp) return value;
  if (typeof value?.toMillis === 'function') {
    return Timestamp.fromMillis(value.toMillis());
  }
  if (typeof value === 'number') {
    return Timestamp.fromMillis(value);
  }
  if (typeof value?.seconds === 'number') {
    return Timestamp.fromMillis(value.seconds * 1000);
  }
  return null;
};

export const fbUpdateExpenseCategory = async (user, category) => {
  console.log(category);
  if (!user || !user.businessID) return false;

  try {
    category = {
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
      category.id,
    );

    await updateDoc(categoriesRef, { category });

    console.log('Category update successfully');
    return true;
  } catch (error) {
    console.error('Error updating category: ', error);
    return false;
  }
};
