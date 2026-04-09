import { nanoid } from '@reduxjs/toolkit';
import {
  collection,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import type {
  CollectionReference,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';
import type {
  InventoryUser,
  ShelfRecord,
  TimestampLike,
} from '@/utils/inventory/types';

const toMillis = (value?: TimestampLike): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') {
      return value.toDate()?.getTime?.() ?? 0;
    }
    if (typeof value.seconds === 'number') return value.seconds * 1000;
  }
  return 0;
};

// Obtener referencia de la colección de estantes de un almacén
const getShelfCollectionRef = (
  businessId?: string | null,
): CollectionReference<DocumentData> | null => {
  if (typeof businessId !== 'string' || !businessId) {
    console.error(
      'Invalid parameter passed to getShelfCollectionRef',
      businessId,
    );
    return null;
  }
  return collection(db, 'businesses', businessId, 'shelves');
};

// Crear un nuevo estante
const createShelf = async (
  user: InventoryUser,
  warehouseId: string,
  data: ShelfRecord,
) => {
  const id = nanoid();

  try {
    const shelfCollectionRef = getShelfCollectionRef(user.businessID);
    if (!shelfCollectionRef)
      throw new Error('Could not get collection reference');
    const shelfDocRef = doc(shelfCollectionRef, id);

    await setDoc(shelfDocRef, {
      ...data,
      id,
      warehouseId,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    return data;
  } catch (error) {
    console.error('Error al añadir el documento: ', error);
    throw error;
  }
};

// Leer todos los estantes de un almacén específico
const getShelves = async (
  user: InventoryUser,
  warehouseId: string,
): Promise<ShelfRecord[]> => {
  try {
    const shelfCollectionRef = getShelfCollectionRef(user.businessID);
    if (!shelfCollectionRef) return [];
    const q = query(
      shelfCollectionRef,
      where('warehouseId', '==', warehouseId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as ShelfRecord);
  } catch (error) {
    console.error('Error al obtener estantes:', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los estantes de un almacén específico
const listenAllShelves = (
  user: InventoryUser,
  warehouseId: string,
  callback: (data: ShelfRecord[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe | undefined => {
  const shelfCollectionRef = getShelfCollectionRef(user.businessID);
  if (!shelfCollectionRef) return undefined;
  const q = query(
    shelfCollectionRef,
    where('isDeleted', '==', false),
    where('warehouseId', '==', warehouseId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const shelves = snapshot.docs.map(
        (docSnap) => docSnap.data() as ShelfRecord,
      );
      const ordered = shelves
        .slice()
        .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
      callback(ordered);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    },
  );
};

// Actualizar un estante
const updateShelf = async (
  user: InventoryUser,
  warehouseId: string,
  data: ShelfRecord & { id?: string },
) => {
  try {
    if (!user?.businessID || !data?.id) {
      throw new Error('Missing required parameters for shelf update');
    }
    const shelfDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'shelves',
      data.id,
    );
    await updateDoc(shelfDocRef, {
      ...data,
      warehouseId, // Asegurarnos de mantener la referencia al almacén
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return data;
  } catch (error) {
    console.error('Error al actualizar el documento: ', error);
    throw error;
  }
};

// Marcar un estante como eliminado
const deleteShelf = async (user: InventoryUser, id: string) => {
  try {
    if (!user.businessID) throw new Error('businessID is required');
    const shelfDocRef = doc(db, 'businesses', user.businessID, 'shelves', id);
    await updateDoc(shelfDocRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: user.uid,
    });
    return id;
  } catch (error) {
    console.error('Error al marcar el documento como eliminado: ', error);
    throw error;
  }
};

const useListenShelves = (warehouseId: string | null) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const [data, setData] = useState<ShelfRecord[]>([]);
  const [loading, setLoading] = useState(() => Boolean(warehouseId));
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (warehouseId && user?.businessID) {
      const unsubscribe = listenAllShelves(
        user,
        warehouseId,
        (data) => {
          setData(data);
          setLoading(false);
        },
        (error) => {
          setError(error);
          setLoading(false);
        },
      );
      return () => unsubscribe?.(); // Cleanup al desmontar
    }
  }, [warehouseId, user]);

  return { data, loading, error };
};

export {
  createShelf,
  getShelves,
  listenAllShelves,
  updateShelf,
  deleteShelf,
  useListenShelves, // Ensure this is only exported once
};
