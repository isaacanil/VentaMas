// warehouseRepository.js
import { nanoid } from '@reduxjs/toolkit';
import { db } from '../firebaseconfig';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { getNextID } from '../Tools/getNextID';

// Obtener referencia de la colección de almacenes de un negocio
const getWarehouseCollectionRef = (businessID) => {
  return collection(db, 'businesses', businessID, 'warehouses');
};

const getWarehouseDocRef = (businessID, id) => {
  return doc(db, 'businesses', businessID, 'warehouses', id);
};

// Crear un nuevo almacén
const create = async (user, warehouseData) => {
  const id = nanoid();
  try {
    const warehouseCollectionRef = getWarehouseCollectionRef(user.businessID);

    const warehouseDocReference = doc(warehouseCollectionRef, id);

    await setDoc(warehouseDocReference, {
      ...warehouseData,
      id, // Asegurarse de que el ID está almacenado en los datos
      createdAt: serverTimestamp(),
      number: await getNextID(user, 'lastWarehouseId'),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });

    // Retornar los datos sin añadir el id nuevamente
    return warehouseData;
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
    const warehouses = querySnapshot.docs.map((doc) => doc.data());
    return warehouses;
  } catch (error) {
    console.error('Error al obtener documentos: ', error);
    throw error;
  }
};

// Leer un almacén específico
const read = async (user, id) => {
  try {
    const warehouseDocReference = getWarehouseDocRef(user.businessID, id);
    const warehouseDoc = await getDoc(warehouseDocReference);
    if (warehouseDoc.exists()) {
      return warehouseDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener el documento: ', error);
    throw error;
  }
};
const listenAll = (user, callback) => {
  if (!user?.businessID) return () => { };
  
  const warehouseCollectionRef = getWarehouseCollectionRef(user.businessID);

  const unsubscribe = onSnapshot(
    warehouseCollectionRef,
    (querySnapshot) => {
      const warehouses = querySnapshot.docs.map((doc) => doc.data());
      callback(warehouses);
    },
    (error) => {
      console.error('Error al obtener documentos en tiempo real: ', error);
    }
  );

  return unsubscribe;
}
// Escuchar cambios en un almacén específico
const listen = (user, id, callback) => {
  console.log("id: ", id)
  console.log("user: ", user)
  if (!user?.businessID) return () => { }; // Si no hay ID de negocio, retornar una función vacía
  if (!id) return () => { }; // Si no hay ID, retornar una función vacía
  const warehouseDocReference = getWarehouseDocRef(user.businessID, id);

  const unsubscribe = onSnapshot(
    warehouseDocReference,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(docSnapshot.data());
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error al obtener el almacén:', error);
    }
  );

  return unsubscribe;
};

// Actualizar un almacén
const update = async (user, id, updatedData) => {
  try {
    const warehouseDocReference = getWarehouseDocRef(user.businessID, id);
    await updateDoc(warehouseDocReference, {
      ...updatedData,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    // Retornar los datos actualizados sin añadir el id nuevamente
    return updatedData;
  } catch (error) {
    console.error('Error al actualizar el documento: ', error);
    throw error;
  }
};

// Marcar un almacén como eliminado
const remove = async (user, id) => {
  try {
    const warehouseDocReference = getWarehouseDocRef(user.businessID, id);
    await updateDoc(warehouseDocReference, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: user.uid,
    });
    return id; // Retornar el ID para confirmar la eliminación
  } catch (error) {
    console.error('Error al marcar el documento como eliminado: ', error);
    throw error;
  }
};

export const warehouseRepository = {
  create,
  readAll,
  listenAll,
  listen,
  read,
  update,
  remove,
};
