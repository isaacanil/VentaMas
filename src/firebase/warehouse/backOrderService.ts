import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { BackOrder } from '@/models/Warehouse/BackOrder';
import type { InventoryUser, TimestampLike } from '@/utils/inventory/types';

type BackOrderDoc = Omit<BackOrder, 'createdAt' | 'updatedAt'> & {
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
} & Record<string, unknown>;

type ListenerState<T> = {
  key: string | null;
  data: T[];
  loading: boolean;
  error: unknown | null;
};

export const convertTimestampToDate = (
  timestamp?: TimestampLike,
): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp?.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }
  return null;
};

// Helpers: estado inicial por key (businessID / businessID+productId)
const makeBaseState = <T>(key: string | null, isActive: unknown): ListenerState<T> => ({
  key: key ?? null,
  data: [],
  loading: Boolean(isActive),
  error: null,
});

/**
 * Listener simple (sin enrichment)
 */
export const useListenBackOrders = (user: InventoryUser | null | undefined) => {
  const businessID = user?.businessID ?? null;

  const [state, setState] = useState<ListenerState<BackOrderDoc>>(() =>
    makeBaseState(businessID, businessID),
  );

  // View keyed: si cambió el businessID, NO seteamos nada;
  // simplemente devolvemos un estado nuevo y dejamos que el efecto lo llene.
  const view =
    state.key === businessID
      ? state
      : makeBaseState<BackOrderDoc>(businessID, businessID);

  useEffect(() => {
    if (!businessID) return undefined;

    const ref = collection(db, 'businesses', businessID, 'backOrders');
    const q = query(ref);

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ...d,
            createdAt: convertTimestampToDate(d.createdAt),
            updatedAt: convertTimestampToDate(d.updatedAt),
          } as BackOrderDoc;
        });

        setState({
          key: businessID,
          data,
          loading: false,
          error: null,
        });
      },
      (err) => {
        console.error('Error listening to backOrders:', err);
        setState({
          key: businessID,
          data: [],
          loading: false,
          error: err,
        });
      },
    );
  }, [businessID]);

  return { data: view.data, loading: view.loading, error: view.error };
};

/**
 * Listener enriquecido (con productName)
 */
export const useEnrichedBackOrders = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const businessID = user?.businessID ?? null;

  const [state, setState] = useState<ListenerState<BackOrderDoc>>(() =>
    makeBaseState(businessID, businessID),
  );

  const view =
    state.key === businessID
      ? state
      : makeBaseState<BackOrderDoc>(businessID, businessID);

  // Cache por businessID (para no mezclar nombres entre negocios)
  const productCacheRef = useRef<{
    businessID: string | null;
    map: Map<string, string | Promise<string | null>>;
  }>({ businessID: null, map: new Map() });

  useEffect(() => {
    if (!businessID) return undefined;

    // reset cache cuando cambia el negocio
    if (productCacheRef.current.businessID !== businessID) {
      productCacheRef.current = { businessID, map: new Map() };
    }

    let cancelled = false;

    const backOrdersRef = collection(db, 'businesses', businessID, 'backOrders');
    const q = query(
      backOrdersRef,
      where('status', 'in', ['pending', 'reserved']),
    );

    const getProductName = async (productId?: string | null) => {
      if (!productId) return null;

      const cache = productCacheRef.current.map;

      // Soporta cache de string o de Promise (evita duplicar fetches en paralelo)
      const cached = cache.get(productId);
      if (typeof cached === 'string') return cached;
      if (cached && typeof cached.then === 'function') return await cached;

      const p = (async () => {
        const productRef = doc(db, 'businesses', businessID, 'products', productId);
        const snap = await getDoc(productRef);
        return snap.exists() ? (snap.data().name as string) : null;
      })();

      cache.set(productId, p);

      try {
        const name = await p;
        cache.set(productId, name || 'Producto no encontrado');
        return name || 'Producto no encontrado';
      } catch {
        cache.set(productId, 'Producto no encontrado');
        return 'Producto no encontrado';
      }
    };

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const enriched = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const d = docSnap.data();
              const productName =
                d?.productName ||
                (d?.productId ? await getProductName(d.productId) : null) ||
                'Producto no encontrado';

              return {
                id: docSnap.id,
                ...d,
                productName,
                createdAt: convertTimestampToDate(d.createdAt),
                updatedAt: convertTimestampToDate(d.updatedAt),
              } as BackOrderDoc;
            }),
          );

          if (cancelled) return;

          setState({
            key: businessID,
            data: enriched,
            loading: false,
            error: null,
          });
        } catch (err) {
          if (cancelled) return;
          console.error('Error enriching backOrders:', err);
          setState({
            key: businessID,
            data: [],
            loading: false,
            error: err,
          });
        }
      },
      (err) => {
        if (cancelled) return;
        console.error('Error listening to enriched backOrders:', err);
        setState({
          key: businessID,
          data: [],
          loading: false,
          error: err,
        });
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [businessID]);

  return { data: view.data, loading: view.loading, error: view.error };
};

export const createBackOrder = async (
  businessId: string,
  backOrderData: Partial<BackOrderDoc>,
) => {
  const backOrdersRef = collection(db, 'businesses', businessId, 'backOrders');
  const newBackOrder = {
    ...backOrderData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'pending',
  };
  await addDoc(backOrdersRef, newBackOrder);
  return true;
};

export const updateBackOrder = async (
  businessId: string,
  backOrderId: string,
  updateData: Partial<BackOrderDoc>,
) => {
  const backOrderRef = doc(db, 'businesses', businessId, 'backOrders', backOrderId);
  await updateDoc(backOrderRef, { ...updateData, updatedAt: Timestamp.now() });
  return true;
};

export const getBackOrdersByProduct = async (
  businessId: string,
  productId: string,
): Promise<BackOrderDoc[]> => {
  const backOrdersRef = collection(db, 'businesses', businessId, 'backOrders');
  const q = query(
    backOrdersRef,
    where('productId', '==', productId),
    where('status', 'in', ['pending', 'reserved']),
  );

  const result = await getDocs(q);
  return result.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      ...d,
      createdAt: convertTimestampToDate(d.createdAt),
      updatedAt: convertTimestampToDate(d.updatedAt),
    } as BackOrderDoc;
  });
};

export const useBackOrdersByProduct = (productId: string | null) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const businessID = user?.businessID ?? null;

  const key = businessID && productId ? `${businessID}::${productId}` : null;

  const [state, setState] = useState<ListenerState<BackOrderDoc>>(() =>
    makeBaseState(key, key),
  );
  const view = state.key === key ? state : makeBaseState<BackOrderDoc>(key, key);

  useEffect(() => {
    if (!businessID || !productId) return undefined;

    const backOrdersRef = collection(db, 'businesses', businessID, 'backOrders');
    const q = query(
      backOrdersRef,
      where('productId', '==', productId),
      where('status', 'in', ['pending', 'reserved']),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ...d,
            createdAt: convertTimestampToDate(d.createdAt),
            updatedAt: convertTimestampToDate(d.updatedAt),
          } as BackOrderDoc;
        });

        setState({
          key: `${businessID}::${productId}`,
          data,
          loading: false,
          error: null,
        });
      },
      (err) => {
        console.error('Error listening to product backOrders:', err);
        setState({
          key: `${businessID}::${productId}`,
          data: [],
          loading: false,
          error: err,
        });
      },
    );
  }, [businessID, productId]);

  return { data: view.data, loading: view.loading, error: view.error };
};
