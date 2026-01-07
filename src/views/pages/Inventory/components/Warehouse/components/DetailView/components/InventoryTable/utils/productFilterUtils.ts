// @ts-nocheck
import type { ProductStockLike } from '@/views/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/types';

export const NO_BATCH_VALUE = '__NO_BATCH__';

export const getProductFilterKey = (
  stock?: ProductStockLike | null,
): string | null => {
  if (!stock) return null;
  if (stock.productId) return `id-${stock.productId}`;
  if (stock.productCode) return `code-${stock.productCode}`;
  if (stock.sku) return `sku-${stock.sku}`;
  if (stock.productName) return `name-${stock.productName}`;
  if (stock.product) return `name-${stock.product}`;
  if (stock.id) return `stock-${stock.id}`;
  return null;
};

export const getProductFilterLabel = (
  stock?: ProductStockLike | null,
): string => {
  return (
    stock?.productName ||
    stock?.product ||
    stock?.productCode ||
    stock?.productId ||
    'Producto sin nombre'
  );
};
