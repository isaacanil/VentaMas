import { useMemo } from 'react';

import { toMillis } from '@/utils/inventory/dates';
import {
  NO_BATCH_VALUE,
  getProductFilterKey,
  getProductFilterLabel,
} from '../utils/productFilterUtils';

import type {
  ProductBatchMap,
  ProductOption,
  ProductStockLike,
} from '@/views/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/types';

interface UseProductFilterOptionsResult {
  productOptions: ProductOption[];
  productBatchMap: ProductBatchMap;
}

export const useProductFilterOptions = (
  productsStock: ProductStockLike[],
): UseProductFilterOptionsResult =>
  useMemo(() => {
    const productMap = new Map<string, string>();
    const batchesByProduct: ProductBatchMap = new Map();

    productsStock.forEach((stock) => {
      const productKey = getProductFilterKey(stock);
      if (!productKey) return;

      if (!productMap.has(productKey)) {
        productMap.set(productKey, getProductFilterLabel(stock));
      }

      const batchKey = stock.batchNumberId || NO_BATCH_VALUE;
      const batchLabel = stock.batchNumberId || 'Sin lote';
      const expirationDateMillis = toMillis(stock.expirationDate ?? null);

      if (!batchesByProduct.has(productKey)) {
        batchesByProduct.set(productKey, new Map());
      }

      const productBatches = batchesByProduct.get(productKey);
      if (!productBatches) return;

      if (!productBatches.has(batchKey)) {
        productBatches.set(batchKey, {
          value: batchKey,
          label: batchLabel,
          expirationDateMillis,
        });
      } else {
        const existing = productBatches.get(batchKey);
        if (!existing?.expirationDateMillis && expirationDateMillis) {
          productBatches.set(batchKey, {
            value: batchKey,
            label: batchLabel,
            expirationDateMillis,
          });
        }
      }
    });

    const productOptions: ProductOption[] = Array.from(productMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      productOptions,
      productBatchMap: batchesByProduct,
    };
  }, [productsStock]);
