// productStockService.js
import { nanoid } from '@reduxjs/toolkit';
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
  getDoc,
  increment,
  getAggregateFromServer,
  sum,
  count,
} from 'firebase/firestore';
import type {
  CollectionReference,
  DocumentData,
  Query,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { buildLocationPath } from '@/utils/inventory/locations';
import type {
  AggregatedProductStock,
  InventoryStockItem,
  InventoryUser,
  ProductStockRecord,
} from '@/utils/inventory/types';

type ProductStockMovementInput = {
  quantity?: number;
  reason?: MovementReason;
  notes?: string;
};

type ProductStockQueryParams = {
  productId?: string | number | null;
  batchId?: string | number | null;
  location?: InventoryStockItem['location'] | null;
};

type StockAggregateSummary = {
  totalUnits: number;
  totalLots: number;
};

type StockAggregateDetailedSummary = StockAggregateSummary & {
  directUnits: number;
  directLots: number;
};

type ProductStockListener = (data: ProductStockRecord[]) => void;

const normalizeToDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (
    typeof (value as { toDate?: () => Date } | null)?.toDate === 'function'
  ) {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof (value as { seconds?: number } | null)?.seconds === 'number') {
    const parsed = new Date((value as { seconds: number }).seconds * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Obtener referencia de la colección de productos en stock
export const getProductStockCollectionRef = (
  businessID?: string | null,
): CollectionReference<DocumentData> | null => {
  if (!businessID) {
    console.warn('businessID is empty. Skipping collection reference.');
    return null; // Return early or handle gracefully
  }
  return collection(db, 'businesses', businessID, 'productsStock');
};

// Crear un nuevo producto en stock
export const createProductStock = async (
  user: InventoryUser,
  productStockData: ProductStockRecord = {},
) => {
  const id = nanoid();

  try {
    const productStockCollectionRef = getProductStockCollectionRef(
      user.businessID,
    );
    if (!productStockCollectionRef) return; // If null, do not proceed

    const productStockDocRef = doc(productStockCollectionRef, id);
    const { location: rawLocation, ...rest } = productStockData;
    const normalizedLocation = buildLocationPath(rawLocation);

    await setDoc(productStockDocRef, {
      ...rest,
      id,
      location: normalizedLocation,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    return { ...rest, id, location: normalizedLocation };
  } catch (error) {
    console.error('Error al añadir el documento: ', error);
    throw error;
  }
};

// Leer todos los productos en stock
export const getAllProductStocks = async (user: InventoryUser) => {
  try {
    const productStockCollectionRef = getProductStockCollectionRef(
      user.businessID,
    );
    if (!productStockCollectionRef) return []; // If null, return empty array

    const querySnapshot = await getDocs(productStockCollectionRef);
    const productsStock = querySnapshot.docs.map((doc) => doc.data());
    return productsStock;
  } catch (error) {
    console.error('Error al obtener documentos: ', error);
    throw error;
  }
};

// Actualizar un producto en stock
export const updateProductStock = async (
  user: InventoryUser,
  data: ProductStockRecord & { id: string },
) => {
  try {
    const productStockDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'productsStock',
      data.id,
    );
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

export const deleteAllProductStocksByBatch = async ({
  user,
  batchId,
  movement,
}: {
  user: InventoryUser;
  batchId: string | number;
  movement?: ProductStockMovementInput;
}) => {
  try {
    // 1. Obtener todos los productStock del batch
    const batchStocks = await getProductStockByBatch(user, { batchId });

    // 2. Eliminar cada registro con su movimiento asociado
    const deletionPromises = batchStocks.map((stock) =>
      deleteProductStock({
        user,
        productStockId: stock.id,
        movement: {
          ...movement,
          quantity: stock.quantity,
          notes: `${movement?.notes || ''} - Eliminación por batch ${batchId}`,
        },
      }),
    );

    // 3. Ejecutar todas las eliminaciones en paralelo
    const results = await Promise.all(deletionPromises);

    return {
      batchId,
      deletedItems: results.length,
      quantity: batchStocks.reduce((sum, stock) => sum + stock.quantity, 0),
    };
  } catch (error) {
    console.error(
      `Error eliminando productStocks del batch ${batchId}:`,
      error,
    );
    throw error;
  }
};

export const deleteProductStock = async ({
  user,
  productStockId,
  movement = {},
}: {
  user: InventoryUser;
  productStockId: string;
  movement?: ProductStockMovementInput;
}) => {
  if (!user?.businessID || !productStockId) {
    throw new Error(
      'Missing required parameters: user.businessID or productStockId',
    );
  }

  try {
    const { businessID, uid } = user;
    const stockRef = doc(
      db,
      'businesses',
      businessID,
      'productsStock',
      productStockId,
    );

    // 1. Validate stock document exists
    const stockDoc = await getDoc(stockRef);
    if (!stockDoc.exists()) {
      throw new Error('Stock record not found');
    }

    const stockData = stockDoc.data() as ProductStockRecord;
    const {
      batchId,
      productId,
      location,
      productName,
      batchNumberId,
      quantity: stockQuantity,
    } = stockData;

    // 2. Validate required data
    if (!batchId || !productId) {
      throw new Error(
        'Invalid stock record - missing batch or product reference',
      );
    }

    // 3. Get references
    const batchRef = doc(
      db,
      'businesses',
      businessID,
      'batches',
      String(batchId),
    );
    const productRef = doc(
      db,
      'businesses',
      businessID,
      'products',
      String(productId),
    );

    // 4. Validate batch exists
    const batchDoc = await getDoc(batchRef);
    if (!batchDoc.exists()) {
      throw new Error('Associated batch not found');
    }

    // 5. Validate quantity
    const quantityToRemove = Number(movement?.quantity ?? stockQuantity ?? 0);
    // if (quantityToRemove <= 0 || quantityToRemove > stockQuantity) {
    //   throw new Error('Cantidad a eliminar inválida');
    // }

    // 6. Check if batch will be empty
    const productStocksRef = collection(
      db,
      'businesses',
      businessID,
      'productsStock',
    );
    const stocksQuery = query(
      productStocksRef,
      where('batchId', '==', batchId),
      where('isDeleted', '==', false),
    );
    const otherStocksSnap = await getDocs(stocksQuery);
    const willBatchBeEmpty = otherStocksSnap.size <= 1;

    // 7. Perform updates (no transacciones: cada operación es individual)al)
    // 7a. Decrementa stock en el producto
    await updateDoc(productRef, {
      stock: increment(-quantityToRemove),
    });

    // 7b. Decrementa stock en el batch
    await updateDoc(batchRef, {
      quantity: increment(-quantityToRemove),
    });

    // 7c. Marca el stock actual como eliminado
    await updateDoc(stockRef, {
      isDeleted: true,
      quantity: 0,
      deletedAt: serverTimestamp(),
      deletedBy: uid,
    });

    // 7d. Si ya no hay stock de ese batch, márcalo como eliminado
    if (willBatchBeEmpty) {
      await updateDoc(batchRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: uid,
      });
      await updateDoc(productRef, {
        stock: 0,
      });
    }

    // 8. Create movement record
    const movementId = nanoid();
    const movementRef = doc(
      db,
      'businesses',
      businessID,
      'movements',
      movementId,
    );

    await setDoc(movementRef, {
      id: movementId,
      sourceLocation: location || '',
      destinationLocation: 'deleted',
      productId,
      productName: productName || '',
      quantity: quantityToRemove,
      movementType: MovementType.Exit,
      movementReason: movement?.reason ?? MovementReason.Adjustment,
      batchId,
      batchNumberId: batchNumberId || '',
      notes: movement?.notes || 'Eliminación de stock',
      createdAt: serverTimestamp(),
      createdBy: uid,
      isDeleted: false,
    });

    // 9. Retorna el id del stock eliminado
    return productStockId;
  } catch (error) {
    console.error('Error al marcar el documento como eliminado: ', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los productos en stock filtrados por productId
export const listenAllProductStock = (
  user: InventoryUser | null | undefined,
  productId: string | number | null | undefined,
  callback: ProductStockListener,
): Unsubscribe => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noOp: Unsubscribe = () => {};

  if (!user || productId === null || productId === undefined || !callback) {
    console.warn('Missing required parameters in listenAllProductStock');
    return noOp;
  }

  try {
    const productStockCollectionRef = getProductStockCollectionRef(
      user.businessID,
    );
    if (!productStockCollectionRef) {
      console.warn('No collection reference available');
      return noOp;
    }

    const q = query(
      productStockCollectionRef,
      where('productId', '==', productId),
      where('status', '==', 'active'),
      where('isDeleted', '==', false),
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(
          (doc) => doc.data() as ProductStockRecord,
        );
        callback(data);
      },
      (error) => {
        console.error('Error al escuchar documentos en tiempo real:', error);
        callback([]);
      },
    );
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return noOp;
  }
};

// Escuchar en tiempo real todos los productos en stock por ubicación
export const listenAllProductStockByLocation = (
  user: InventoryUser | null | undefined,
  location: InventoryStockItem['location'] | null | undefined,
  callback: ProductStockListener,
  onError?: (error: unknown) => void,
): Unsubscribe => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noOp: Unsubscribe = () => {};

  const normalizedLocation = buildLocationPath(location);
  if (!user || !normalizedLocation || !callback) {
    console.warn(
      'Missing required parameters in listenAllProductStockByLocation',
    );
    return noOp;
  }

  try {
    const productStockCollectionRef = getProductStockCollectionRef(
      user.businessID,
    );
    if (!productStockCollectionRef) {
      console.warn('No collection reference available');
      return noOp;
    }

    const q = query(
      productStockCollectionRef,
      where('location', '==', normalizedLocation),
      where('isDeleted', '==', false),
      where('status', '==', 'active'),
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(
          (doc) => doc.data() as ProductStockRecord,
        );
        callback(data);
      },
      (error) => {
        console.error('Error al escuchar documentos en tiempo real:', error);
        if (onError) onError(error);
        callback([]);
      },
    );
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return noOp;
  }
};

// Hook para escuchar productos en stock por ubicación
// Hook para escuchar productos en stock por ubicación
export const useListenProductsStockByLocation = (
  location: InventoryStockItem['location'] | null = null,
) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const locationPath = useMemo(() => buildLocationPath(location), [location]);
  const [data, setData] = useState<ProductStockRecord[]>([]);
  // Inicializar loading basado en si tenemos las dependencias necesarias
  const [loading, setLoading] = useState(!!(locationPath && user?.businessID));

  // Estado para detectar cambios en dependencias
  const [prevLocation, setPrevLocation] = useState(locationPath);
  const [prevBusinessID, setPrevBusinessID] = useState(user?.businessID);

  // Ajustar estado durante render si cambian dependencias
  if (locationPath !== prevLocation || user?.businessID !== prevBusinessID) {
    setPrevLocation(locationPath);
    setPrevBusinessID(user?.businessID);
    // Data se limpia o se mantiene según preferencia, aquí limpiamos
    setData([]);
    // Si hay datos válidos, ponemos loading true. Si no, false.
    if (locationPath && user?.businessID) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Si no tenemos datos válidos, el render ya reseteó el estado. Salimos.limos.
    if (!locationPath || !user?.businessID) {
      return;
    }

    const unsubscribe = listenAllProductStockByLocation(
      user,
      locationPath,
      (updatedProducts) => {
        setData(updatedProducts);
        setLoading(false);
      },
    );

    // Limpiamos el listener al desmontar
    return () => unsubscribe();
  }, [user, locationPath]); // Dependencias del efecto se mantienen

  return { data, loading };
};

// Hook para escuchar productos en stock por producto
export const useListenProductsStock = (
  productId: string | number | null = null,
) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const stableUser = useMemo(() => user, [user]);
  const [data, setData] = useState<ProductStockRecord[]>([]);
  const [loading, setLoading] = useState(!!(productId && stableUser?.businessID));

  const [prevProductId, setPrevProductId] = useState(productId);
  const [prevBusinessID, setPrevBusinessID] = useState(stableUser?.businessID);

  if (productId !== prevProductId || stableUser?.businessID !== prevBusinessID) {
    setPrevProductId(productId);
    setPrevBusinessID(stableUser?.businessID);
    setData([]);
    if (productId && stableUser?.businessID) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!productId || !stableUser?.businessID) {
      return;
    }

    const unsubscribe = listenAllProductStock(
      stableUser,
      productId,
      (newData) => {
        setData((prevData) => {
          if (JSON.stringify(prevData) !== JSON.stringify(newData)) {
            return newData;
          }
          return prevData;
        });
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [stableUser, productId]);

  return { data, loading };
};


// Hook para escuchar TODOS los productos en stock activos y agruparlos por producto
export const useListenAllActiveProductsStock = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const [data, setData] = useState<AggregatedProductStock[]>([]);
  const [loading, setLoading] = useState(!!user?.businessID);

  const [prevBusinessID, setPrevBusinessID] = useState(user?.businessID);

  if (user?.businessID !== prevBusinessID) {
    setPrevBusinessID(user?.businessID);
    setData([]);
    if (user?.businessID) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.businessID) {
      return;
    }

    try {
      const productStockCollectionRef = getProductStockCollectionRef(
        user.businessID,
      );
      if (!productStockCollectionRef) {
        // Si falla la ref, reseteamos asíncronamente o dejamos como está (render lo manejó si businessID era null, pero si businessID existe y esto falla...)
        // getProductStockCollectionRef solo falla si businessID es empty, cubierto por el check anterior.
        return;
      }

      const q = query(
        productStockCollectionRef,
        where('status', '==', 'active'),
        where('isDeleted', '==', false),
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const stockItems = querySnapshot.docs.map(
            (doc) => doc.data() as ProductStockRecord,
          );

          type GroupedStockBucket = {
            id: string | number;
            name: string;
            productName: string;
            totalStock: number;
            locations: Array<string | null | undefined>;
            batches: Set<string | number>;
            stockItems: ProductStockRecord[];
            hasExpiration: boolean;
            hasExpired?: boolean;
          };

          // Agrupar por productId y agregar información
          const groupedByProduct = stockItems.reduce<
            Record<string, GroupedStockBucket>
          >((acc, stock) => {
            const productId = stock.productId ?? stock.productID ?? stock.idProduct;
            if (!productId) return acc;
            const productKey = String(productId);

            if (!acc[productKey]) {
              acc[productKey] = {
                id: productId,
                name: stock.productName || 'Producto sin nombre',
                productName: stock.productName || 'Producto sin nombre',
                totalStock: 0,
                locations: [],
                batches: new Set(),
                stockItems: [],
                hasExpiration: false,
              };
            }

            acc[productKey].totalStock += Number(stock.quantity) || 0;
            acc[productKey].locations.push(
              typeof stock.location === 'string' ? stock.location : stock.location?.path,
            );
            acc[productKey].stockItems.push(stock);

            const expirationDate =
              normalizeToDate(stock.expirationDate) ||
              normalizeToDate(stock.expDate) ||
              normalizeToDate(stock.expiration);
            if (expirationDate) {
              acc[productKey].hasExpiration = true;
            }

            // Agregar batchId al Set si existe
            if (stock.batchId) {
              acc[productKey].batches.add(stock.batchId);
            }

            return acc;
          }, {});

          // Convertir a array, calcular agregados y ordenar por nombre
          const productsArray = Object.values(groupedByProduct)
            .map((product) => {
              const uniqueLocations = [...new Set(product.locations)];
              const uniqueBatches = product.batches.size;
              const stockRecords = product.stockItems.length;

              return {
                ...product,
                batches: undefined, // Remover el Set
                stockRecords, // Cantidad de registros de stock
                uniqueBatches, // Cantidad de lotes únicos
                uniqueLocations: uniqueLocations.length, // Cantidad de ubicaciones únicas
                // Agregar stockSummary compatible con el Tree NodeName
                hasExpiration: product.hasExpiration,
                hasExpired: product.hasExpired,
                stockSummary: {
                  totalLots: uniqueBatches,
                  totalUnits: product.totalStock,
                  directLots: uniqueBatches,
                  directUnits: product.totalStock,
                },
              };
            })
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

          setData(productsArray);
          setLoading(false);
        },
        (error) => {
          console.error(
            'Error al escuchar todos los productos en stock:',
            error,
          );
          setData([]);
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error al configurar listener de productos stock:', error);
    }
  }, [user?.businessID]);

  return { data, loading };
};

