import { doc, writeBatch } from 'firebase/firestore';

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

type StructureElementSource = StructurePayload & {
  id: string;
};

type BuildStructureElementParams = {
  type: StructureType;
  elementId: string;
  data: StructurePayload;
  updatedAt: string;
  updatedBy?: string;
};

const buildStructureLocation = (
  type: StructureType,
  elementId: string,
  data: StructurePayload,
) => {
  switch (type) {
    case 'warehouses':
      return buildLocationPath({ warehouseId: elementId });
    case 'shelves':
      return buildLocationPath({
        warehouseId: data.warehouseId,
        shelfId: elementId,
      });
    case 'rows':
      return buildLocationPath({
        warehouseId: data.warehouseId,
        shelfId: data.shelfId,
        rowShelfId: elementId,
      });
    case 'segments':
      return buildLocationPath({
        warehouseId: data.warehouseId,
        shelfId: data.shelfId,
        rowShelfId: data.rowShelfId,
        segmentId: elementId,
      });
  }
};

const buildStructureElement = ({
  type,
  elementId,
  data,
  updatedAt,
  updatedBy,
}: BuildStructureElementParams): StructureElement => ({
  id: elementId,
  name: data.name,
  location: buildStructureLocation(type, elementId, data),
  updatedAt,
  updatedBy,
  isDeleted: false,
});

const buildStructureElements = (
  type: StructureType,
  records: StructureElementSource[],
  user: InventoryUser,
): Record<string, StructureElement> => {
  const elements: Record<string, StructureElement> = {};

  records.forEach((record) => {
    elements[record.id] = buildStructureElement({
      type,
      elementId: record.id,
      data: record,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    });
  });

  return elements;
};

// Función para crear la estructura desde datos existentes
export const createStructureFromExisting = async (
  user: InventoryUser,
  structureData: StructureData,
) => {
  try {
    const batch = writeBatch(db);

    // Procesar almacenes
    const warehousesDoc = getStructureDoc(user.businessID!, 'warehouses');
    batch.set(warehousesDoc, {
      elements: buildStructureElements(
        'warehouses',
        structureData.warehouses,
        user,
      ),
    });

    // Procesar estantes
    const shelvesDoc = getStructureDoc(user.businessID!, 'shelves');
    batch.set(shelvesDoc, {
      elements: buildStructureElements('shelves', structureData.shelves, user),
    });

    // Procesar filas
    const rowsDoc = getStructureDoc(user.businessID!, 'rows');
    batch.set(rowsDoc, {
      elements: buildStructureElements('rows', structureData.rows, user),
    });

    // Procesar segmentos
    const segmentsDoc = getStructureDoc(user.businessID!, 'segments');
    batch.set(segmentsDoc, {
      elements: buildStructureElements(
        'segments',
        structureData.segments,
        user,
      ),
    });

    // Ejecutar todas las operaciones
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error creating structure from existing data:', error);
    throw error;
  }
};
