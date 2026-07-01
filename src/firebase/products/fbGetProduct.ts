import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { normalizeProductForRead } from '@/domain/products/normalization';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

// Función para obtener un producto una sola vez
export const fbGetProduct = async (
  user: UserWithBusiness,
  productId: string,
): Promise<(ProductRecord & { id: string }) | null> => {
  const productRef = doc(
    db,
    'businesses',
    user.businessID,
    'products',
    productId,
  );
  const productSnapshot = await getDoc(productRef);
  if (productSnapshot.exists()) {
    return normalizeProductForRead({
      id: productSnapshot.id,
      ...(productSnapshot.data() as ProductRecord),
    }) as ProductRecord & { id: string };
  } else {
    return null; // Producto no encontrado
  }
};

// Función para escuchar cambios en tiempo real de un producto
export const fbListenProduct = (
  user: UserWithBusiness,
  productId: string,
  setProduct: (value: ProductRecord | null) => void,
  setError: (value: string | null) => void,
  setLoading: (value: boolean) => void,
): (() => void) => {
  const productRef = doc(
    db,
    'businesses',
    user.businessID,
    'products',
    productId,
  );

  const unsubscribe = onSnapshot(
    productRef,
    (doc) => {
      if (doc.exists()) {
        setProduct(
          normalizeProductForRead({
            id: doc.id,
            ...(doc.data() as ProductRecord),
          }),
        );
        setError(null);
      } else {
        setProduct(null); // Producto no encontrado
        setError('Producto no encontrado');
      }
      setLoading(false);
    },
    (error) => {
      console.error('Error al obtener el producto:', error);
      setError('Error al obtener el producto');
      setLoading(false);
    },
  );

  return unsubscribe;
};

// Hook para escuchar el producto
type ProductSnapshotState = {
  scopeKey: string | null;
  data: ProductRecord | null;
  error: string | null;
};

export const useListenProduct = (productId: string | null | undefined) => {
  const user = useSelector(selectUser) as UserWithBusiness | null | undefined;
  const businessID = user?.businessID ?? null;
  const scopeKey = businessID && productId ? `${businessID}:${productId}` : null;
  const [snapshotState, setSnapshotState] = useState<ProductSnapshotState>({
    scopeKey: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!productId || !businessID || !scopeKey) {
      return;
    }

    const scopedUser: UserWithBusiness = { businessID };
    const unsubscribe = fbListenProduct(
      scopedUser,
      productId,
      (data) => {
        setSnapshotState({
          scopeKey,
          data,
          error: null,
        });
      },
      (error) => {
        setSnapshotState((current) => ({
          scopeKey,
          data: current.scopeKey === scopeKey ? current.data : null,
          error,
        }));
      },
      () => undefined,
    );
    return () => unsubscribe(); // Cleanup al desmontar
  }, [businessID, productId, scopeKey]);

  const isCurrentSnapshot = snapshotState.scopeKey === scopeKey;
  const data = scopeKey && isCurrentSnapshot ? snapshotState.data : null;
  const loading = Boolean(scopeKey) && !isCurrentSnapshot;
  const error = isCurrentSnapshot ? snapshotState.error : null;

  return { data, loading, error };
};
