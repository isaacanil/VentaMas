import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbRestoreExpenseCategory = async (user, categoryId) => {
  if (!user || !user?.businessID)
    throw new Error('no se encontró el id del negocio');
  if (!categoryId) throw new Error('no se encontró el id de la categoría');

  const categoriesRef = doc(
    db,
    'businesses',
    user.businessID,
    'expensesCategories',
    categoryId,
  );

  try {
    await updateDoc(categoriesRef, {
      'category.isDeleted': false,
      'category.deletedAt': null,
      'category.deletedBy': null,
    });
  } catch (error) {
    console.error('Error al restaurar la categoría de gastos:', error);
    throw error;
  }
};
