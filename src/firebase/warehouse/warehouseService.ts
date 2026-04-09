import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  onSnapshot,
  where,
  query,
  limit,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { db, functions } from '../firebaseconfig';
import type { Warehouse } from '@/models/Warehouse/Warehouse';
import type { InventoryUser } from '@/utils/inventory/types';

type WarehouseRecord = Partial<Warehouse> & Record<string, unknown>;
type WarehouseListener = (data: WarehouseRecord[]) => void;
type WarehouseDocListener = (data: WarehouseRecord | null) => void;

const defaultWarehouseInFlight = new Map<
  string,
  Promise<WarehouseRecord | null>
>();

// Crear un nuevo almacén
export const createWarehouse = async (
  user: InventoryUser,
  warehouseData: WarehouseRecord,
): Promise<WarehouseRecord> => {
  try {
    if (!user?.businessID) {
      throw new Error('No se pudo identificar el negocio actual.');
    }
    const { sessionToken } = getStoredSession();
    const createWarehouseCallable = httpsCallable<
      {
        businessId: string;
        warehouse: WarehouseRecord;
        sessionToken?: string;
      },
      {
        ok: boolean;
        warehouse?: WarehouseRecord;
      }
    >(functions, 'createWarehouse');

    const response = await createWarehouseCallable({
      businessId: user.businessID,
      warehouse: warehouseData,
      ...(sessionToken ? { sessionToken } : {}),
    });
    return response.data?.warehouse ?? warehouseData;
  } catch (error) {
    console.error('Error al crear el almacén:', error);
    throw error;
  }
};

// Obtener todos los almacenes de un negocio
export const getWarehouses = async (
  user: InventoryUser,
): Promise<WarehouseRecord[]> => {
  const warehouseCollectionRef = collection(
    db,
    'businesses',
    user.businessID,
    'warehouses',
  );

  try {
    const querySnapshot = await getDocs(warehouseCollectionRef);
    return querySnapshot.docs.map((doc) => doc.data() as WarehouseRecord);
  } catch (error) {
    console.error('Error al obtener almacenes:', error);
    throw error;
  }
};

// Escuchar todos los almacenes en tiempo real
export const listenAllWarehouses = (
  user: InventoryUser,
  callback: WarehouseListener,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const warehouseCollectionRef = collection(
    db,
    'businesses',
    user.businessID,
    'warehouses',
  );

  return onSnapshot(
    warehouseCollectionRef,
    (querySnapshot) => {
      const filteredData = querySnapshot.docs
        .map((doc) => doc.data() as WarehouseRecord)
        .filter((data) => data.isDeleted !== true);
      callback(filteredData);
    },
    (error) => {
      console.error('Error al obtener documentos en tiempo real:', error);
      if (onError) onError(error);
    },
  );
};

// Obtener un almacén específico por ID
export const getWarehouse = async (
  user: InventoryUser,
  id: string,
): Promise<WarehouseRecord | null> => {
  const warehouseDocReference = doc(
    db,
    'businesses',
    user.businessID,
    'warehouses',
    id,
  );

  try {
    const warehouseDoc = await getDoc(warehouseDocReference);
    return warehouseDoc.exists()
      ? (warehouseDoc.data() as WarehouseRecord)
      : null;
  } catch (error) {
    console.error('Error al obtener el almacén:', error);
    throw error;
  }
};

// Escuchar un almacén específico en tiempo real
export const listenWarehouse = (
  user: InventoryUser,
  id: string,
  callback: WarehouseDocListener,
): Unsubscribe => {
  const warehouseDocReference = doc(
    db,
    'businesses',
    user.businessID,
    'warehouses',
    id,
  );

  return onSnapshot(
    warehouseDocReference,
    (docSnapshot) =>
      callback(
        docSnapshot.exists() ? (docSnapshot.data() as WarehouseRecord) : null,
      ),
    (error) => console.error('Error al obtener el almacén:', error),
  );
};

