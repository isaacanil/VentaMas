import { nanoid } from '@reduxjs/toolkit';
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
  query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';
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

// Crear un almacén por defecto si no existe
export const getDefaultWarehouse = async (user) => {
  const warehouseCollectionRef = collection(db, 'businesses', user.businessID, 'warehouses');
  const defaultWarehouseQuery = query(warehouseCollectionRef, where('defaultWarehouse', '==', true));

  try {
    const querySnapshot = await getDocs(defaultWarehouseQuery);
    if (querySnapshot.empty) {
      const id = nanoid();
      const warehouseDocReference = doc(warehouseCollectionRef, id);
      const warehouseData = {
        id,
        name: 'Almacen Virtual',
        description: 'Almacén por defecto para compras',
        shortName: 'Virtual',
        number: await getNextID(user, 'lastWarehouseId'),
        owner: user.uid,
        location: 'default',
        address: 'default address',
        dimension: {
          length: 0,
          width: 0,
          height: 0,
        },
        capacity: 0,
        defaultWarehouse: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      await setDoc(warehouseDocReference, warehouseData);
      return warehouseData;
    } else {
      return querySnapshot.docs[0].data();
    }
  } catch (error) {
    console.error('Error al crear el almacén por defecto:', error);
    throw error;
  }
};

// Hook para crear y obtener el almacén por defecto
export const useDefaultWarehouse = () => {
  const user = useSelector(selectUser);
  const [defaultWarehouse, setDefaultWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDefaultWarehouse = async () => {
      try {
        setLoading(true);
        const warehouse = await getDefaultWarehouse(user);
        setDefaultWarehouse(warehouse);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDefaultWarehouse();
    }
  }, [user]);

  return { defaultWarehouse, loading, error };
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
