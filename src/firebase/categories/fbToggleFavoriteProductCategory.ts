import {
  arrayUnion,
  arrayRemove,
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { CategoryRecord, FavoriteCategoriesDocument } from './types';

type UserWithBusinessAndUid = UserIdentity & {
  businessID: string;
  uid: string;
};

export const fbToggleFavoriteProductCategory = async (
  user: UserWithBusinessAndUid,
  category: CategoryRecord,
): Promise<void> => {
  const { businessID, uid } = user;
  const categoryId = category?.id;

  if (!businessID || !uid) {
    return;
  }
  if (!categoryId) {
    return;
  }

  const favoriteProductCategoryRef = doc<FavoriteCategoriesDocument>(
    db,
    'businesses',
    businessID,
    'users',
    uid,
    'productCategories',
    'favorite',
  );

  try {
    const docSnapshot = await getDoc(favoriteProductCategoryRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const favoriteCategories = Array.isArray(data.favoriteCategories)
        ? data.favoriteCategories
        : [];

      if (favoriteCategories.includes(categoryId)) {
        // Si la categoría ya está en favoritos, la eliminamos
        await updateDoc(favoriteProductCategoryRef, {
          favoriteCategories: arrayRemove(categoryId),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Si no está, la añadimos
        await updateDoc(favoriteProductCategoryRef, {
          favoriteCategories: arrayUnion(categoryId),
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      // Si el documento no existe, lo creamos y añadimos la categoría
      await setDoc(favoriteProductCategoryRef, {
        favoriteCategories: [categoryId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error al alternar categoría favorita: ', error);
  }
};
