import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

/**
 * Escucha los cambios en un documento específico de Firestore y actualiza el estado en Redux.
 * @param {string} businessID - ID del negocio.
 * @param {string} productId - ID del producto.
 * @returns {Function} - Función de desuscripción para el listener.
 */
export const listenToProduct = (
  user: UserWithBusiness | null | undefined,
  productId: string,
  onData: (data: ProductRecord) => void,
  onError: (error: Error) => void,
): (() => void) | undefined => {
  if (!user?.businessID) return;
  const productRef = doc(
    db,
    'businesses',
    user.businessID,
    'products',
    productId,
  );

  const unsubscribe = onSnapshot(
    productRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as ProductRecord);
      } else {
        onError(new Error('El producto no existe'));
      }
    },
    (error) => {
      onError(error);
    },
  );

  // Retornar la función de desuscripción para poder llamarla cuando sea necesario
  return unsubscribe;
};