// Actualizar un almacén
export const updateWarehouse = async (
  user: InventoryUser,
  id: string,
  updatedData: WarehouseRecord,
): Promise<WarehouseRecord> => {
  const warehouseDocReference = doc(
    db,
    'businesses',
    user.businessID,
    'warehouses',
    id,
  );

  try {
    await updateDoc(warehouseDocReference, {
      ...updatedData,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return updatedData;
  } catch (error) {
    console.error('Error al actualizar el almacén:', error);
    throw error;
  }
};

// Borrar un almacén (marcar como eliminado)
export const deleteWarehouse = async (
  user: InventoryUser,
  id: string,
): Promise<string> => {
  const warehouseDocReference = doc(
    db,
    'businesses',
    user.businessID,
    'warehouses',
    id,
  );

  try {
    await updateDoc(warehouseDocReference, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: user.uid,
    });
    return id;
  } catch (error) {
    console.error('Error al borrar el almacén:', error);
    throw error;
  }
};

// Obtener almacen por defecto (solo lectura)
export const getDefaultWarehouse = async (
  user: InventoryUser,
): Promise<WarehouseRecord | null> => {
  if (!user?.businessID) return null;

  const existingPromise = defaultWarehouseInFlight.get(user.businessID);
  if (existingPromise) return existingPromise;

  const promise = (async () => {
    const warehouseCollectionRef = collection(
      db,
      'businesses',
      user.businessID,
      'warehouses',
    );
    const defaultWarehouseQuery = query(
      warehouseCollectionRef,
      where('defaultWarehouse', '==', true),
      limit(10),
    );

    try {
      const querySnapshot = await getDocs(defaultWarehouseQuery);
      if (querySnapshot.empty) return null;

      const docSnapshot =
        querySnapshot.docs.find((doc) => doc.data()?.isDeleted !== true) ||
        querySnapshot.docs[0];
      const data = docSnapshot.data() as WarehouseRecord;
      return {
        ...data,
        id: (data.id as string | undefined) || docSnapshot.id,
      };
    } catch (error) {
      console.error('Error al obtener el almacen por defecto:', error);
      throw error;
    }
  })();

  defaultWarehouseInFlight.set(user.businessID, promise);
  try {
    return await promise;
  } finally {
    defaultWarehouseInFlight.delete(user.businessID);
  }
};

export const setDefaultWarehouse = async (
  user: InventoryUser,
  warehouseId: string,
): Promise<WarehouseRecord | undefined> => {
  if (!user?.businessID)
    throw new Error('No se pudo identificar el negocio actual.');
  if (!warehouseId) throw new Error('Identificador de almacén inválido.');

  const warehouseCollectionRef = collection(
    db,
    'businesses',
    user.businessID,
    'warehouses',
  );
  const targetWarehouseRef = doc(warehouseCollectionRef, warehouseId);

  const targetSnapshot = await getDoc(targetWarehouseRef);
  if (!targetSnapshot.exists()) {
    throw new Error('El almacén seleccionado no existe.');
  }

  if (targetSnapshot.data()?.defaultWarehouse) {
    return targetSnapshot.data() as WarehouseRecord | undefined;
  }

  const batch = writeBatch(db);
  const currentDefaultsSnapshot = await getDocs(
    query(warehouseCollectionRef, where('defaultWarehouse', '==', true)),
  );

  currentDefaultsSnapshot.forEach((docSnapshot) => {
    if (
      docSnapshot.id !== warehouseId &&
      docSnapshot.data()?.defaultWarehouse
    ) {
      batch.update(docSnapshot.ref, {
        defaultWarehouse: false,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
    }
  });

  batch.update(targetWarehouseRef, {
    defaultWarehouse: true,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  });

  await batch.commit();

  const updatedSnapshot = await getDoc(targetWarehouseRef);
  return updatedSnapshot.data() as WarehouseRecord | undefined;
};

// Hook para crear y obtener el almacén por defecto
export const useDefaultWarehouse = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const [defaultWarehouse, setDefaultWarehouseState] =
    useState<WarehouseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: Unsubscribe | undefined;

    const fetchDefaultWarehouse = async () => {
      if (!user?.businessID) {
        if (isMounted) {
          setDefaultWarehouseState(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const ensuredDefault = await getDefaultWarehouse(user);
        if (isMounted && ensuredDefault) {
          setDefaultWarehouseState(ensuredDefault);
        }

        const warehouseCollectionRef = collection(
          db,
          'businesses',
          user.businessID,
          'warehouses',
        );
        const defaultWarehouseQuery = query(
          warehouseCollectionRef,
          where('defaultWarehouse', '==', true),
        );

        unsubscribe = onSnapshot(
          defaultWarehouseQuery,
          (snapshot) => {
            if (!isMounted) return;
            if (!snapshot.empty) {
              setDefaultWarehouseState(snapshot.docs[0].data());
              setLoading(false);
              return;
            }

            getDefaultWarehouse(user)
              .then((warehouse) => {
                if (!isMounted) return;
                setDefaultWarehouseState(warehouse || null);
              })
              .catch((ensureError) => {
                if (!isMounted) return;
                setError(ensureError);
              })
              .finally(() => {
                if (!isMounted) return;
                setLoading(false);
              });
          },
          (snapshotError) => {
            if (!isMounted) return;
            setError(snapshotError);
            setLoading(false);
          },
        );
      } catch (fetchError) {
        if (!isMounted) return;
        setError(fetchError);
        setLoading(false);
      }
    };

    fetchDefaultWarehouse();

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  return { defaultWarehouse, loading, error };
};

// Hooks para escuchar almacenes en tiempo real
export const useListenWarehouse = (id: string | null) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const [data, setData] = useState<WarehouseRecord | null>(null);
  const [loading, setLoading] = useState(() => Boolean(id));
  const [error] = useState<unknown | null>(null);

  useEffect(() => {
    if (!id || !user) {
      return;
    }

    const unsubscribe = listenWarehouse(user, id, (data) => {
      setData(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id, user]);

  return { data, loading, error };
};

export const useListenWarehouses = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const [data, setData] = useState<WarehouseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<unknown | null>(null);

  useEffect(() => {
    if (!user?.businessID) {
      return;
    }

    const unsubscribe = listenAllWarehouses(user, (data) => {
      setData(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return { data, loading, error };
};

export const useGetWarehouseData = (items: unknown[]) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const [data, _setData] = useState<{
    warehouses: WarehouseRecord[];
    shelves: WarehouseRecord[];
    rows: WarehouseRecord[];
    segments: WarehouseRecord[];
  }>({
    warehouses: [],
    shelves: [],
    rows: [],
    segments: [],
  });
  const [loading, _setLoading] = useState(false);
  const [error] = useState<unknown | null>(null);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;
  }, [items, user]);

  return { data, loading, error };
};
