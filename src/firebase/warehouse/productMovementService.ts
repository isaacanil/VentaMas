import {
  and,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  or,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { Transaction, WriteBatch } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';

import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import type { InventoryStockItem, InventoryUser } from '@/utils/inventory/types';
import { db } from '../firebaseconfig';
import { getLocationName } from './locationService';
import {
  createProductStock,
  getProductStockByBatch,
  updateProductStock,
} from './productStockService';

type TransactionLike = Transaction | WriteBatch | null;

type MovementLogInput = {
  sourceLocation?: string | null;
  destinationLocation?: string | null;
  productId?: string | null;
  productName?: string | null;
  quantity: number;
  movementType: MovementType;
  movementReason: MovementReason;
  batchId?: string | null;
  notes?: string;
};

type MovementDoc = Record<string, unknown> & {
  id: string;
  sourceLocation?: string | null;
  destinationLocation?: string | null;
  createdAt?: { seconds?: number } | Date | null;
};

type MovementWithLocations = MovementDoc & {
  movementType: MovementType | 'in' | 'out' | 'unknown';
  sourceLocationName?: string | null;
  destinationLocationName?: string | null;
};

// Agregar funciones para crear y leer movimientos
export const createMovementLog = async (
  user: InventoryUser,
  {
    sourceLocation,
    destinationLocation,
    productId,
    productName,
    quantity,
    movementType,
    movementReason,
    batchId,
    notes,
  }: MovementLogInput,
  transaction: TransactionLike = null,
) => {
  // Usa una colección "movements" para almacenar
  const movementId = nanoid();
  const movementRef = doc(
    db,
    'businesses',
    user.businessID,
    'movements',
    movementId,
  );

  const movementData = {
    id: movementId,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    productId,
    productName,
    batchId,
    sourceLocation,
    destinationLocation,
    movementType,
    movementReason,
    quantity,
    notes,
    isDeleted: false,
  };
  // Usar transacción si está disponible, de lo contrario usar setDoc normal
  if (transaction) {
    transaction.set(movementRef, movementData);
  } else {
    await setDoc(movementRef, movementData);
  }
  return movementId;
};

export const getMovementsByLocation = async (
  user: InventoryUser,
  locationId: string | null | undefined,
) => {
  if (!locationId) return [] as MovementDoc[];

  try {
    const movementsRef = collection(
      db,
      'businesses',
      user.businessID,
      'movements',
    );

    // Firestore no soporta consultas OR directamente, así que hacemos dos consultas y combinamos
    const sourceQuery = query(
      movementsRef,
      where('sourceLocation', '==', locationId),
      where('isDeleted', '==', false),
    );

    const destinationQuery = query(
      movementsRef,
      where('destinationLocation', '==', locationId),
      where('isDeleted', '==', false),
    );

    const [sourceSnapshot, destinationSnapshot] = await Promise.all([
      getDocs(sourceQuery),
      getDocs(destinationQuery),
    ]);

    const sourceMovements = sourceSnapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
      movementType: 'out', // Cambiado de 'Salida' a 'out'
    })) as MovementDoc[];

    const destinationMovements = destinationSnapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
      movementType: 'in', // Cambiado de 'Entrada' a 'in'
    })) as MovementDoc[];

    // Combinar ambos conjuntos de movimientos
    return [...sourceMovements, ...destinationMovements].sort((a, b) => {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  } catch (error) {
    console.error('Error al obtener movimientos por ubicación:', error);
    throw error;
  }
};

type MoveProductParams = {
  user: InventoryUser;
  productId: string;
  batchId?: string | null;
  productName?: string | null;
  productStockId?: string | null;
  quantityToMove: number;
  sourceLocation: string;
  destinationLocation: string;
  comment?: string;
};

export const moveProduct = async ({
  user,
  productId,
  batchId,
  productName,
  quantityToMove,
  sourceLocation,
  destinationLocation,
  comment,
}: MoveProductParams) => {
  // 1. Fetch stocks with location filter
  const matchingStocks = await getProductStockByBatch(user, {
    productId,
    batchId,
    location: sourceLocation,
  });

  // 2. Find source doc (now simpler since filtered by location)
  const sourceDoc = matchingStocks[0] as InventoryStockItem | undefined;

  const availableQty = Number(sourceDoc?.quantity ?? sourceDoc?.stock ?? 0);
  if (!sourceDoc || availableQty < quantityToMove) {
    throw new Error('Stock insuficiente en ubicación origen');
  }

  // 3. Update source
  const updatedSource = {
    ...sourceDoc,
    quantity: availableQty - quantityToMove,
  };
  if (updatedSource.quantity === 0) {
    await updateProductStock(user, { ...updatedSource, status: 'inactive' });
  } else {
    await updateProductStock(user, updatedSource);
  }

  // Registrar movimiento
  await createMovementLog(user, {
    sourceLocation,
    destinationLocation,
    productId: sourceDoc.productId,
    productName: productName || sourceDoc.productName || '',
    quantity: quantityToMove,
    movementType: MovementType.Exit,
    movementReason: MovementReason.Transfer,
    batchId,
    notes: comment || '',
  });

  // 4. Find destination stocks
  const destinationStocks = await getProductStockByBatch(user, {
    productId,
    batchId,
    location: destinationLocation,
  });
  const destinationDoc = destinationStocks[0] as InventoryStockItem | undefined;

  if (destinationDoc) {
    const updatedQuantity =
      Number(destinationDoc.quantity ?? destinationDoc.stock ?? 0) +
      quantityToMove;
    await updateProductStock(user, {
      ...destinationDoc,
      quantity: updatedQuantity,
      status: updatedQuantity > 0 ? 'active' : 'inactive',
    });
  } else {
    const newDestData = {
      ...sourceDoc,
      location: destinationLocation,
      quantity: quantityToMove,
      isDeleted: false,
      productId,
      productName: productName || sourceDoc.productName || '',
    };
    await createProductStock(user, newDestData);
  }

  return { success: true };
};

