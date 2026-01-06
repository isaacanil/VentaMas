import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  onSnapshot,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { nanoid } from 'nanoid'; // Importación correcta de nanoid
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';
import { deleteAllProductStocksByBatch } from './productStockService';
import type { Batch } from '@/models/Warehouse/Batch';
import type { InventoryUser } from '@/utils/inventory/types';

type BatchRecord = Partial<Batch> & Record<string, unknown>;

// Obtener referencia de la colección de batches para un negocio específico
const getBatchCollectionRef = (businessID) =>
  collection(db, 'businesses', businessID, 'batches');

// Crear un nuevo batch
export const createBatch = async (user, batchData: BatchRecord) => {
  const id = nanoid(); // Generar ID único
  try {
    const batchCollectionRef = getBatchCollectionRef(user.businessID);
    const batchDocRef = doc(batchCollectionRef, id);

    const batch = {
      ...batchData,
      id,
      isDeleted: false,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      status: 'active',
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    };

    await setDoc(batchDocRef, batch);

    return batch;
  } catch (error) {
    console.error('Error al añadir el batch:', error);
    throw error;
  }
};

// Obtener un batch por su ID
export const getBatchById = async (
  user,
  batchId,
  _signal?: AbortSignal,
) => {
  try {
    if (!batchId) return null;
    const batchDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'batches',
      batchId,
    );
    const snapshot = await getDoc(batchDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error al obtener el batch por ID:', error);
    throw error;
  }
};

// Leer todos los batches de un negocio, opcionalmente filtrados por productId
export const getAllBatches = async (user, productID = null) => {
  try {
    const batchCollectionRef = getBatchCollectionRef(user.businessID);
    let q;

    if (productID) {
      // Si se proporciona productID, filtrar los batches por este campo
      q = query(
        batchCollectionRef,
        where('productId', '==', productID),
        where('isDeleted', '==', false),
        where('status', '==', 'active'),
      );
    } else {
      // Sin filtro de productId, obtener todos los batches no eliminados
      q = query(batchCollectionRef, where('audit.isDeleted', '==', false));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));
  } catch (error) {
    console.error('Error al obtener los batches:', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los batches de un negocio específico, opcionalmente filtrados por productId
export const listenAllBatches = (user, productID = null, callback) => {
  try {
    const batchCollectionRef = getBatchCollectionRef(user.businessID);
    let q;

    if (productID) {
      q = query(batchCollectionRef, where('productId', '==', productID));
    } else {
      q = query(
        batchCollectionRef,
        where('isDeleted', '==', false), // Asegúrate de filtrar por isDeleted correctamente
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const batches = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Record<string, unknown>),
        }));
        callback(batches);
      },
      (error) => {
        console.error('Error al escuchar documentos en tiempo real:', error);
      },
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error al escuchar documentos en tiempo real:', error);
    throw error;
  }
};

// Escuchar batches específicos por sus IDs
export const listenAllBatchesByIds = (user, batchIDs = [], callback) => {
  try {
    // Verificar que user y user.businessID estén definidos
    if (!user || !user.businessID) {
      console.error('User o user.businessID no están definidos');

      return undefined; // Retorna una función de limpieza vacía
    }

    // Verificar que batchIDs es un array válido y no está vacío
    if (!Array.isArray(batchIDs) || batchIDs.length === 0) {
      console.warn('No se proporcionaron batch IDs para escuchar');

      return undefined;
    }

    const unsubscribeFuncs = [];

    // Iterar sobre cada batchID y crear un listener para cada uno
    batchIDs.forEach((batchID) => {
      if (!batchID) {
        console.warn('Skipping invalid batchID:', batchID);
        return;
      }

      const batchDocRef = doc(
        db,
        'businesses',
        user.businessID,
        'batches',
        batchID,
      );

      const unsubscribe = onSnapshot(
        batchDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const updatedBatch = { id: docSnapshot.id, ...docSnapshot.data() };

            // Actualizar el estado de los batches
            callback((prevBatches) => {
              // Si prevBatches es undefined, inicializarlo como un array vacío
              const previous = prevBatches || [];
              // Actualizar o agregar el batch
              const batchExists = previous.some(
                (batch) => batch.id === updatedBatch.id,
              );
              if (batchExists) {
                return previous.map((batch) =>
                  batch.id === updatedBatch.id ? updatedBatch : batch,
                );
              }
              return [...previous, updatedBatch];
            });
          } else {
            console.warn(
              `Batch con ID ${batchID} no existe en la base de datos.`,
            );
          }
        },
        (error) => {
          console.error('Error escuchando batch por ID:', error);
        },
      );

      unsubscribeFuncs.push(unsubscribe);
    });

    // Retornar una función de limpieza que cancela todos los listeners
    return () => {
      unsubscribeFuncs.forEach((unsubscribe) => unsubscribe());
    };
  } catch (error) {
    console.error('Error in listenAllBatchesByIds service:', error);
    throw error;
  }
};

