import {
  collection,
  writeBatch,
  doc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { UserWithBusiness } from '@/types/users';

type ProductWithActiveIngredients = {
  activeIngredients?: string | null;
} & Record<string, unknown>;

// Función para agregar ingredientes activos desde un arreglo de productos
export const fbAddActiveIngredients = async (
  user: UserWithBusiness,
  products: ProductWithActiveIngredients[],
): Promise<void> => {
  const activeIngredientsCollection = collection(
    db,
    'businesses',
    user.businessID,
    'activeIngredients',
  );

  try {
    // Obtener ingredientes activos existentes
    const existingActiveIngredientsSnapshot = await getDocs(
      activeIngredientsCollection,
    );
    const existingActiveIngredientsByName = new Map<
      string,
      {
        docSnapshot: QueryDocumentSnapshot<DocumentData>;
        data: DocumentData;
      }
    >();
    existingActiveIngredientsSnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const nameLowerCase = data.name?.toLowerCase();
      if (nameLowerCase) {
        existingActiveIngredientsByName.set(nameLowerCase, {
          docSnapshot,
          data,
        });
      }
    });

    const batch = writeBatch(db);
    let operationCount = 0;

    // Crear un conjunto único de ingredientes activos desde los productos
    const uniqueIngredients = new Set<string>();
    products.forEach((product) => {
      if (product.activeIngredients) {
        // Dividir ingredientes activos si son cadenas separadas por comas
        const ingredients = product.activeIngredients
          .split(',')
          .map((i) => i.trim());
        ingredients.forEach((ingredient) => uniqueIngredients.add(ingredient));
      }
    });

    // Procesar los ingredientes activos únicos
    for (const ingredient of uniqueIngredients) {
      const ingredientNameLowerCase = ingredient.toLowerCase();
      const existingIngredient = existingActiveIngredientsByName.get(
        ingredientNameLowerCase,
      );
      if (!existingIngredient) {
        const ingredientDocRef = doc(activeIngredientsCollection);
        const activeIngredient = {
          id: ingredientDocRef.id,
          name: ingredient,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.set(ingredientDocRef, activeIngredient);
        operationCount++;
      } else {
        // Actualizar el campo updatedAt del ingrediente existente
        batch.update(existingIngredient.docSnapshot.ref, {
          updatedAt: serverTimestamp(),
        });
        operationCount++;
      }
    } // Confirmar el batch
    if (operationCount > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Error al procesar los ingredientes activos:', error);
  }
};
