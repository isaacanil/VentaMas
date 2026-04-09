import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import type { InventoryStockItem } from '@/utils/inventory/types';
import type { Firestore } from 'firebase/firestore';

/**
 * Escucha stocks y productos activos; construye augmentedStocks que incluye
 * productos sin registros en productsStock (stock 0 sintético).
 */
const consoleApi =
  typeof globalThis !== 'undefined' ? globalThis.console : undefined;
const isDev = import.meta.env.DEV;

const logDebug = (...args: unknown[]) => {
  if (isDev && consoleApi?.debug) {
    consoleApi.debug(...args);
  }
};

const logError = (...args: unknown[]) => {
  if (consoleApi?.error) {
    consoleApi.error(...args);
  }
};

interface UseInventoryStocksProductsParams {
  db?: Firestore | null;
  businessID?: string | null;
}

interface UseInventoryStocksProductsResult {
  stocks: InventoryStockItem[];
  products: InventoryStockItem[];
  augmentedStocks: InventoryStockItem[];
  loading: boolean;
}

export function useInventoryStocksProducts({
  db,
  businessID,
}: UseInventoryStocksProductsParams): UseInventoryStocksProductsResult {
  const [stocks, setStocks] = useState<InventoryStockItem[]>([]);
  const [products, setProducts] = useState<InventoryStockItem[]>([]);
  const [stocksLoaded, setStocksLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Stocks listener
  useEffect(() => {
    if (!db || !businessID) return;

    const ref = collection(db, 'businesses', businessID, 'productsStock');
    const q = query(ref, orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const raw = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as InventoryStockItem[];
        const data = raw.filter(
          (r) => r.isDeleted !== true && r.status !== 'inactive',
        );
        if (isDev) {
          const inactive = raw.filter((r) => r.status === 'inactive').length;
          logDebug(
            '[useInventoryStocksProducts] Stocks:',
            raw.length,
            'Activos:',
            data.length,
            'Inactivos omitidos:',
            inactive,
          );
        }
        setStocks(data);
        setStocksLoaded(true);
      },
      (error) => {
        logError(
          '[useInventoryStocksProducts] Error listener productsStock:',
          error,
        );
        setStocksLoaded(true);
      },
    );
    return () => unsub();
  }, [db, businessID]);

  // Products listener (para entradas sintéticas)
  useEffect(() => {
    if (!db || !businessID) return;

    const ref = collection(db, 'businesses', businessID, 'products');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const raw = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as InventoryStockItem[];
        const data = raw.filter(
          (r) => r.isDeleted !== true && r.status !== 'inactive',
        );
        if (isDev) {
          logDebug(
            '[useInventoryStocksProducts] Products:',
            raw.length,
            'Activos:',
            data.length,
          );
        }
        setProducts(data);
        setProductsLoaded(true);
      },
      (error) => {
        logError(
          '[useInventoryStocksProducts] Error listener products:',
          error,
        );
        setProductsLoaded(true);
      },
    );
    return () => unsub();
  }, [db, businessID]);

  const augmentedStocks = useMemo(() => {
    if (!products.length) return stocks;
    const productIdsWithStock = new Set<string>();
    stocks.forEach((s) => {
      const pid = s.productId || s.productID || s.product?.id || s.idProduct;
      if (pid) productIdsWithStock.add(String(pid));
    });
    const synthetic: InventoryStockItem[] = [];
    for (const p of products) {
      const pid = p.id;
      if (!pid || productIdsWithStock.has(String(pid))) continue;
      synthetic.push({
        id: `productOnly:${pid}`,
        productId: pid,
        productName: p.name || p.productName || '',
        quantity: 0,
        stock: 0,
        isSynthetic: true,
      });
    }
    return [...stocks, ...synthetic];
  }, [stocks, products]);

  const loading = !stocksLoaded || !productsLoaded;

  return {
    stocks,
    products,
    augmentedStocks,
    loading,
  };
}

export default useInventoryStocksProducts;