// Actualizar un batch existente
export const updateBatch = async (user, data) => {
  try {
    const batchDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'batches',
      data.id,
    );
    await updateDoc(batchDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return data;
  } catch (error) {
    console.error('Error al actualizar el batch:', error);
    throw error;
  }
};

// Función para revisar el estado del batch en función de los productStocks asociadosociados
export async function updateBatchStatusForProductStock(
  businessID,
  batchId,
  productId,
) {
  // Consulta todos los productStock que pertenecen a ese batch y producto
  const productStockQuery = query(
    collection(db, 'businesses', businessID, 'productsStock'),
    where('isDeleted', '==', false),
    where('status', '==', 'active'),
    where('batchId', '==', batchId),
    where('productId', '==', productId),
    where('quantity', '>', 0),
  );

  const querySnapshot = await getDocs(productStockQuery);

  let totalQuantity = 0;
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    totalQuantity += data.quantity || 0;
  });

  // Referencia al documento del batch
  const batchRef = doc(db, 'businesses', businessID, 'batches', batchId);

  if (totalQuantity <= 0) {
    // Si en conjunto no hay stock, se marca el batch como inactivo
    await updateDoc(batchRef, {
      quantity: 0,
      status: 'inactive',
      updatedAt: serverTimestamp(),
    });
  }
}

// Marcar un batch como eliminado
export const deleteBatch = async ({ user, batchId, movement }) => {
  try {
    const batchDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'batches',
      batchId,
    );
    const batchSnap = await getDoc(batchDocRef);

    if (!batchSnap.exists()) throw new Error('Lote no encontrado');

    const batchData = batchSnap.data();

    const deletionResult = await deleteAllProductStocksByBatch({
      user,
      batchId,
      movement,
    });

    await updateDoc(batchDocRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: user.uid,
    });

    return { ...batchData, deletionDetails: deletionResult };
  } catch (error) {
    console.error('Error al marcar el batch como eliminado:', error);
    throw error;
  }
};

// Custom Hook para escuchar batches por IDs
export const useListenBatchesByIds = (batchIDs = []) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const [data, setData] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(
    () => Array.isArray(batchIDs) && batchIDs.length > 0 && Boolean(user?.businessID),
  );
  const [error, setError] = useState<unknown | null>(null);

  const stableBatchIDs = useMemo(
    () => (Array.isArray(batchIDs) ? batchIDs : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(batchIDs)],
  );

  useEffect(() => {
    // Validaciones iniciales
    if (stableBatchIDs.length === 0 || !user?.businessID) {
      setData([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    // Escuchar en tiempo real los IDs de batches
    const unsubscribe = listenAllBatchesByIds(
      user,
      stableBatchIDs,
      (updatedBatches) => {
        try {
          setData(updatedBatches);
          setLoading(false);
        } catch (callbackError) {
          console.error('Error en el callback de onSnapshot:', callbackError);
          setError(callbackError);
        }
      },
    );

    // Cleanup
    return () => unsubscribe?.();
  }, [stableBatchIDs, user]);

  return { data, loading, error };
};

export const checkAndDeleteEmptyBatch = async ({
  user,
  batchId,
  transaction,
}) => {
  try {
    const batchDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'batches',
      batchId,
    );

    // Obtener documento usando transacción si está disponible
    const batchSnap = transaction
      ? await transaction.get(batchDocRef)
      : await getDoc(batchDocRef);

    if (!batchSnap.exists()) {
      throw new Error('Lote no encontrado');
    }

    const batchData = batchSnap.data();

    // Consultar stocks asociados
    const productStocksRef = collection(
      db,
      'businesses',
      user.businessID,
      'productStocks',
    );
    const q = query(
      productStocksRef,
      where('batchId', '==', batchId),
      where('isDeleted', '==', false),
    );

    // Obtener documentos con/sin transacción
    const productStocksSnap = transaction
      ? await transaction.get(q)
      : await getDocs(q);

    if (productStocksSnap.empty) {
      const updateData = {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: user.uid,
      };

      // Usar transacción si está disponible
      if (transaction) {
        transaction.update(batchDocRef, updateData);
      } else {
        await updateDoc(batchDocRef, updateData);
      }

      return {
        success: true,
        message: 'Batch eliminado automáticamente por no tener stock',
        batchData,
      };
    }

    return {
      success: false,
      message: 'El batch aún tiene productos en stock',
      remainingStocks: productStocksSnap.size,
    };
  } catch (error) {
    console.error('Error al verificar y eliminar batch:', error);
    throw error;
  }
};
