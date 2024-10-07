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

// Obtener referencia de la colección de productos en stock global
const getProductStockCollectionRef = (businessID) => {
  return collection(db, 'businesses', businessID, 'productsStock');
};

// Crear un nuevo producto en stock
const create = async (user, productStockData) => {
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
const readAll = async (user) => {
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

// Escuchar en tiempo real todos los batches de un negocio específico, opcionalmente filtrados por productId
const listenAllByLocation = (user, location, callback) => {
  try {
  
    const batchCollectionRef = getProductStockCollectionRef(user.businessID, location.id);
    let q;
 
    if (location) {
      q = query(
        batchCollectionRef,
        where('location.id', '==', location.id),
        where('isDeleted', '==', false),
      );
    } 
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => doc.data());
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
// Escuchar en tiempo real todos los productos en stock de una ubicación específica
const listenAll = (user, productId, callback) => {
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

// Actualizar un producto en stock
const update = async (user, data) => {
  try {
    const productStockDocRef = doc(db, 'businesses', user.businessID, 'productsStock', data.id);
    await updateDoc(productStockDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return {data};
  } catch (error) {
    console.error('Error al actualizar el documento: ', error);
    throw error;
  }
};

// Marcar un producto en stock como eliminado
const remove = async (user, id) => {
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

export const productStockRepository = {
  create,
  readAll,
  listenAll,
  listenAllByLocation,
  update,
  remove,
};
