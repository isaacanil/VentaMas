import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';
import { nanoid } from '@reduxjs/toolkit';
import { db } from '../firebaseconfig';
import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { getNextID } from '../Tools/getNextID';

// Crear un nuevo almacén
export const createWarehouse = async (user, warehouseData) => {
  const id = nanoid();
  const warehouseCollectionRef = collection(db, 'businesses', user.businessID, 'warehouses');
  const warehouseDocReference = doc(warehouseCollectionRef, id);

  try {
    await setDoc(warehouseDocReference, {
      ...warehouseData,
      id,
      createdAt: serverTimestamp(),
      number: await getNextID(user, 'lastWarehouseId'),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return warehouseData;
  } catch (error) {
    console.error('Error al crear el almacén:', error);
    throw error;
  }
};

// Obtener todos los almacenes de un negocio
export const getWarehouses = async (user) => {
  const warehouseCollectionRef = collection(db, 'businesses', user.businessID, 'warehouses');

  try {
    const querySnapshot = await getDocs(warehouseCollectionRef);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error('Error al obtener almacenes:', error);
    throw error;
  }
};

// Escuchar todos los almacenes en tiempo real
export const listenAllWarehouses = (user, callback) => {
  const warehouseCollectionRef = collection(db, 'businesses', user.businessID, 'warehouses');
  
  return onSnapshot(
    warehouseCollectionRef,
    (querySnapshot) => {
      const filteredData = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((data) => data.isDeleted !== true);
      callback(filteredData);
    },
    (error) => console.error('Error al obtener documentos en tiempo real:', error)
  );
};

// Obtener un almacén específico por ID
export const getWarehouse = async (user, id) => {
  const warehouseDocReference = doc(db, 'businesses', user.businessID, 'warehouses', id);

  try {
    const warehouseDoc = await getDoc(warehouseDocReference);
    return warehouseDoc.exists() ? warehouseDoc.data() : null;
  } catch (error) {
    console.error('Error al obtener el almacén:', error);
    throw error;
  }
};

// Escuchar un almacén específico en tiempo real
export const listenWarehouse = (user, id, callback) => {
  const warehouseDocReference = doc(db, 'businesses', user.businessID, 'warehouses', id);

  return onSnapshot(
    warehouseDocReference,
    (docSnapshot) => callback(docSnapshot.exists() ? docSnapshot.data() : null),
    (error) => console.error('Error al obtener el almacén:', error)
  );
};

// Actualizar un almacén
export const updateWarehouse = async (user, id, updatedData) => {
  const warehouseDocReference = doc(db, 'businesses', user.businessID, 'warehouses', id);

  try {
    await updateDoc(warehouseDocReference, {
      ...updatedData,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return updatedData;
  } catch (error) {
    console.error('Error al actualizar el almacén:', error);
    throw error;
  }
};

// Borrar un almacén (marcar como eliminado)
export const deleteWarehouse = async (user, id) => {
  const warehouseDocReference = doc(db, 'businesses', user.businessID, 'warehouses', id);

  try {
    await updateDoc(warehouseDocReference, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: user.uid,
    });
    return id;
  } catch (error) {
    console.error('Error al borrar el almacén:', error);
    throw error;
  }
};

// Hooks para escuchar almacenes en tiempo real
export const useListenWarehouse = (id) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || !user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenWarehouse(user, id, (data) => {
      setData(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id, user]);

  return { data, loading, error };
};

export const useListenWarehouses = () => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.businessID) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenAllWarehouses(user, (data) => {
      setData(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return { data, loading, error };
};

export const useGetWarehouseData = (items) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState({
    warehouses: [],
    shelves: [],
    rows: [],
    segments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!Array.isArray(items) && items.length === 0) return;
  }, [items, user]);

  return { data, loading, error };
};
