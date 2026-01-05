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
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';
import type { Shelf } from '@/models/Warehouse/Shelf';
import type { InventoryUser } from '@/utils/inventory/types';

type ShelfRecord = Partial<Shelf> & Record<string, unknown>;

// Obtener referencia de la colección de estantes de un almacén
const getShelfCollectionRef = (businessId) => {
  if (typeof businessId !== 'string' || !businessId) {
    console.error(
      'Invalid parameter passed to getShelfCollectionRef',
      businessId,
    );
    return;
  }
  return collection(db, 'businesses', businessId, 'shelves');
};

// Crear un nuevo estante
const createShelf = async (user, warehouseId, data) => {
  const id = nanoid();

  try {
    const shelfCollectionRef = getShelfCollectionRef(user.businessID);
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
const getShelves = async (user, warehouseId) => {
  try {
    const shelfCollectionRef = getShelfCollectionRef(user.businessID);
    const q = query(
      shelfCollectionRef,
      where('warehouseId', '==', warehouseId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error('Error al obtener estantes:', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los estantes de un almacén específico
const listenAllShelves = (user, warehouseId, callback, onError) => {
  const shelfCollectionRef = getShelfCollectionRef(user.businessID);
  const q = query(
    shelfCollectionRef,
    where('isDeleted', '==', false),
    where('warehouseId', '==', warehouseId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const shelves = snapshot.docs.map((doc) => doc.data());
      const order = shelves.sort((a, b) => a.createdAt - b.createdAt);
      callback(order);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    },
  );
};

// Actualizar un estante
const updateShelf = async (user, warehouseId, data) => {
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
const deleteShelf = async (user, id) => {
  try {
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

const useListenShelves = (warehouseId) => {
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
      return () => unsubscribe(); // Cleanup al desmontar
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
