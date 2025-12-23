import { collection, query, where, getDocs } from 'firebase/firestore';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { debounce } from '@/utils/lodash-minimal';

/**
 * Hook para validar códigos de barras duplicados en tiempo real
 * @param {string} currentProductId - ID del producto actual (para excluirlo de la búsqueda)
 * @param {number} debounceMs - Milisegundos para debounce de la validación
 */
export const useBarcodeValidator = (
  currentProductId = null,
  debounceMs = 500,
) => {
  const [isValidating, setIsValidating] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [error, setError] = useState(null);

  const user = useSelector(selectUser);

  /**
   * Valida si un código de barras ya existe en la base de datos
   * @param {string} barcode - Código de barras a validar
   */
  const validateBarcode = useCallback(
    async (barcode) => {
      console.log('validateBarcode called with:', {
        barcode,
        businessID: user?.businessID,
        currentProductId,
      });

      if (!barcode || !user?.businessID || barcode.trim() === '') {
        console.log('Early return - validation skipped:', {
          barcode,
          businessID: user?.businessID,
        });
        setDuplicateInfo(null);
        return { isDuplicate: false, duplicateInfo: null };
      }
      console.log(barcode, 'ejecutado');

      try {
        setIsValidating(true);
        setError(null);

        const productsRef = collection(
          db,
          'businesses',
          user.businessID,
          'products',
        );
        const q = query(productsRef, where('barcode', '==', barcode.trim()));

        const querySnapshot = await getDocs(q);
        console.log('Query results:', {
          docsFound: querySnapshot.docs.length,
          docs: querySnapshot.docs.map((doc) => ({
            id: doc.id,
            barcode: doc.data().barcode,
            name: doc.data().name,
          })),
        });

        // Filtrar el producto actual si se proporciona su ID
        const duplicates = querySnapshot.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .filter((product) => product.id !== currentProductId);

        console.log('After filtering:', {
          duplicatesCount: duplicates.length,
          currentProductId,
        });

        const isDuplicate = duplicates.length > 0;
        const duplicateProduct = duplicates[0] || null;

        const result = {
          isDuplicate,
          duplicateInfo: duplicateProduct
            ? {
              id: duplicateProduct.id,
              name: duplicateProduct.name || duplicateProduct.productName,
              barcode: duplicateProduct.barcode,
              category: duplicateProduct.category,
              price:
                duplicateProduct.pricing?.price ||
                duplicateProduct.price?.unit,
              stock: duplicateProduct.stock,
            }
            : null,
        };

        setDuplicateInfo(result.duplicateInfo);
        return result;
      } catch (err) {
        console.error('Error validating barcode:', err);
        setError(err.message);
        return { isDuplicate: false, duplicateInfo: null, error: err.message };
      } finally {
        setIsValidating(false);
      }
    },
    [user?.businessID, currentProductId],
  );

  // Debounced version para evitar demasiadas consultas
  const debouncedValidateBarcode = useMemo(
    () => debounce(validateBarcode, debounceMs),
    [validateBarcode, debounceMs],
  );

  // Limpiar el debounce al desmontar para evitar updates tardíos
  useEffect(() => {
    return () => {
      if (
        debouncedValidateBarcode &&
        typeof debouncedValidateBarcode.cancel === 'function'
      ) {
        debouncedValidateBarcode.cancel();
      }
    };
  }, [debouncedValidateBarcode]);

  /**
   * Valida múltiples códigos de barras de una vez
   * @param {string[]} barcodes - Array de códigos de barras
   */
  const validateMultipleBarcodes = useCallback(
    async (barcodes) => {
      if (!barcodes || barcodes.length === 0 || !user?.businessID) {
        return [];
      }

      try {
        setIsValidating(true);
        setError(null);

        const validBarcodes = barcodes.filter(
          (code) => code && code.trim() !== '',
        );
        if (validBarcodes.length === 0) return [];

        const productsRef = collection(
          db,
          'businesses',
          user.businessID,
          'products',
        );
        const q = query(productsRef, where('barcode', 'in', validBarcodes));

        const querySnapshot = await getDocs(q);
        const foundProducts = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Crear mapa de códigos duplicados
        const duplicatesMap = foundProducts.reduce((acc, product) => {
          if (product.id !== currentProductId) {
            acc[product.barcode] = {
              id: product.id,
              name: product.name || product.productName,
              barcode: product.barcode,
              category: product.category,
              price: product.pricing?.price || product.price?.unit,
              stock: product.stock,
            };
          }
          return acc;
        }, {});

        // Retornar resultado para cada código validado
        return validBarcodes.map((barcode) => ({
          barcode,
          isDuplicate: !!duplicatesMap[barcode],
          duplicateInfo: duplicatesMap[barcode] || null,
        }));
      } catch (err) {
        console.error('Error validating multiple barcodes:', err);
        setError(err.message);
        return barcodes.map((barcode) => ({
          barcode,
          isDuplicate: false,
          duplicateInfo: null,
          error: err.message,
        }));
      } finally {
        setIsValidating(false);
      }
    },
    [user?.businessID, currentProductId],
  );

  /**
   * Limpia el estado de validación
   */
  const clearValidation = useCallback(() => {
    setDuplicateInfo(null);
    setError(null);
    setIsValidating(false);
  }, []);

  /**
   * Obtiene estadísticas de códigos duplicados
   */
  const getDuplicateStats = useCallback(async () => {
    if (!user?.businessID) return null;

    try {
      const productsRef = collection(
        db,
        'businesses',
        user.businessID,
        'products',
      );
      const querySnapshot = await getDocs(productsRef);

      const barcodes = {};
      let totalProducts = 0;
      let duplicateCount = 0;

      querySnapshot.docs.forEach((doc) => {
        const product = doc.data();
        if (product.barcode && product.barcode.trim() !== '') {
          totalProducts++;
          const barcode = product.barcode.trim();
          if (barcodes[barcode]) {
            barcodes[barcode].count++;
            if (barcodes[barcode].count === 2) {
              duplicateCount += 2; // Contar ambos productos como duplicados
            } else {
              duplicateCount++;
            }
          } else {
            barcodes[barcode] = {
              count: 1,
              products: [{ id: doc.id, name: product.name }],
            };
          }
        }
      });

      const duplicateBarcodes = Object.entries(barcodes)
        .filter(([_, data]) => data.count > 1)
        .map(([barcode, data]) => ({ barcode, count: data.count }));

      return {
        totalProducts,
        duplicateCount,
        duplicateBarcodes,
        duplicatePercentage:
          totalProducts > 0
            ? ((duplicateCount / totalProducts) * 100).toFixed(2)
            : 0,
      };
    } catch (err) {
      console.error('Error getting duplicate stats:', err);
      return null;
    }
  }, [user?.businessID]);

  return {
    isValidating,
    duplicateInfo,
    error,
    validateBarcode,
    debouncedValidateBarcode,
    validateMultipleBarcodes,
    clearValidation,
    getDuplicateStats,
    isDuplicate: !!duplicateInfo,
  };
};
