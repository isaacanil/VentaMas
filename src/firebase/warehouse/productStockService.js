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
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { MovementReason, MovementType } from '../../models/Warehouse/Movement';
import { db } from '../firebaseconfig';

const normalizeToDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.seconds === 'number') {
    const parsed = new Date(value.seconds * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Obtener referencia de la colección de productos en stock
export const getProductStockCollectionRef = (businessID) => {
  if (!businessID) {
    console.warn('businessID is empty. Skipping collection reference.');
    return null; // Return early or handle gracefully
  }
  return collection(db, 'businesses', businessID, 'productsStock');
};

const buildLocationPath = (rawLocation) => {
  if (!rawLocation) return '';
  if (typeof rawLocation === 'string') return rawLocation;
  if (typeof rawLocation === 'object') {
    if (typeof rawLocation.path === 'string') return rawLocation.path;
    if (Array.isArray(rawLocation.pathSegments)) {
      return rawLocation.pathSegments.filter(Boolean).join('/');
    }
    const {
      warehouse,
      warehouseId,
      shelf,
      shelfId,
      row,
      rowId,
      segment,
      segmentId,
    } = rawLocation;
    return [
      warehouse || warehouseId,
      shelf || shelfId,
      row || rowId,
      segment || segmentId,
    ]
      .filter(Boolean)
      .join('/');
  }
  return '';
};

// Crear un nuevo producto en stock
export const createProductStock = async (user, productStockData = {}) => {
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
export const getAllProductStocks = async (user) => {
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
export const updateProductStock = async (user, data) => {
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
          notes: `${movement.notes || ''} - Eliminación por batch ${batchId}`,
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

    const stockData = stockDoc.data();
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
    const batchRef = doc(db, 'businesses', businessID, 'batches', batchId);
    const productRef = doc(db, 'businesses', businessID, 'products', productId);

    // 4. Validate batch exists
    const batchDoc = await getDoc(batchRef);
    if (!batchDoc.exists()) {
      throw new Error('Associated batch not found');
    }

    // 5. Validate quantity
    const quantityToRemove = movement?.quantity || stockQuantity;
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

    // 7. Perform updates (no transacciones: cada operación es individual)
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
export const listenAllProductStock = (user, productId, callback) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noOp = () => { };

  if (!user || !productId || !callback) {
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
        const data = querySnapshot.docs.map((doc) => doc.data());
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
export const listenAllProductStockByLocation = (user, location, callback) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noOp = () => { };

  if (!user || !location || !callback) {
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
      where('location', '==', location),
      where('isDeleted', '==', false),
      where('status', '==', 'active'),
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => doc.data());
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

// Hook para escuchar productos en stock por ubicación
export const useListenProductsStockByLocation = (location = null) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay location, user o businessID, limpiamos y salimos.
    if (!location || !user || !user.businessID) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenAllProductStockByLocation(
      user,
      location,
      (updatedProducts) => {
        setData(updatedProducts);
        setLoading(false);
      },
    );

    // Limpiamos el listener al desmontar
    return () => unsubscribe();
  }, [user, location]);

  return { data, loading };
};

// Hook para escuchar productos en stock por producto
export const useListenProductsStock = (productId = null) => {
  const user = useSelector(selectUser);
  const stableUser = useMemo(() => user, [user]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId || !stableUser || !stableUser.businessID) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

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

/* ==========================
   Exportación de Servicios
========================== */

export const getProductStockByBatch = async (
  user,
  { productId, batchId, location } = {},
) => {
  const productStockCollectionRef = getProductStockCollectionRef(
    user.businessID,
  );
  if (!productStockCollectionRef) return [];

  // Armamos los filtros dinámicamente
  const filters = [where('isDeleted', '==', false)];

  if (productId) {
    filters.push(where('productId', '==', productId));
  }

  if (batchId) {
    filters.push(where('batchId', '==', batchId));
  }

  if (location) {
    filters.push(where('location', '==', location));
  }

  // Creamos la query con todos los filtros
  const q = query(productStockCollectionRef, ...filters);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

export const getProductStockByProductId = async (user, { productId } = {}) => {
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
export const getProductStockById = async (user, productStockId) => {
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

const buildLocationBounds = (locationPath = '') => {
  const normalized = String(locationPath || '').trim();
  if (!normalized) return null;
  const upperBound = `${normalized}\uf8ff`;
  return { lower: normalized, upper: upperBound };
};

const EMPTY_AGGREGATE = Object.freeze({ totalUnits: 0, totalLots: 0 });

const fetchAggregateSnapshot = async (aggregateQuery) => {
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

export const getLocationStockAggregates = async (user, locationPath) => {
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

export const getLocationDirectStockAggregates = async (user, locationPath) => {
  if (!user?.businessID) return EMPTY_AGGREGATE;
  const normalized = String(locationPath || '').trim();
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
  user,
  locationPath,
) => {
  const totals = await getLocationStockAggregates(user, locationPath);
  const direct = await getLocationDirectStockAggregates(user, locationPath);

  return {
    totalUnits: totals.totalUnits,
    totalLots: totals.totalLots,
    directUnits: direct.totalUnits,
    directLots: direct.totalLots,
  };
};

export const getWarehouseStockAggregates = async (user, warehouseId) => {
  return getLocationStockAggregates(user, warehouseId);
};

export const getWarehousesStockAggregates = async (user, warehouseIds = []) => {
  if (!Array.isArray(warehouseIds) || warehouseIds.length === 0) return {};
  const summaries = await Promise.all(
    warehouseIds.map(async (id) => ({
      id,
      summary: await getWarehouseStockAggregates(user, id),
    })),
  );
  return summaries.reduce((acc, { id, summary }) => {
    acc[id] = summary;
    return acc;
  }, {});
};

export const getStockAggregatesByLocationPaths = async (
  user,
  locationPaths = [],
) => {
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

  return summaries.reduce((acc, { path, summary }) => {
    acc[path] = summary;
    return acc;
  }, {});
};

// Hook para escuchar TODOS los productos en stock activos y agruparlos por producto
export const useListenAllActiveProductsStock = () => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.businessID) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const productStockCollectionRef = getProductStockCollectionRef(
        user.businessID,
      );
      if (!productStockCollectionRef) {
        setData([]);
        setLoading(false);
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
          const stockItems = querySnapshot.docs.map((doc) => doc.data());

          // Agrupar por productId y agregar información
          const groupedByProduct = stockItems.reduce((acc, stock) => {
            const productId = stock.productId;
            if (!productId) return acc;

            if (!acc[productId]) {
              acc[productId] = {
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

            acc[productId].totalStock += Number(stock.quantity) || 0;
            acc[productId].locations.push(stock.location);
            acc[productId].stockItems.push(stock);

            const expirationDate =
              normalizeToDate(stock.expirationDate) ||
              normalizeToDate(stock.expDate) ||
              normalizeToDate(stock.expiration);
            if (expirationDate) {
              acc[productId].hasExpiration = true;
            }

            // Agregar batchId al Set si existe
            if (stock.batchId) {
              acc[productId].batches.add(stock.batchId);
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
      setData([]);
      setLoading(false);
    }
  }, [user?.businessID]);

  return { data, loading };
};

export const useInventoryProductIds = () => {
  const user = useSelector(selectUser);
  const [data, setData] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.businessID) {
      setData(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);

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
      setData(new Set());
      setLoading(false);
    }
  }, [user?.businessID]);

  return { data, loading };
};
