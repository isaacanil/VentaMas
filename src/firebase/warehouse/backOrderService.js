import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

export const convertTimestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return new Date(timestamp);
};

// Helpers: “estado inicial” por key (businessID / businessID+productId)
const makeBaseState = (key, isActive) => ({
  key: key ?? null,
  data: [],
  loading: !!isActive,
  error: null,
});

/**
 * Listener simple (sin enrichment)
 */
export const useListenBackOrders = (user) => {
  const businessID = user?.businessID ?? null;

  const [state, setState] = useState(() =>
    makeBaseState(businessID, businessID),
  );

  // View “keyed”: si cambió el businessID, NO seteamos nada;
  // simplemente devolvemos un estado “nuevo” y dejamos que el efecto lo llene.
  const view = state.key === businessID
    ? state
    : makeBaseState(businessID, businessID);

  useEffect(() => {
    if (!businessID) return;

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
          };
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
  const user = useSelector(selectUser);
  const businessID = user?.businessID ?? null;

  const [state, setState] = useState(() =>
    makeBaseState(businessID, businessID),
  );

  const view = state.key === businessID
    ? state
    : makeBaseState(businessID, businessID);

  // Cache por businessID (para no mezclar nombres entre negocios)
  const productCacheRef = useRef({ businessID: null, map: new Map() });

  useEffect(() => {
    if (!businessID) return;

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

    const getProductName = async (productId) => {
      if (!productId) return null;

      const cache = productCacheRef.current.map;

      // Soporta cache de string o de Promise (evita duplicar fetches en paralelo)
      const cached = cache.get(productId);
      if (typeof cached === 'string') return cached;
      if (cached && typeof cached.then === 'function') return await cached;

      const p = (async () => {
        const productRef = doc(db, 'businesses', businessID, 'products', productId);
        const snap = await getDoc(productRef);
        return snap.exists() ? snap.data().name : null;
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
              };
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

export const createBackOrder = async (businessId, backOrderData) => {
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

export const updateBackOrder = async (businessId, backOrderId, updateData) => {
  const backOrderRef = doc(db, 'businesses', businessId, 'backOrders', backOrderId);
  await updateDoc(backOrderRef, { ...updateData, updatedAt: Timestamp.now() });
  return true;
};

export const getBackOrdersByProduct = async (businessId, productId) => {
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
    };
  });
};

export const useBackOrdersByProduct = (productId) => {
  const user = useSelector(selectUser);
  const businessID = user?.businessID ?? null;

  const key = businessID && productId ? `${businessID}::${productId}` : null;

  const [state, setState] = useState(() => makeBaseState(key, key));
  const view = state.key === key ? state : makeBaseState(key, key);

  useEffect(() => {
    if (!businessID || !productId) return;

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
          };
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
