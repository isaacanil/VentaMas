// warehouseRepository.js
import { nanoid } from '@reduxjs/toolkit';
import { db } from '../firebaseconfig';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

// Obtener referencia de la colección de almacenes de un negocio
const getWarehouseCollectionRef = (businessID) => {
  return collection(db, 'businesses', businessID, 'warehouses');
};

// Crear un nuevo almacén
const create = async (user, warehouseData) => {
  const id = nanoid();
  try {
    const warehouseCollectionRef = getWarehouseCollectionRef(user.businessID);
 

    const warehouseDocRef = doc(warehouseCollectionRef, id);

    await setDoc(warehouseDocRef, {
      ...warehouseData,
      id,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });

    return { ...warehouseData };
  } catch (error) {
    console.error('Error al añadir el documento: ', error);
    throw error;
  }
};

// Leer todos los almacenes
const readAll = async (user) => {
  try {
    const warehouseCollectionRef = getWarehouseCollectionRef(user.businessID);
    const querySnapshot = await getDocs(warehouseCollectionRef);
    const warehouses = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return warehouses;
  } catch (error) {
    console.error('Error al obtener documentos: ', error);
    throw error;
  }
};

// Actualizar un almacén
const update = async (user, id, updatedData) => {
  try {
    const warehouseDocRef = doc(db, 'businesses', user.businessID, 'warehouses', id);
    await updateDoc(warehouseDocRef, {
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

// Marcar un almacén como eliminado
const remove = async (user, id) => {
  try {
    const warehouseDocRef = doc(db, 'businesses', user.businessID, 'warehouses', id);
    await updateDoc(warehouseDocRef, {
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

export const warehouseRepository = {
  create,
  readAll,
  update,
  remove,
};
