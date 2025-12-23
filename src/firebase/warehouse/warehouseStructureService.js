import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

// Función para obtener la referencia al documento de estructura
const getStructureDoc = (businessId, type) => {
  return doc(db, 'businesses', businessId, 'warehouseStructure', type);
};

// Función para actualizar o añadir un elemento a la estructura
const updateStructureElement = async (user, type, elementId, data) => {
  const structureDoc = getStructureDoc(user.businessID, type);

  try {
    const docSnapshot = await getDoc(structureDoc);
    const existingData = docSnapshot.exists()
      ? docSnapshot.data().elements
      : {};

    // Construir la ruta de ubicación basada en el tipo
    let location = '';
    switch (type) {
      case 'warehouses':
        location = elementId;
        break;
      case 'shelves':
        location = `${data.warehouseId}/${elementId}`;
        break;
      case 'rows':
        location = `${data.warehouseId}/${data.shelfId}/${elementId}`;
        break;
      case 'segments':
        location = `${data.warehouseId}/${data.shelfId}/${data.rowShelfId}/${elementId}`;
        break;
    }

    await setDoc(
      structureDoc,
      {
        elements: {
          ...existingData,
          [elementId]: {
            id: elementId,
            name: data.name,
            location,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid,
            isDeleted: false,
          },
        },
      },
      { merge: true },
    );
  } catch (error) {
    console.error(`Error updating ${type} structure:`, error);
    throw error;
  }
};

// Función para crear la estructura desde datos existentes
export const createStructureFromExisting = async (user, structureData) => {
  try {
    const batch = writeBatch(db);

    // Procesar almacenes
    const warehousesDoc = getStructureDoc(user.businessID, 'warehouses');
    const warehouseElements = {};
    structureData.warehouses.forEach((warehouse) => {
      warehouseElements[warehouse.id] = {
        id: warehouse.id,
        name: warehouse.name,
        location: warehouse.id,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
        isDeleted: false,
      };
    });
    batch.set(warehousesDoc, { elements: warehouseElements });

    // Procesar estantes
    const shelvesDoc = getStructureDoc(user.businessID, 'shelves');
    const shelfElements = {};
    structureData.shelves.forEach((shelf) => {
      shelfElements[shelf.id] = {
        id: shelf.id,
        name: shelf.name,
        location: `${shelf.warehouseId}/${shelf.id}`,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
        isDeleted: false,
      };
    });
    batch.set(shelvesDoc, { elements: shelfElements });

    // Procesar filas
    const rowsDoc = getStructureDoc(user.businessID, 'rows');
    const rowElements = {};
    structureData.rows.forEach((row) => {
      rowElements[row.id] = {
        id: row.id,
        name: row.name,
        location: `${row.warehouseId}/${row.shelfId}/${row.id}`,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
        isDeleted: false,
      };
    });
    batch.set(rowsDoc, { elements: rowElements });

    // Procesar segmentos
    const segmentsDoc = getStructureDoc(user.businessID, 'segments');
    const segmentElements = {};
    structureData.segments.forEach((segment) => {
      segmentElements[segment.id] = {
        id: segment.id,
        name: segment.name,
        location: `${segment.warehouseId}/${segment.shelfId}/${segment.rowShelfId}/${segment.id}`,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
        isDeleted: false,
      };
    });
    batch.set(segmentsDoc, { elements: segmentElements });

    // Ejecutar todas las operaciones
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error creating structure from existing data:', error);
    throw error;
  }
};

// Función para verificar si la estructura ya está migrada
export const checkStructureMigration = async (user) => {
  try {
    const structureDoc = getStructureDoc(user.businessID, 'warehouses');
    const docSnap = await getDoc(structureDoc);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking structure migration:', error);
    return false;
  }
};

// Función para escuchar cambios en la estructura
const listenToStructure = (user, type, callback) => {
  const structureDoc = getStructureDoc(user.businessID, type);

  return onSnapshot(structureDoc, (doc) => {
    if (doc.exists()) {
      const elements = doc.data().elements || {};
      const activeElements = Object.values(elements).filter(
        (el) => !el.isDeleted,
      );
      callback(activeElements);
    } else {
      callback([]);
    }
  });
};

// Hook personalizado para escuchar la estructura
const useListenStructure = (type) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.businessID) return;

    const unsubscribe = listenToStructure(user, type, (elements) => {
      setData(elements);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, type]);

  return { data, loading };
};

// Funciones específicas para cada tipo de estructura
export const updateWarehouse = (user, warehouseId, data) =>
  updateStructureElement(user, 'warehouses', warehouseId, data);

export const updateShelf = (user, shelfId, data) =>
  updateStructureElement(user, 'shelves', shelfId, data);

export const updateRow = (user, rowId, data) =>
  updateStructureElement(user, 'rows', rowId, data);

export const updateSegment = (user, segmentId, data) =>
  updateStructureElement(user, 'segments', segmentId, data);

export const useListenWarehouses = () => useListenStructure('warehouses');
export const useListenShelves = () => useListenStructure('shelves');
export const useListenRows = () => useListenStructure('rows');
export const useListenSegments = () => useListenStructure('segments');
