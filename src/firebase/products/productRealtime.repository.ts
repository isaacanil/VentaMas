import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';

export type ProductListenerError = {
  type: 'not_found' | 'listener_error';
  message: string;
  details?: string;
};

export type ProductMetadata = {
  lastUpdated?: unknown;
  exists: boolean;
  hasPendingWrites: boolean;
};

export type ProductRealtimeData = ProductRecord & {
  _metadata: ProductMetadata;
};

export interface ProductRealtimeSnapshot {
  productData: ProductRealtimeData | null;
  error: ProductListenerError | null;
  isConnected: boolean;
}

interface ListenProductRealtimeParams {
  businessId: string;
  productId: string;
  onChange: (snapshot: ProductRealtimeSnapshot) => void;
}

export const listenProductRealtime = ({
  businessId,
  productId,
  onChange,
}: ListenProductRealtimeParams): (() => void) => {
  const productRef = doc(db, 'businesses', businessId, 'products', productId);

  return onSnapshot(
    productRef,
    { includeMetadataChanges: false },
    (docSnapshot) => {
      if (!docSnapshot.exists()) {
        onChange({
          isConnected: true,
          productData: null,
          error: {
            type: 'not_found',
            message: 'El producto no fue encontrado',
          },
        });
        return;
      }

      const data = docSnapshot.data() as ProductRecord;
      onChange({
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
    },
    (error) => {
      console.error('Error en listener de producto:', error);
      onChange({
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
};
