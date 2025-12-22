import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../../firebase/firebaseconfig.jsx';

/**
 * Hook para escuchar cambios en tiempo real de un producto específico
 * @param {string} businessId - ID del negocio
 * @param {string} productId - ID del producto a escuchar
 * @param {boolean} enabled - Si debe activar el listener
 * @returns {Object} Estado del producto en tiempo real
 */
export const useProductRealtimeListener = (
  businessId,
  productId,
  enabled = true,
) => {
  const shouldListen = Boolean(enabled && businessId && productId);
  const listenerKey = shouldListen ? `${businessId}:${productId}` : null;

  const [snapshot, setSnapshot] = useState(() => ({
    key: null,
    productData: null,
    error: null,
    isConnected: false,
  }));

  useEffect(() => {
    if (!shouldListen) return;

    let isActive = true;
    const key = `${businessId}:${productId}`;

    const productRef = doc(db, 'businesses', businessId, 'products', productId);

    const unsubscribe = onSnapshot(
      productRef,
      { includeMetadataChanges: false },
      (docSnapshot) => {
        if (!isActive) return;

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setSnapshot({
            key,
            isConnected: true,
            error: null,
            productData: {
              id: docSnapshot.id,
              ...data,
              _metadata: {
                lastUpdated: data.updatedAt || data.createdAt,
                exists: true,
                hasPendingWrites: docSnapshot.metadata.hasPendingWrites,
              },
            },
          });
          return;
        }

        setSnapshot({
          key,
          isConnected: true,
          productData: null,
          error: {
            type: 'not_found',
            message: 'El producto no fue encontrado',
          },
        });
      },
      (error) => {
        if (!isActive) return;

        console.error('Error en listener de producto:', error);
        setSnapshot({
          key,
          isConnected: false,
          productData: null,
          error: {
            type: 'listener_error',
            message: 'Error al escuchar cambios del producto',
            details: error.message,
          },
        });
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [businessId, productId, shouldListen]);

  const { productData, error, isConnected } =
    shouldListen && snapshot.key === listenerKey
      ? snapshot
      : { productData: null, error: null, isConnected: false };

  const loading = shouldListen && snapshot.key !== listenerKey;

  return {
    productData,
    loading,
    error,
    isConnected,
    hasBarcode: productData?.barcode ? true : false,
    currentBarcode: productData?.barcode || null,
    productName: productData?.name || '',
    isUpdating: productData?._metadata?.hasPendingWrites || false,
  };
};

export default useProductRealtimeListener;
