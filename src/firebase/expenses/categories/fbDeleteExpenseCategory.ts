import { Timestamp, doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

/**
 * Marca una categoría de gastos como eliminada (soft delete) en Firebase.
 *
 * @param categoryId - El ID de la categoría que se desea eliminar.
 * @returns Retorna una promesa que indica si la operación fue exitosa o no.
 */
export const fbDeleteExpenseCategory = async (
  user: UserIdentity | null | undefined,
  categoryId: string,
): Promise<void> => {
  if (!user?.businessID) throw new Error('no se encontró el id del negocio');
  if (!categoryId) throw new Error('no se encontró el id de la categoría');

  const counterRef = doc(
    db,
    'businesses',
    user.businessID,
    'expensesCategories',
    categoryId,
  );

  try {
    await updateDoc(counterRef, {
      'category.isDeleted': true,
      'category.deletedAt': Timestamp.now(),
      'category.deletedBy': user?.uid ?? null,
    });
  } catch (err) {
    console.log(err);
    throw new Error(String(err));
  }
};
