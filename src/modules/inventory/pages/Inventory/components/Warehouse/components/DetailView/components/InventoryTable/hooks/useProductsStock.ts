import { useMemo } from 'react';

import { useListenProductsStockByLocation } from '@/hooks/useProductStock';

import type {
  InventoryTableProps,
  ProductStockLike,
} from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/types';

interface ProductsStockResponse {
  data?: ProductStockLike[] | null;
  loading?: boolean;
}

const DEFAULT_PRODUCTS_STOCK_STATE: Required<ProductsStockResponse> = {
  data: [],
  loading: false,
};

const isProductStockLike = (value: unknown): value is ProductStockLike =>
  typeof value === 'object' && value !== null;

const isProductsStockResponse = (
  value: unknown,
): value is ProductsStockResponse => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as ProductsStockResponse;
  const { data, loading } = candidate;

  const dataIsValid =
    Array.isArray(data) || data === null || data === undefined;
  const loadingIsValid = typeof loading === 'boolean' || loading === undefined;

  return dataIsValid && loadingIsValid;
};

interface UseProductsStockResult {
  productsStock: ProductStockLike[];
  loading: boolean;
}

export const useProductsStock = (
  location: InventoryTableProps['location'],
): UseProductsStockResult => {
  const listenResult: unknown = useListenProductsStockByLocation(location);

  return useMemo(() => {
    const productsStockState = isProductsStockResponse(listenResult)
      ? listenResult
      : DEFAULT_PRODUCTS_STOCK_STATE;

    const productsStock: ProductStockLike[] = Array.isArray(
      productsStockState.data,
    )
      ? productsStockState.data.filter(isProductStockLike)
      : [];

    return {
      productsStock,
      loading: productsStockState.loading ?? false,
    };
  }, [listenResult]);
};
