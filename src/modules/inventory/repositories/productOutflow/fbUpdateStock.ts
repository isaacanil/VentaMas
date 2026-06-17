import { doc, increment, writeBatch } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type StockUpdate = {
  product: ProductRecord;
  quantityRemoved: number;
};

export const fbUpdateStock = async (
  user: UserWithBusiness | null | undefined,
  updates: StockUpdate[],
): Promise<void> => {
  if (!user?.businessID || !Array.isArray(updates) || updates.length === 0)
    return;

  // Usando writeBatch para optimizar las escrituras en Firestore
  const batch = writeBatch(db);

  updates.forEach((update) => {
    const id = update.product?.id;
    if (!id) return; // Continúa con el siguiente si no hay ID

    const miDocRef = doc(db, 'businesses', user.businessID, 'products', id);
    const quantity = update.quantityRemoved;
    // Updating stock quantity
    if (quantity) {
      // Aquí suponemos que `increment` es una función válida previamente definida/importada
      // que correctamente crea un objeto de incremento para Firestore.
      batch.update(miDocRef, { stock: increment(Number(quantity)) });
    }
  });

  // Ejecuta todas las actualizaciones en batch
  try {
    await batch.commit();
    console.info('All inventory updates applied successfully');
  } catch (error) {
    console.error('Error al actualizar el inventario:', error);
  }
};
