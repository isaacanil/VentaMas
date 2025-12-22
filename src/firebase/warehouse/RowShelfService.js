import { nanoid } from '@reduxjs/toolkit';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

// Obtener referencia de la colección de filas de un estante
const getRowShelfCollectionRef = (businessId) => {
  return collection(db, 'businesses', businessId, 'rows');
};

// Crear una nueva fila de estante
const createRowShelf = async (user, warehouseId, shelfId, rowShelfData) => {
  const id = nanoid();
  try {
    const rowShelfCollectionRef = getRowShelfCollectionRef(user.businessID);
    const rowShelfDocRef = doc(rowShelfCollectionRef, id);

    await setDoc(rowShelfDocRef, {
      ...rowShelfData,
      id,
      shelfId,
      warehouseId,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    return { ...rowShelfData, id };
  } catch (error) {
    console.error('Error al añadir el documento: ', error);
    throw error;
  }
};

// Obtener todas las filas de un estante específico
const getAllRowShelves = async (user, warehouseId, shelfId) => {
  try {
    const rowShelfCollectionRef = getRowShelfCollectionRef(user.businessID);
    const q = query(
      rowShelfCollectionRef,
      where('warehouseId', '==', warehouseId),
      where('shelfId', '==', shelfId),
    );
    const querySnapshot = await getDocs(q);
    const rows = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return rows;
  } catch (error) {
    console.error('Error al leer los documentos: ', error);
    throw error;
  }
};

// Escuchar en tiempo real todas las filas de un estante específico
const listenAllRowShelves = (user, warehouseId, shelfId, callback, onError) => {
  try {
    const rowShelfCollectionRef = getRowShelfCollectionRef(user.businessID);
    const q = query(
      rowShelfCollectionRef,
      where('warehouseId', '==', warehouseId),
      where('shelfId', '==', shelfId),
      where('isDeleted', '==', false),
    );
    return onSnapshot(
      q,
      (querySnapshot) => {
        const rows = querySnapshot.docs.map((doc) => doc.data());
        callback(rows);
      },
      (error) => {
        console.error('Error al escuchar documentos en tiempo real: ', error);
        onError && onError(error);
      },
    );
  } catch (error) {
    console.error('Error al escuchar documentos en tiempo real: ', error);
    throw error;
  }
};

// Actualizar una fila de estante específica
const updateRowShelf = async (
  user,
  warehouseId,
  shelfId,
  rowId,
  updatedData,
) => {
  try {
    const rowShelfDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'rows',
      rowId,
    );
    await updateDoc(rowShelfDocRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return { id: rowId, ...updatedData };
  } catch (error) {
    console.error('Error al actualizar el documento: ', error);
    throw error;
  }
};

// Marcar una fila de estante como eliminada
const deleteRowShelf = async (user, warehouseId, shelfId, rowId) => {
  try {
    const rowShelfDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'rows',
      rowId,
    );
    await updateDoc(rowShelfDocRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: user.uid,
    });
    return rowId;
  } catch (error) {
    console.error('Error al marcar el documento como eliminado: ', error);
    throw error;
  }
};

const useListenRowShelves = (warehouseId, shelfId) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(
    () => Boolean(warehouseId && shelfId),
  );
  const [error, setError] = useState(null);
  useEffect(() => {
    if (warehouseId && shelfId && user?.businessID) {
      const unsubscribe = listenAllRowShelves(
        user,
        warehouseId,
        shelfId,
        (data) => {
          setData(data);
          setLoading(false);
        },
        (error) => {
          setError(error);
          setLoading(false);
        },
      );
      return () => unsubscribe();
    }
  }, [warehouseId, shelfId, user]);
  return { data, loading, error };
};

export {
  createRowShelf,
  getAllRowShelves,
  listenAllRowShelves,
  updateRowShelf,
  deleteRowShelf,
  useListenRowShelves,
};