// Hook modificado para incluir la comparación con params
export const useListenMovementsByLocation = (
  user: InventoryUser | null | undefined,
  locationId: string | null | undefined,
  currentLocationId: string | null | undefined,
) => {
  const [data, setData] = useState<MovementWithLocations[]>([]);
  const [loading, setLoading] = useState(
    () => Boolean(user?.businessID && locationId),
  );

  useEffect(() => {
    if (!user || !user.businessID || !locationId) {
      return undefined;
    }

    const movementsRef = collection(
      db,
      'businesses',
      user.businessID,
      'movements',
    );
    const q = query(
      movementsRef,
      and(
        or(
          where('sourceLocation', '==', locationId),
          where('destinationLocation', '==', locationId),
        ),
        where('isDeleted', '==', false),
      ),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const movementsPromises = snapshot.docs.map(async (movementDoc) => {
        const movement = movementDoc.data() as MovementDoc;

        // Si el currentLocationId coincide con sourceLocation es una salida
        // Si coincide con destinationLocation es una entrada
        let movementType: MovementWithLocations['movementType'];

        if (
          currentLocationId === movement.sourceLocation &&
          currentLocationId === movement.destinationLocation
        ) {
          movementType = 'unknown';
        } else if (
          currentLocationId === movement.sourceLocation &&
          currentLocationId !== movement.destinationLocation
        ) {
          movementType = 'out';
        } else if (
          currentLocationId === movement.destinationLocation &&
          currentLocationId !== movement.sourceLocation
        ) {
          movementType = 'in';
        } else {
          movementType = 'unknown';
        }

        const [sourceName, destName] = await Promise.all([
          getLocationName(user, movement.sourceLocation || ''),
          getLocationName(user, movement.destinationLocation || ''),
        ]);

        return {
          ...movement,
          id: movementDoc.id,
          movementType,
          sourceLocationName: sourceName,
          destinationLocationName: destName,
        } as MovementWithLocations;
      });

      const movements = await Promise.all(movementsPromises);
      setData(movements);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, user?.businessID, locationId, currentLocationId]);

  return { data, loading };
};

type MovementRange = {
  startDate?: number;
  endDate?: number;
};

// Nuevo: Hook para escuchar todos los movimientos por rango de fechas (empresa completa)
export const useListenAllMovementsByDateRange = (
  user: InventoryUser | null | undefined,
  range: MovementRange = {},
) => {
  const [data, setData] = useState<MovementWithLocations[]>([]);
  const [loading, setLoading] = useState(
    () => Boolean(user?.businessID && range?.startDate && range?.endDate),
  );
  const { startDate, endDate } = range || {};

  useEffect(() => {
    const hasValidUser = !!(user && user.businessID);
    const hasValidDates =
      typeof startDate === 'number' &&
      typeof endDate === 'number' &&
      !Number.isNaN(startDate) &&
      !Number.isNaN(endDate);
    if (!hasValidUser || !hasValidDates) {
      return;
    }

    const movementsRef = collection(
      db,
      'businesses',
      user.businessID,
      'movements',
    );

    const startTs = Timestamp.fromMillis(startDate);
    const endTs = Timestamp.fromMillis(endDate);

    // Escucha todos los movimientos de esta empresa en el rango dado
    const q = query(
      movementsRef,
      and(
        where('isDeleted', '==', false),
        where('createdAt', '>=', startTs),
        where('createdAt', '<=', endTs),
      ),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const movementsPromises = snapshot.docs.map(async (movementDoc) => {
            const mv = movementDoc.data() as MovementDoc;
            const [sourceName, destName] = await Promise.all([
              getLocationName(user, mv.sourceLocation || ''),
              getLocationName(user, mv.destinationLocation || ''),
            ]);

            return {
              ...mv,
              id: movementDoc.id,
              sourceLocationName: sourceName,
              destinationLocationName: destName,
            } as MovementWithLocations;
          });
          const movements = await Promise.all(movementsPromises);
          setData(movements);
        } catch (e) {
          console.error('Error al mapear movimientos:', e);
          setData([]);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error al escuchar movimientos:', err);
        setData([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, startDate, endDate]);

  return { data, loading };
};
