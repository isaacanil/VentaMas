import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';

// Función para obtener todos los productos
const getAllProducts = async (businessID) => {
  const productsRef = collection(db, 'businesses', businessID, 'products');
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Función para obtener la suma del stock de los batches de un producto
const getProductBatchesStock = async (businessID, productId) => {
  const batchesRef = collection(db, 'businesses', businessID, 'batches');
  const q = query(
    batchesRef, 
    where('productId', '==', productId),
    where('isDeleted', '==', false)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.reduce((total, doc) => total + (doc.data().quantity || 0), 0);
};

// Funciones auxiliares para manejar el tiempo de última sincronización
const LAST_SYNC_KEY = 'ventamax_last_stock_sync';

const getLastSyncTime = (businessID) => {
  const lastSync = localStorage.getItem(`${LAST_SYNC_KEY}_${businessID}`);
  return lastSync ? new Date(lastSync).getTime() : null;
};

const setLastSyncTime = (businessID) => {
  localStorage.setItem(`${LAST_SYNC_KEY}_${businessID}`, new Date().toISOString());
};

// Función principal para sincronizar el stock
export const syncProductsStock = async (businessID) => {
  try {

    const products = await getAllProducts(businessID);
    
    for (const product of products) {
      const totalStock = await getProductBatchesStock(businessID, product.id);
      
      if (product.stock !== totalStock) {
        const productRef = doc(db, 'businesses', businessID, 'products', product.id);
        await updateDoc(productRef, {
          stock: totalStock,
          lastStockSync: new Date().toISOString()
        });

      }
    }
    
    setLastSyncTime(businessID);

  } catch (error) {
    console.error('Error en la sincronización de stock:', error);
  }
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
  { productIds = undefined, filterActive = true, dryRun = false } = {}
) => {
  try {
    const stockColl = collection(db, 'businesses', businessID, 'productsStock');

    const addActiveFilters = (base = []) => (
      filterActive ? [...base, where('isDeleted', '==', false), where('status', '==', 'active')] : base
    );

    const updates = [];

    if (Array.isArray(productIds) && productIds.length > 0) {
      // Modo por lista específica de productos: 1 query por producto
      for (const pid of productIds) {
        const qref = query(stockColl, ...addActiveFilters([where('productId', '==', pid)]));
        const snap = await getDocs(qref);
        const total = snap.docs.reduce((acc, d) => acc + (d.data().quantity || 0), 0);

        const productRef = doc(db, 'businesses', businessID, 'products', pid);
        if (!dryRun) {
          await updateDoc(productRef, {
            stock: total,
            lastStockSyncFromProductsStock: new Date().toISOString(),
          });
        }
        updates.push({ productId: pid, from: undefined, to: total });
      }

      return { updates, totalProducts: productIds.length };
    }

    // Modo global: reducir todos los productsStock en un solo recorrido
    const globalQ = query(stockColl, ...addActiveFilters());
    const stockSnap = await getDocs(globalQ);
    const byProduct = new Map();
    stockSnap.docs.forEach(d => {
      const { productId, quantity } = d.data();
      if (!productId) return;
      const key = String(productId);
      byProduct.set(key, (byProduct.get(key) || 0) + (quantity || 0));
    });

    // Leer todos los productos para actualizar mismatches y también poner 0 a los que no están en el mapa
    const products = await getAllProducts(businessID);
    for (const p of products) {
      const computed = byProduct.get(String(p.id)) || 0;
      const declared = typeof p.stock === 'number' ? p.stock : 0;
      if (declared !== computed) {
        const productRef = doc(db, 'businesses', businessID, 'products', p.id);
        if (!dryRun) {
          await updateDoc(productRef, {
            stock: computed,
            lastStockSyncFromProductsStock: new Date().toISOString(),
          });
        }
        updates.push({ productId: p.id, from: declared, to: computed });
      }
    }

    return { updates, totalProducts: products.length };
  } catch (error) {
    console.error('Error sincronizando stock desde productsStock:', error);
    throw error;
  }
};

// Hook personalizado para ejecutar la sincronización automáticamente
export const useAutoStockSync = (intervalMinutes = 720) => { // 720 minutos = 12 horas
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.businessID) return;

    const shouldSync = () => {
      const lastSync = getLastSyncTime(user.businessID);
      if (!lastSync) return true;
      
      const timeSinceLastSync = Date.now() - lastSync;
      const syncIntervalMs = intervalMinutes * 60 * 1000;
      return timeSinceLastSync >= syncIntervalMs;
    };

    // Primera sincronización solo si es necesario
    if (shouldSync()) {
      syncProductsStock(user.businessID);
    }
    const scheduleSync = () => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          if (shouldSync()) {
            syncProductsStock(user.businessID);
          }
        });
      } else {
        setTimeout(() => {
          if (shouldSync()) {
            syncProductsStock(user.businessID);
          }
        }, 0);
      }
    };

    const interval = setInterval(scheduleSync, 10 * 60 * 1000); // Increased from 5 to 10 minutes

    // Limpiar el intervalo al desmontar
    return () => clearInterval(interval);
  }, [user, intervalMinutes]);
};