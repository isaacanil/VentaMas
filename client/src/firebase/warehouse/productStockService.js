// productStockService.js
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';
import { nanoid } from '@reduxjs/toolkit';
import { db } from '../firebaseconfig';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';


// Obtener referencia de la colección de productos en stock
export const getProductStockCollectionRef = (businessID) => {
  return collection(db, 'businesses', businessID, 'productsStock');
};

// Crear un nuevo producto en stock
export const createProductStock = async (user, productStockData) => {
  const id = nanoid();
  try {
    const productStockCollectionRef = getProductStockCollectionRef(user.businessID);
    const productStockDocRef = doc(productStockCollectionRef, id);

    await setDoc(productStockDocRef, {
      ...productStockData,
      id,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    return { ...productStockData, id };
  } catch (error) {
    console.error('Error al añadir el documento: ', error);
    throw error;
  }
};

// Leer todos los productos en stock
export const getAllProductStocks = async (user) => {
  try {
    const productStockCollectionRef = getProductStockCollectionRef(user.businessID);
    const querySnapshot = await getDocs(productStockCollectionRef);
    const productsStock = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return productsStock;
  } catch (error) {
    console.error('Error al obtener documentos: ', error);
    throw error;
  }
};

// Actualizar un producto en stock
export const updateProductStock = async (user, data) => {
  try {
    const productStockDocRef = doc(db, 'businesses', user.businessID, 'productsStock', data.id);
    await updateDoc(productStockDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return { data };
  } catch (error) {
    console.error('Error al actualizar el documento: ', error);
    throw error;
  }
};

// Marcar un producto en stock como eliminado
export const deleteProductStock = async (user, id) => {
  try {
    const productStockDocRef = doc(db, 'businesses', user.businessID, 'productsStock', id);
    await updateDoc(productStockDocRef, {
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

// Escuchar en tiempo real todos los productos en stock filtrados por productId
export const listenAllProductStock = (user, productId, callback) => {
  try {
    const productStockCollectionRef = getProductStockCollectionRef(user.businessID);
    const q = query(
      productStockCollectionRef,
      where('productId', '==', productId),
      where('isDeleted', '==', false)
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => doc.data());
        callback(data);
      },
      (error) => {
        console.error('Error al escuchar documentos en tiempo real:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error al escuchar documentos en tiempo real:', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los productos en stock por ubicación
export const listenAllProductStockByLocation = (user, location, callback) => {
  try {
    const productStockCollectionRef = getProductStockCollectionRef(user.businessID);
    let q;

    if (location) {
      q = query(
        productStockCollectionRef,
        where('location.id', '==', location.id),
        where('isDeleted', '==', false)
      );
    } else {
      q = query(productStockCollectionRef, where('isDeleted', '==', false));
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => doc.data());
        callback(data);
      },
      (error) => {
        console.error('Error al escuchar documentos en tiempo real:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error al escuchar documentos en tiempo real:', error);
    throw error;
  }
};

// Hook para escuchar productos en stock por ubicación
export const useListenProductsStockByLocation = (location = null) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const stableUser = useMemo(() => user, [user]);
  const stableLocation = useMemo(() => location, [location]);

  useEffect(() => {
    if (!stableLocation?.id || !stableUser) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenAllProductStockByLocation(stableUser, stableLocation, (updatedProducts) => {
      setData(updatedProducts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [stableUser, stableLocation]);

  return { data, loading };
};

// Hook para escuchar productos en stock por producto
export const useListenProductsStock = (productId = null) => {
  const user = useSelector(selectUser);
  const stableUser = useMemo(() => user, [user]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId || !stableUser) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenAllProductStock(stableUser, productId, (newData) => {
      setData((prevData) => {
        if (JSON.stringify(prevData) !== JSON.stringify(newData)) {
          return newData;
        }
        return prevData;
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [stableUser, productId]);

  return { data, loading };
};

/* ==========================
   Exportación de Servicios
========================== */
