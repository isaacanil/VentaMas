import { doc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';

import { db } from '../../firebase/firebaseconfig.jsx';

/**
 * Hook para escuchar cambios en tiempo real de un producto específico
 * @param {string} businessId - ID del negocio
 * @param {string} productId - ID del producto a escuchar
 * @param {boolean} enabled - Si debe activar el listener
 * @returns {Object} Estado del producto en tiempo real
 */
export const useProductRealtimeListener = (businessId, productId, enabled = true) => {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Solo crear el listener si tenemos los datos necesarios y está habilitado
    if (!businessId || !productId || !enabled) {
      setProductData(null);
      setLoading(false);
      setError(null);
      setIsConnected(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productRef = doc(db, 'businesses', businessId, 'products', productId);

      // Crear el listener en tiempo real
      const unsubscribe = onSnapshot(
        productRef,
        {
          includeMetadataChanges: false, // Solo cambios de datos, no de metadata
        },
        (docSnapshot) => {
          setLoading(false);
          setIsConnected(true);

          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setProductData({
              id: docSnapshot.id,
              ...data,
              // Agregar metadata útil
              _metadata: {
                lastUpdated: data.updatedAt || data.createdAt,
                exists: true,
                hasPendingWrites: docSnapshot.metadata.hasPendingWrites
              }
            });
            setError(null);
          } else {
            setProductData(null);
            setError({
              type: 'not_found',
              message: 'El producto no fue encontrado'
            });
          }
        },
        (error) => {
          console.error('Error en listener de producto:', error);
          setLoading(false);
          setIsConnected(false);
          setError({
            type: 'listener_error',
            message: 'Error al escuchar cambios del producto',
            details: error.message
          });
        }
      );

      // Guardar referencia para cleanup
      unsubscribeRef.current = unsubscribe;

      // Cleanup function
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };

    } catch (error) {
      console.error('Error al crear listener:', error);
      setLoading(false);
      setError({
        type: 'setup_error',
        message: 'Error al configurar el listener',
        details: error.message
      });
    }

  }, [businessId, productId, enabled]);

  // Cleanup cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  return {
    productData,
    loading,
    error,
    isConnected,
    // Funciones de utilidad
    hasBarcode: productData?.barcode ? true : false,
    currentBarcode: productData?.barcode || null,
    productName: productData?.name || '',
    isUpdating: productData?._metadata?.hasPendingWrites || false
  };
};

export default useProductRealtimeListener;
