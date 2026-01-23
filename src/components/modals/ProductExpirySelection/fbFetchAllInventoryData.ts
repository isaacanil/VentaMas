import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

interface UserIdentity {
  businessID?: string;
}

interface PathIds {
  warehouseId: string | null;
  shelfId: string | null;
  rowShelfId: string | null;
  segmentId: string | null;
}

interface ProductStockItem {
  batchId?: string;
  path?: string;
  id?: string;
  stock?: number;
  expirationDate?: unknown;
  productId?: string;
}

interface LocationDataItem {
  id?: string;
  warehouseId?: string;
  shelfId?: string;
  rowShelfId?: string;
  segmentId?: string;
  name?: string;
  shortName?: string;
}

interface WarehouseData {
  warehouses: LocationDataItem[];
  shelves: LocationDataItem[];
  rows: LocationDataItem[];
  segments: LocationDataItem[];
}

interface BatchDoc {
  id?: string;
  shortName?: string;
  expirationDate?: unknown;
  quantity?: number;
}

export interface InventoryDisplayItem {
  warehouse: string;
  shortName: string;
  shelf: string;
  row: string;
  segment: string;
  path?: string;
  stock?: number;
  productStock: {
    id: string;
    stock: number;
  };
  batch: {
    id: string;
    shortName?: string;
    expirationDate?: unknown;
    stock?: number;
  };
  expirationDate: unknown;
}

const emptyPathIds: PathIds = {
  warehouseId: null,
  shelfId: null,
  rowShelfId: null,
  segmentId: null,
};

const getPathIds = (path: string | undefined | null): PathIds => {
  if (typeof path !== 'string' || !path.trim()) return emptyPathIds;
  const ids = path.split('/').filter((id) => id !== '');
  return {
    warehouseId: ids[0] || null,
    shelfId: ids[1] || null,
    rowShelfId: ids[2] || null,
    segmentId: ids[3] || null,
  };
};
function getBatchIds(products: ProductStockItem[]): string[] {
  if (!Array.isArray(products) || products.length === 0) {
    return []; // Devuelve un array vacío si el inventario es inválido o vacío
  }
  const batchIds = products
    .map((item) => item.batchId)
    .filter((id): id is string => Boolean(id));
  return [...new Set(batchIds)]; // Remove duplicate batch IDs
}
function transformInventoryItems(
  inventoryItems: ProductStockItem[],
  data: WarehouseData,
): InventoryDisplayItem[] {
  return inventoryItems.map((item) => {
    const { warehouseId, shelfId, rowShelfId, segmentId } = getPathIds(
      item.path,
    );

    // Variables para almacenar los nombres
    let warehouseName = '';
    let warehouseShortName = '';
    let shelfName = '';
    let rowName = '';
    let segmentName = '';

    // Obtener datos del almacén
    if (warehouseId) {
      const warehouse = data.warehouses.find(
        (w) => w.id === warehouseId || w.warehouseId === warehouseId,
      );
      if (warehouse) {
        warehouseName = warehouse?.name || '';
        warehouseShortName = warehouse?.shortName || '';
      }
    }

    // Obtener datos de la estantería
    if (shelfId) {
      const shelf = data.shelves.find(
        (s) => s.id === shelfId || s.shelfId === shelfId,
      );
      if (shelf) {
        shelfName = shelf?.shortName || '';
      }
    }

    // Obtener datos de la fila
    if (rowShelfId) {
      const row = data.rows.find(
        (r) => r.id === rowShelfId || r.rowShelfId === rowShelfId,
      );
      if (row) {
        rowName = row?.shortName || '';
      }
    }

    // Obtener datos del segmento
    if (segmentId) {
      const segment = data.segments.find(
        (s) => s.id === segmentId || s.segmentId === segmentId,
      );
      if (segment) {
        segmentName = segment?.shortName || '';
      }
    }

    // Obtener otros campos del item de inventario

    const expirationDate = item?.expirationDate || '';
    const batch = {
      id: item?.batchId || '',
    };
    const productStock = {
      id: item?.id || '',
      stock: item?.stock || 0,
    };
    const path = item?.path;

    // Retornar el objeto con la estructura deseada
    return {
      warehouse: warehouseName,
      shortName: warehouseShortName,
      shelf: shelfName,
      row: rowName,
      segment: segmentName,
      path: path,
      productStock,
      batch,
      expirationDate,
    };
  });
}
function saveBatchDataOnInventory(
  inventory: InventoryDisplayItem[],
  batches: BatchDoc[],
): InventoryDisplayItem[] {
  return inventory.map((item) => {
    const batch = batches.find((b) => b.id === item.batch.id);

    if (batch) {
      return {
        ...item,
        batch: {
          id: batch.id,
          shortName: batch.shortName,
          expirationDate: batch.expirationDate,
          stock: batch.quantity,
        },
      };
    }
    return item;
  });
}
function sortInventoryByLocation(
  inventoryItems: InventoryDisplayItem[],
): InventoryDisplayItem[] {
  return inventoryItems.sort((a, b) => {
    const locationA = buildLocationString(a).toLowerCase();
    const locationB = buildLocationString(b).toLowerCase();
    if (locationA < locationB) return -1;
    if (locationA > locationB) return 1;
    return 0;
  });
}
function buildLocationString(item: InventoryDisplayItem) {
  let locationString = '';
  if (item.shortName) locationString += item.shortName;
  if (item.shelf) locationString += `-${item.shelf}`;
  if (item.row) locationString += `-${item.row}`;
  if (item.segment) locationString += `-${item.segment}`;
  return locationString;
}