export const useInventoryProductIds = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const [data, setData] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(!!user?.businessID);

  const [prevBusinessID, setPrevBusinessID] = useState(user?.businessID);

  if (user?.businessID !== prevBusinessID) {
    setPrevBusinessID(user?.businessID);
    setData(new Set());
    if (user?.businessID) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.businessID) {
      return;
    }

    try {
      const productsRef = collection(
        db,
        'businesses',
        user.businessID,
        'products',
      );
      const unsubscribe = onSnapshot(
        productsRef,
        (snapshot) => {
          const ids = new Set(
            snapshot.docs.reduce((acc, doc) => {
              const productData = doc.data();
              if (!productData || productData?.isDeleted === true) {
                return acc;
              }

              const rawTrack = productData.trackInventory;

              // Excluir explícitamente si trackInventory es false
              if (
                rawTrack === false ||
                rawTrack === 0 ||
                rawTrack === 'false'
              ) {
                return acc;
              }

              // Incluir solo si trackInventory es explícitamente true
              const isInventoried =
                rawTrack === true ||
                rawTrack === 1 ||
                (typeof rawTrack === 'string' &&
                  [
                    'true',
                    'True',
                    'TRUE',
                    'si',
                    'Si',
                    'SI',
                    'sí',
                    'Sí',
                  ].includes(rawTrack.trim()));

              if (isInventoried) {
                acc.push(doc.id);
              }
              return acc;
            }, []),
          );
          setData(ids);
          setLoading(false);
        },
        (error) => {
          console.error('Error al escuchar productos inventariables:', error);
          setData(new Set());
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch (error) {
      console.error(
        'Error al configurar listener de productos inventariables:',
        error,
      );
    }
  }, [user?.businessID]);

  return { data, loading };
};

