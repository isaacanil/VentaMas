import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

import type { CategoryDocument, CategoryRecord } from './types';

export const fbUpdateCategory = async (
  category: CategoryRecord,
  user: UserWithBusiness | null | undefined,
): Promise<void> => {
  if (!user?.businessID) {
    return console.warn('No tienes permisos para realizar esta acción');
  }
  if (!category?.id) {
    console.warn('CategorÃ­a invÃ¡lida para actualizar');
    return;
  }
  const { businessID } = user;
  const counterRef = doc<CategoryDocument>(
    db,
    'businesses',
    String(businessID),
    'categories',
    category.id,
  );
  try {
    updateDoc(counterRef, { category });
    // Category updated successfully
  } catch (err) {
    console.error('Error updating category:', err);
  }
};
