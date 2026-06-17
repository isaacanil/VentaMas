import { useEffect, useState } from 'react';

import {
  listenProductRealtime,
  type ProductListenerError,
  type ProductRealtimeData,
} from '@/firebase/products/productRealtime.repository';

type ProductSnapshotState = {
  key: string | null;
  productData: ProductRealtimeData | null;
  error: ProductListenerError | null;
  isConnected: boolean;
};

export const useProductRealtimeListener = (
  businessId: string | null | undefined,
  productId: string | null | undefined,
  enabled = true,
) => {
  const shouldListen = Boolean(enabled && businessId && productId);
  const listenerKey = shouldListen ? `${businessId}:${productId}` : null;

  const [snapshot, setSnapshot] = useState<ProductSnapshotState>(() => ({
    key: null,
    productData: null,
    error: null,
    isConnected: false,
  }));

  useEffect(() => {
    if (!shouldListen || !businessId || !productId) return;

    let isActive = true;
    const key = `${businessId}:${productId}`;

    const unsubscribe = listenProductRealtime({
      businessId,
      productId,
      onChange: ({ error, isConnected, productData }) => {
        if (!isActive) return;

        setSnapshot({
          key,
          isConnected,
          error,
          productData,
        });
      },
    });

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
