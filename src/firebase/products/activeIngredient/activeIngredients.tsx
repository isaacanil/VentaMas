import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useEffect, useReducer } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { ActiveIngredient } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

// Hook para escuchar los ingredientes activos
export const useListenActiveIngredients = () => {
  const [state, dispatch] = useReducer(
    (
      currentState: {
        data: ActiveIngredient[];
        loading: boolean;
        error: unknown | null;
      },
      action:
        | { type: 'start' }
        | { type: 'success'; payload: ActiveIngredient[] }
        | { type: 'error'; payload: unknown },
    ) => {
      switch (action.type) {
        case 'start':
          return {
            ...currentState,
            loading: true,
            error: null,
          };
        case 'success':
          return {
            data: action.payload,
            loading: false,
            error: null,
          };
        case 'error':
          return {
            ...currentState,
            loading: false,
            error: action.payload,
          };
        default:
          return currentState;
      }
    },
    {
      data: [],
      loading: false,
      error: null,
    },
  );
  const user = useSelector(selectUser) as UserWithBusiness | null | undefined;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const fetchData = async () => {
      try {
        if (!user) return;
        dispatch({ type: 'start' });
        unsubscribe = await listenActiveIngredients(user, (items) => {
          dispatch({ type: 'success', payload: items });
        });
      } catch (error) {
        dispatch({ type: 'error', payload: error });
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return state;
};

const listenActiveIngredients = (
  user: UserWithBusiness,
  setData: (items: ActiveIngredient[]) => void,
): (() => void) => {
  const query = collection(
    db,
    `businesses/${user.businessID}/activeIngredients`,
  );
  const unsubscribe = onSnapshot(query, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data() as ActiveIngredient);
    setData(data);
  });

  return unsubscribe;
};

// Función para agregar un ingrediente activo
export const fbAddActiveIngredient = async (
  user: UserWithBusiness,
  data: Omit<ActiveIngredient, 'id'>,
): Promise<void> => {
  try {
    const newData = {
      ...data,
      id: nanoid(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    // Uso de 'doc' en lugar de 'collection'
    const activeIngredientRef = doc(
      db,
      `businesses/${user.businessID}/activeIngredients/${newData.id}`,
    );
    await setDoc(activeIngredientRef, newData);
    console.log('Ingrediente activo añadido con éxito:', newData.id);
  } catch (error) {
    console.error('Error al agregar el ingrediente activo:', error);
  }
};

// Función para actualizar un ingrediente activo
export const fbUpdateActiveIngredient = async (
  user: UserWithBusiness,
  data: ActiveIngredient,
): Promise<void> => {
  try {
    // Uso de 'doc' en lugar de 'collection'
    const activeIngredientRef = doc(
      db,
      `businesses/${user.businessID}/activeIngredients/${data.id}`,
    );
    await updateDoc(activeIngredientRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    console.log('Ingrediente activo actualizado:', data.id);
  } catch (error) {
    console.error('Error al actualizar el ingrediente activo:', error);
  }
};
