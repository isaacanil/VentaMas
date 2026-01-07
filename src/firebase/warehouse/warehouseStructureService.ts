import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { buildLocationPath } from '@/utils/inventory/locations';
import type {
  InventoryUser,
  WarehouseStructureData,
  WarehouseStructureElement,
  WarehouseStructurePayload,
  WarehouseStructureType,
} from '@/utils/inventory/types';

// Función para obtener la referencia al documento de estructura
const getStructureDoc = (businessId: string, type: StructureType) => {
  return doc(db, 'businesses', businessId, 'warehouseStructure', type);
};

type StructureType = WarehouseStructureType;
type StructureElement = WarehouseStructureElement;
type StructurePayload = WarehouseStructurePayload;
type StructureData = WarehouseStructureData;

// Función para actualizar o añadir un elemento a la estructura
const updateStructureElement = async (
  user: InventoryUser,
  type: StructureType,
  elementId: string,
  data: StructurePayload,
) => {
  const structureDoc = getStructureDoc(user.businessID, type);
  try {
    const docSnapshot = await getDoc(structureDoc);
    const existingData = docSnapshot.exists()
      ? (docSnapshot.data().elements as Record<string, StructureElement>)
      : {};

    // Construir la ruta de ubicación basada en el tipo
    let location = '';
    switch (type) {
      case 'warehouses':
        location = buildLocationPath({ warehouseId: elementId });
        break;
      case 'shelves':
        location = buildLocationPath({
          warehouseId: data.warehouseId,
          shelfId: elementId,
        });
        break;
      case 'rows':
        location = buildLocationPath({
          warehouseId: data.warehouseId,
          shelfId: data.shelfId,
          rowShelfId: elementId,
        });
        break;
      case 'segments':
        location = buildLocationPath({
          warehouseId: data.warehouseId,
          shelfId: data.shelfId,
          rowShelfId: data.rowShelfId,
          segmentId: elementId,
        });
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
export const createStructureFromExisting = async (
  user: InventoryUser,
  structureData: StructureData,
) => {
  try {
    const batch = writeBatch(db);

    // Procesar almacenes
    const warehousesDoc = getStructureDoc(user.businessID, 'warehouses');
    const warehouseElements: Record<string, StructureElement> = {};
    structureData.warehouses.forEach((warehouse) => {
      warehouseElements[warehouse.id] = {
        id: warehouse.id,
        name: warehouse.name,
        location: buildLocationPath({ warehouseId: warehouse.id }),
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
        isDeleted: false,
      };
    });
    batch.set(warehousesDoc, { elements: warehouseElements });

    // Procesar estantes
    const shelvesDoc = getStructureDoc(user.businessID, 'shelves');
    const shelfElements: Record<string, StructureElement> = {};
    structureData.shelves.forEach((shelf) => {
      shelfElements[shelf.id] = {
        id: shelf.id,
        name: shelf.name,
        location: buildLocationPath({
          warehouseId: shelf.warehouseId,
          shelfId: shelf.id,
        }),
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
        isDeleted: false,
      };
    });
    batch.set(shelvesDoc, { elements: shelfElements });

    // Procesar filas
    const rowsDoc = getStructureDoc(user.businessID, 'rows');
    const rowElements: Record<string, StructureElement> = {};
    structureData.rows.forEach((row) => {
      rowElements[row.id] = {
        id: row.id,
        name: row.name,
        location: buildLocationPath({
          warehouseId: row.warehouseId,
          shelfId: row.shelfId,
          rowShelfId: row.id,
        }),
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
        isDeleted: false,
      };
    });
    batch.set(rowsDoc, { elements: rowElements });

    // Procesar segmentos
    const segmentsDoc = getStructureDoc(user.businessID, 'segments');
    const segmentElements: Record<string, StructureElement> = {};
    structureData.segments.forEach((segment) => {
      segmentElements[segment.id] = {
        id: segment.id,
        name: segment.name,
        location: buildLocationPath({
          warehouseId: segment.warehouseId,
          shelfId: segment.shelfId,
          rowShelfId: segment.rowShelfId,
          segmentId: segment.id,
        }),
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
export const checkStructureMigration = async (user: InventoryUser) => {
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
const listenToStructure = (
  user: InventoryUser,
  type: StructureType,
  callback: (elements: StructureElement[]) => void,
) => {
  const structureDoc = getStructureDoc(user.businessID, type);

  return onSnapshot(structureDoc, (docSnap) => {
    if (docSnap.exists()) {
      const elements = (docSnap.data().elements || {}) as Record<
        string,
        StructureElement
      >;
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
const useListenStructure = (type: StructureType) => {
  const [data, setData] = useState<StructureElement[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser) as InventoryUser | null;

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
export const updateWarehouse = (
  user: InventoryUser,
  warehouseId: string,
  data: StructurePayload,
) => updateStructureElement(user, 'warehouses', warehouseId, data);

export const updateShelf = (
  user: InventoryUser,
  shelfId: string,
  data: StructurePayload,
) => updateStructureElement(user, 'shelves', shelfId, data);

export const updateRow = (
  user: InventoryUser,
  rowId: string,
  data: StructurePayload,
) => updateStructureElement(user, 'rows', rowId, data);

export const updateSegment = (
  user: InventoryUser,
  segmentId: string,
  data: StructurePayload,
) => updateStructureElement(user, 'segments', segmentId, data);

export const useListenWarehouses = () => useListenStructure('warehouses');
export const useListenShelves = () => useListenStructure('shelves');
export const useListenRows = () => useListenStructure('rows');
export const useListenSegments = () => useListenStructure('segments');