export const fetchAllInventoryData = async (
  user: UserIdentity | null | undefined,
  productId: string | null | undefined,
  setInventory: Dispatch<SetStateAction<InventoryDisplayItem[]>>,
): Promise<InventoryDisplayItem[] | undefined> => {
  try {
    if (!user?.businessID || !productId) return;
    const productsStock = await fbGetProductsStock(user, productId);
    const paths = productsStock.map((product) => product?.path) || [];
    const pathIds = paths.map((path) => getPathIds(path));
    const { data } = await fbGetWarehouseData(user, pathIds);
    const batchIdsFromInventory = getBatchIds(productsStock);
    const batches = await fbGetBatchesByIds(user, batchIdsFromInventory);
    const inventoryItems = transformInventoryItems(productsStock, data);
    const inventory = saveBatchDataOnInventory(inventoryItems, batches);
    setInventory(sortInventoryByLocation(inventory));
    return sortInventoryByLocation(inventory);
  } catch (error) {
    console.error('ocurrió un error al buscar ......................', error);
  }
};

export const useGetAllInventoryData = (productId: string | null | undefined) => {
  type InventoryRootState = Parameters<typeof selectUser>[0];
  const user = useSelector((state: InventoryRootState) => selectUser(state));
  const [data, setData] = useState<InventoryDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (user && productId) {
      fetchAllInventoryData(user, productId, setData)
        .then(() => setLoading(false))
        .catch((err) => setError(err));
    }
  }, [user, productId]);

  return { data, loading, error };
};

const fbGetProductsStock = async (
  user: UserIdentity,
  productId: string,
): Promise<ProductStockItem[]> => {
  const productStockRef = collection(
    db,
    'businesses',
    user.businessID,
    'productsStock',
  );
  const q = query(productStockRef, where('productId', '==', productId));
  const querySnapshot = await getDocs(q);
  const data: ProductStockItem[] = [];
  querySnapshot.forEach((docSnap) => {
    data.push(docSnap.data() as ProductStockItem);
  });
  return data;
};
const fbGetWarehouseData = async (
  user: UserIdentity,
  items: PathIds[],
): Promise<{ data: WarehouseData; loading: boolean; error: unknown }> => {
  if (!user.businessID || items.length === 0) {
    return {
      data: {
        warehouses: [],
        shelves: [],
        rows: [],
        segments: [],
      },
      loading: false,
      error: null,
    };
  }

  const warehouses: LocationDataItem[] = [];
  const shelves: LocationDataItem[] = [];
  const rows: LocationDataItem[] = [];
  const segments: LocationDataItem[] = [];
  let error: unknown = null;

  for (const item of items) {
    try {
      let docPath = `businesses/${user.businessID}/warehouses/${item.warehouseId}`;

      if (item.shelfId) {
        docPath += `/shelves/${item.shelfId}`;
        if (item.rowShelfId) {
          docPath += `/rows/${item.rowShelfId}`;
          if (item.segmentId) {
            docPath += `/segments/${item.segmentId}`;
          }
        }
      }

      const docRef = doc(db, docPath);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = docSnap.data() as LocationDataItem;
        if (item.segmentId) segments.push(docData);
        else if (item.rowShelfId) rows.push(docData);
        else if (item.shelfId) shelves.push(docData);
        else if (item.warehouseId) warehouses.push(docData);
      }
    } catch (err) {
      console.error('Error obteniendo el documento:', err);
      error = err;
    }
  }

  return {
    data: {
      warehouses,
      shelves,
      rows,
      segments,
    },
    loading: false,
    error,
  };
};
const fbGetBatchesByIds = async (
  user: UserIdentity,
  batchIDs: string[],
): Promise<BatchDoc[]> => {
  const batchRefs = batchIDs.map((batchID) =>
    doc(db, 'businesses', user.businessID, 'batches', batchID),
  );
  const batchDocs = await Promise.all(
    batchRefs.map(async (batchRef) => {
      const docSnap = await getDoc(batchRef);
      return docSnap.data() as BatchDoc;
    }),
  );
  return batchDocs;
};
