import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

type SyncOptions = {
  productIds?: string[];
  filterActive?: boolean;
  dryRun?: boolean;
};

type SyncUpdate = {
  productId: string;
  from?: number;
  to: number;
};

type InvalidProductId =
  | string
  | { productId?: string | null; name?: string | null };

type SyncResult = {
  updates: SyncUpdate[];
  totalProducts: number;
  invalidProductIds: InvalidProductId[];
};

type ProductRecord = {
  id?: string;
  stock?: number;
  name?: string;
  isDeleted?: boolean;
};

// Función para obtener todos los productos
const getAllProducts = async (businessID: string) => {
  const productsRef = collection(db, 'businesses', businessID, 'products');
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as ProductRecord),
  }));
};

/**
 * Sincroniza product.stock usando la suma de productsStock por producto.
 * Opcionalmente acepta una lista de productIds para limitar el alcance, y un modo dry-run para solo calcular.
 * Filtros: por defecto toma solo stocks activos (isDeleted=false, status='active').
 *
 * @param businessID
 * @param options
 * @returns SyncResult
 */
export const syncProductsStockFromProductsStock = async (
  businessID: string,
  {
    productIds = undefined,
    filterActive = true,
    dryRun = false,
  }: SyncOptions = {},
): Promise<SyncResult> => {
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

    const addActiveFilters = (base: ReturnType<typeof where>[] = []) =>
      filterActive
        ? [
            ...base,
            where('isDeleted', '==', false),
            where('status', '==', 'active'),
          ]
        : base;

    const updates: SyncUpdate[] = [];

    const invalidProductIds: InvalidProductId[] = [];

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
          (acc, d) => acc + Number(d.data().quantity || 0),
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
    const byProduct = new Map<string, number>();
    stockSnap.docs.forEach((docSnap) => {
      const { productId, quantity } = docSnap.data() as {
        productId?: string;
        quantity?: number;
      };
      if (!productId) return;
      const key = String(productId);
      byProduct.set(key, (byProduct.get(key) || 0) + Number(quantity || 0));
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
 * @param options
 * @returns results
 */
export const syncAllBusinessesProductsStock = async ({
  businessIds = undefined,
  filterActive = true,
  dryRun = false,
}: SyncOptions & { businessIds?: string[] } = {}) => {
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

    const results: Array<
      { businessId: string } & Partial<SyncResult> & { error?: unknown }
    > = [];

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
