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