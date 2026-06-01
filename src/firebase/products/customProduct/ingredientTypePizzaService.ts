import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export interface IngredientInput {
  id?: string | number;
  name?: string;
  cost?: number | string;
  [key: string]: unknown;
}

const INGREDIENT_TYPE_PIZZA_PRODUCT_ID = '6dssod';

const getIngredientTypePizzaRef = () =>
  doc(db, 'products', INGREDIENT_TYPE_PIZZA_PRODUCT_ID);

export const addIngredientTypePizza = async (
  ingredient: IngredientInput,
): Promise<void> => {
  try {
    await updateDoc(getIngredientTypePizzaRef(), {
      ingredientList: arrayUnion(ingredient),
    });
  } catch (error) {
    console.error('Error adding ingredient:', error);
  }
};

export const deleteIngredientTypePizza = async (
  ingredient: IngredientInput,
): Promise<void> => {
  try {
    await updateDoc(getIngredientTypePizzaRef(), {
      ingredientList: arrayRemove(ingredient),
    });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
  }
};
