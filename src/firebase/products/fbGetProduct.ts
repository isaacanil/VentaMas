import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
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
    return { id: productSnapshot.id, ...productSnapshot.data() };
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
        setProduct({ id: doc.id, ...doc.data() });
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
export const useListenProduct = (productId: string | null | undefined) => {
  const user = useSelector(selectUser) as UserWithBusiness | null | undefined;
  const [data, setData] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [prevProductId, setPrevProductId] = useState<string | null | undefined>(
    productId,
  );
  const [prevBusinessID, setPrevBusinessID] = useState<
    string | null | undefined
  >(user?.businessID);

  if (productId !== prevProductId || user?.businessID !== prevBusinessID) {
    setPrevProductId(productId);
    setPrevBusinessID(user?.businessID);
    setData(null);
    setError(null);
    if (productId && user?.businessID) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!productId || !user?.businessID) {
      return;
    }

    const unsubscribe = fbListenProduct(
      user,
      productId,
      setData,
      setError,
      setLoading,
    );
    return () => unsubscribe(); // Cleanup al desmontar
  }, [productId, user]);

  return { data, loading, error };
};
