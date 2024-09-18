import { nanoid } from '@reduxjs/toolkit';
import { db } from '../firebaseconfig';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
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

// Actualizar un producto en stock
const update = async (user, id, updatedData) => {
  try {
    const productStockDocRef = doc(db, 'businesses', user.businessID, 'productsStock', id);
    await updateDoc(productStockDocRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return { id, ...updatedData };
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
  update,
  remove,
};
