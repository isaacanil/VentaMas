import {
  collection,
  getDocs,
  writeBatch,
  doc,
  query,
  limit as firebaseLimit,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '../firebaseconfig';

/**
 * Transfiere categorías de productos de un negocio a otro.
 *
 * @param {string} businessIdA - ID del negocio de origen.
 * @param {string} businessIdB - ID del negocio de destino.
 */
export const transferProductCategories = async (
  businessIdA,
  businessIdB,
  limit = 0,
) => {
  const productCategoriesBusinessA = collection(
    db,
    `businesses/${businessIdA}/categories`,
  );
  const productCategoriesBusinessB = collection(
    db,
    `businesses/${businessIdB}/categories`,
  );

  const categoryQuery = query(productCategoriesBusinessA, firebaseLimit(limit));
  const categorySnapshot = await getDocs(categoryQuery);
  const totalCategories = categorySnapshot.docs.length;

  console.info(`Found ${totalCategories} categories to transfer`);

  const batch = writeBatch(db);
  categorySnapshot.docs.forEach((item) => {
    const category = item.data();
    const id = nanoid(12);
    const newCategoryRef = doc(productCategoriesBusinessB, id);
    batch.set(newCategoryRef, { ...category, id: id });
  });

  await batch.commit();
  console.info('Category transfer completed successfully');
};
