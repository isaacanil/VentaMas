import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

// Función para obtener todos los productos
const getAllProducts = async (businessID) => {
  const productsRef = collection(db, 'businesses', businessID, 'products');
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Sincroniza product.stock usando la suma de productsStock por producto.
 * Opcionalmente acepta una lista de productIds para limitar el alcance, y un modo dry-run para solo calcular.
 * Filtros: por defecto toma solo stocks activos (isDeleted=false, status='active').
 *
 * @param {string} businessID
 * @param {{ productIds?: string[], filterActive?: boolean, dryRun?: boolean }} [options]
 * @returns {Promise<{updates: Array<{productId: string, from: number, to: number}>, totalProducts: number}>}
 */
export const syncProductsStockFromProductsStock = async (
  businessID,
  { productIds = undefined, filterActive = true, dryRun = false } = {},
) => {
  try {
    const sanitizedBusinessID =
      typeof businessID === 'string' ? businessID.trim() : '';
    if (!sanitizedBusinessID) {
      throw new Error('Invalid businessID');
    }
    const syncTimestamp = new Date().toISOString();
    const stockColl = collection(
      db,
      'businesses',
      sanitizedBusinessID,
      'productsStock',
    );

    const addActiveFilters = (base = []) =>
      filterActive
        ? [
            ...base,
            where('isDeleted', '==', false),
            where('status', '==', 'active'),
          ]
        : base;

    const updates = [];

    const invalidProductIds = [];

    if (Array.isArray(productIds) && productIds.length > 0) {
      const normalizedIds = productIds
        .map((pid) => (typeof pid === 'string' ? pid.trim() : ''))
        .filter((pid, index) => {
          if (!pid) {
            invalidProductIds.push(productIds[index]);
            return false;
          }
          return true;
        });

      // Modo por lista específica de productos: 1 query por producto
      for (const pid of normalizedIds) {
        const qref = query(
          stockColl,
          ...addActiveFilters([where('productId', '==', pid)]),
        );
        const snap = await getDocs(qref);
        const total = snap.docs.reduce(
          (acc, d) => acc + (d.data().quantity || 0),
          0,
        );

        if (!pid) continue;

        const productRef = doc(
          db,
          'businesses',
          sanitizedBusinessID,
          'products',
          pid,
        );
        if (!dryRun) {
          await updateDoc(productRef, {
            stock: total,
            lastStockSyncFromProductsStock: syncTimestamp,
          });
        }
        updates.push({ productId: pid, from: undefined, to: total });
      }

      return {
        updates,
        totalProducts: normalizedIds.length,
        invalidProductIds,
      };
    }

    // Modo global: reducir todos los productsStock en un solo recorrido
    const globalQ = query(stockColl, ...addActiveFilters());
    const stockSnap = await getDocs(globalQ);
    const byProduct = new Map();
    stockSnap.docs.forEach((d) => {
      const { productId, quantity } = d.data();
      if (!productId) return;
      const key = String(productId);
      byProduct.set(key, (byProduct.get(key) || 0) + (quantity || 0));
    });

    // Leer todos los productos para actualizar mismatches y también poner 0 a los que no están en el mapa
    const products = await getAllProducts(sanitizedBusinessID);
    for (const p of products) {
      if (!p?.id) {
        invalidProductIds.push({
          productId: p?.id ?? null,
          name: p?.name ?? null,
        });
        continue;
      }
      const computed = byProduct.get(String(p.id)) || 0;
      const declared = typeof p.stock === 'number' ? p.stock : 0;
      if (declared !== computed) {
        const productRef = doc(
          db,
          'businesses',
          sanitizedBusinessID,
          'products',
          p.id,
        );
        if (!dryRun) {
          await updateDoc(productRef, {
            stock: computed,
            lastStockSyncFromProductsStock: syncTimestamp,
          });
        }
        updates.push({ productId: p.id, from: declared, to: computed });
      }
    }

    return { updates, totalProducts: products.length, invalidProductIds };
  } catch (error) {
    console.error('Error sincronizando stock desde productsStock:', error);
    throw error;
  }
};

/**
 * Sincroniza el stock declarado (`products.stock`) para todos los negocios seleccionados.
 * Si no se especifican IDs, recorre la colección completa de `businesses`.
 *
 * @param {{ businessIds?: string[], filterActive?: boolean, dryRun?: boolean }} [options]
 * @returns {Promise<Array<{ businessId: string, updates?: Array, totalProducts?: number, error?: Error }>>}
 */
export const syncAllBusinessesProductsStock = async ({
  businessIds = undefined,
  filterActive = true,
  dryRun = false,
} = {}) => {
  try {
    let targetBusinessIds = Array.isArray(businessIds)
      ? businessIds
          .map((id) => (typeof id === 'string' ? id.trim() : ''))
          .filter(Boolean)
      : [];

    if (targetBusinessIds.length === 0) {
      const businessesSnap = await getDocs(collection(db, 'businesses'));
      targetBusinessIds = businessesSnap.docs
        .filter((docSnap) => docSnap?.data()?.isDeleted !== true)
        .map((docSnap) => docSnap.id)
        .filter(Boolean);
    }

    const results = [];

    for (const id of targetBusinessIds) {
      try {
        const syncResult = await syncProductsStockFromProductsStock(id, {
          filterActive,
          dryRun,
        });
        results.push({ businessId: id, ...syncResult });
      } catch (error) {
        console.error(
          `[syncAllBusinessesProductsStock] Error syncing business ${id}:`,
          error,
        );
        results.push({ businessId: id, error });
      }
    }

    return results;
  } catch (outerError) {
    console.error(
      '[syncAllBusinessesProductsStock] Error obteniendo negocios:',
      outerError,
    );
    throw outerError;
  }
};
