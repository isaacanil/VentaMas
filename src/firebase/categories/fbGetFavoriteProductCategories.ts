import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { FavoriteCategoriesDocument } from './types';

type UserWithBusinessAndUid = UserIdentity & {
  businessID: string;
  uid: string;
};

/**
 * Establece un listener para las categorías favoritas de un usuario.
 *
 * @param {Object} user Objeto del usuario que contiene businessID y uid.
 * @param {Function} callback Función que se llama con las categorías favoritas cada vez que hay un cambio.
 * @returns {Function|null} La función unsubscribe para detener el listener o null si no se estableció.
 */
export const fbGetFavoriteProductCategories = (
  user: UserWithBusinessAndUid,
  callback: (favoriteCategoryIds: string[]) => void,
): Unsubscribe | null => {
  const { businessID, uid } = user;
  if (!businessID || !uid) {
    console.error(
      'No se han proporcionado los datos necesarios para establecer el listener',
    );
    return null; // Retorna null para indicar que no se estableció el listener
  }

  const favoriteCategoriesRef = doc<FavoriteCategoriesDocument>(
    db,
    'businesses',
    businessID,
    'users',
    uid,
    'productCategories',
    'favorite',
  );

  // Establece el listener y llama al callback con los datos cada vez que haya un cambio
  const unsubscribe = onSnapshot(
    favoriteCategoriesRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const favoriteCategories = Array.isArray(data.favoriteCategories)
          ? data.favoriteCategories.filter((id): id is string => typeof id === 'string')
          : [];
        callback(favoriteCategories); // Llama al callback con las categorías favoritas
      } else {
        callback([]); // Llama al callback con un arreglo vacío si el documento no existe
      }
    },
    (error) => {
      console.error('Error al escuchar las categorías favoritas: ', error);
    },
  );

  // Retorna la función unsubscribe para que pueda ser llamada para detener el listener cuando ya no sea necesario
  return unsubscribe;
};

export const useGetFavoriteProductCategories = () => {
  const user = useSelector(selectUser) as UserIdentity | null | undefined;
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    if (user?.businessID && user.uid) {
      unsubscribe = fbGetFavoriteProductCategories(
        user as UserWithBusinessAndUid,
        setFavoriteCategories,
      );
    }
    return () => {
      // Asegúrate de que unsubscribe sea una función antes de llamarla
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  return { favoriteCategories };
};