/* ==========================
   Exportación de Servicios
========================== */

export const getProductStockByBatch = async (
  user: InventoryUser,
  { productId, batchId, location }: ProductStockQueryParams = {},
  _signal?: AbortSignal,
) => {
  const productStockCollectionRef = getProductStockCollectionRef(
    user.businessID,
  );
  if (!productStockCollectionRef) return [];

  // Armamos los filtros dinámicamente
  const filters: QueryConstraint[] = [where('isDeleted', '==', false)];
  const normalizedLocation = buildLocationPath(location);

  if (productId) {
    filters.push(where('productId', '==', productId));
  }

  if (batchId) {
    filters.push(where('batchId', '==', batchId));
  }

  if (normalizedLocation) {
    filters.push(where('location', '==', normalizedLocation));
  }

  // Creamos la query con todos los filtros
  const q = query(productStockCollectionRef, ...filters);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

export const getProductStockByProductId = async (
  user: InventoryUser,
  { productId }: { productId?: string | number | null } = {},
) => {
  const productStockCollectionRef = getProductStockCollectionRef(
    user.businessID,
  );
  if (!productStockCollectionRef) return [];

  const q = query(
    productStockCollectionRef,
    where('isDeleted', '==', false),
    where('productId', '==', productId),
    where('status', '==', 'active'),
  );

  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((doc) => doc.data());

  return data;
};

// Obtener producto en stock por su ID
export const getProductStockById = async (
  user: InventoryUser,
  productStockId: string,
  _signal?: AbortSignal,
) => {
  if (!productStockId) return null;

  try {
    const productStockDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'productsStock',
      productStockId,
    );
    const snapshot = await getDoc(productStockDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error al obtener producto en stock por ID:', error);
    throw error;
  }
};

const buildLocationBounds = (
  locationPath: string | null | undefined = '',
) => {
  const normalized = buildLocationPath(locationPath);
  if (!normalized) return null;
  const upperBound = `${normalized}\uf8ff`;
  return { lower: normalized, upper: upperBound };
};

const EMPTY_AGGREGATE: StockAggregateSummary = {
  totalUnits: 0,
  totalLots: 0,
};

const fetchAggregateSnapshot = async (
  aggregateQuery: Query<DocumentData>,
): Promise<StockAggregateSummary> => {
  try {
    const snapshot = await getAggregateFromServer(aggregateQuery, {
      totalUnits: sum('quantity'),
      totalLots: count(),
    });
    const data = snapshot.data();
    return {
      totalUnits: data?.totalUnits ?? 0,
      totalLots: data?.totalLots ?? 0,
    };
  } catch (error) {
    console.error(
      'Error al obtener agregados de stock para la ubicación:',
      error,
    );
    return EMPTY_AGGREGATE;
  }
};

export const getLocationStockAggregates = async (
  user: InventoryUser | null | undefined,
  locationPath: string | null | undefined,
): Promise<StockAggregateSummary> => {
  if (!user?.businessID) return EMPTY_AGGREGATE;
  const bounds = buildLocationBounds(locationPath);
  if (!bounds) return EMPTY_AGGREGATE;

  const stockRef = getProductStockCollectionRef(user.businessID);
  if (!stockRef) return EMPTY_AGGREGATE;

  const baseQuery = query(
    stockRef,
    where('location', '>=', bounds.lower),
    where('location', '<', bounds.upper),
    where('isDeleted', '==', false),
    where('status', '==', 'active'),
  );

  return fetchAggregateSnapshot(baseQuery);
};

export const getLocationDirectStockAggregates = async (
  user: InventoryUser | null | undefined,
  locationPath: string | null | undefined,
): Promise<StockAggregateSummary> => {
  if (!user?.businessID) return EMPTY_AGGREGATE;
  const normalized = buildLocationPath(locationPath);
  if (!normalized) return EMPTY_AGGREGATE;

  const stockRef = getProductStockCollectionRef(user.businessID);
  if (!stockRef) return EMPTY_AGGREGATE;

  const baseQuery = query(
    stockRef,
    where('location', '==', normalized),
    where('isDeleted', '==', false),
    where('status', '==', 'active'),
  );

  return fetchAggregateSnapshot(baseQuery);
};

export const getLocationStockAggregatesDetailed = async (
  user: InventoryUser | null | undefined,
  locationPath: string | null | undefined,
): Promise<StockAggregateDetailedSummary> => {
  const totals = await getLocationStockAggregates(user, locationPath);
  const direct = await getLocationDirectStockAggregates(user, locationPath);

  return {
    totalUnits: totals.totalUnits,
    totalLots: totals.totalLots,
    directUnits: direct.totalUnits,
    directLots: direct.totalLots,
  };
};

export const getWarehouseStockAggregates = async (
  user: InventoryUser | null | undefined,
  warehouseId: string | number | null | undefined,
): Promise<StockAggregateSummary> => {
  return getLocationStockAggregates(user, warehouseId);
};

export const getWarehousesStockAggregates = async (
  user: InventoryUser | null | undefined,
  warehouseIds: Array<string | number> = [],
): Promise<Record<string, StockAggregateSummary>> => {
  if (!Array.isArray(warehouseIds) || warehouseIds.length === 0) return {};
  const summaries = await Promise.all(
    warehouseIds.map(async (id) => ({
      id: String(id),
      summary: await getWarehouseStockAggregates(user, id),
    })),
  );
  return summaries.reduce<Record<string, StockAggregateSummary>>(
    (acc, { id, summary }) => {
      acc[id] = summary;
      return acc;
    },
    {},
  );
};

export const getStockAggregatesByLocationPaths = async (
  user: InventoryUser | null | undefined,
  locationPaths: Array<string | null | undefined> = [],
): Promise<Record<string, StockAggregateDetailedSummary>> => {
  if (!Array.isArray(locationPaths) || locationPaths.length === 0) return {};
  const uniquePaths = Array.from(
    new Set(
      locationPaths
        .filter(Boolean)
        .map((path) => String(path).trim())
        .filter((path) => path.length > 0),
    ),
  );

  if (uniquePaths.length === 0) return {};

  const summaries = await Promise.all(
    uniquePaths.map(async (path) => ({
      path,
      summary: await getLocationStockAggregatesDetailed(user, path),
    })),
  );

  return summaries.reduce<Record<string, StockAggregateDetailedSummary>>(
    (acc, { path, summary }) => {
      acc[path] = summary;
      return acc;
    },
    {},
  );
};
