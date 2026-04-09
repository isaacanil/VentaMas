import { getLocationName } from '@/firebase/warehouse/locationService';
import { getProductStockByProductId } from '@/firebase/warehouse/productStockService';
import type { ProductRecord } from '@/types/products';
import { toMillis } from '@/utils/date/toMillis';
import {
  buildLocationPath,
  normalizeLocationId,
} from '@/utils/inventory/locations';
import type { InventoryStockItem, InventoryUser } from '@/utils/inventory/types';

type ProductStockSelectionSummary = {
  availableLocationCount: number;
  availableStockCount: number;
  availableStocks: InventoryStockItem[];
};

type BaseSelectionResult = {
  availableLocationCount: number;
  availableStockCount: number;
  availableStocks: InventoryStockItem[];
};

export type ProductStockSelectionResult =
  | (BaseSelectionResult & {
      kind: 'direct';
      product: ProductRecord;
    })
  | (BaseSelectionResult & {
      kind: 'needs-selection';
      message: string;
      reason: 'multiple-options' | 'single-expired';
    })
  | (BaseSelectionResult & {
      kind: 'unavailable';
      message: string;
    });

const resolveProductName = (product?: ProductRecord | null): string => {
  const candidate = product?.name ?? product?.productName ?? product?.id;
  return typeof candidate === 'string' && candidate.trim().length > 0
    ? candidate.trim()
    : 'este producto';
};

export const analyzeAvailableProductStocks = (
  stocks: InventoryStockItem[] | null | undefined,
): ProductStockSelectionSummary => {
  const availableStocks = Array.isArray(stocks)
    ? stocks.filter((stock) => (Number(stock?.quantity) || 0) > 0)
    : [];
  const locationIds = new Set(
    availableStocks
      .map((stock) => normalizeLocationId(stock?.location))
      .filter((locationId): locationId is string => Boolean(locationId)),
  );

  return {
    availableStocks,
    availableStockCount: availableStocks.length,
    availableLocationCount: locationIds.size,
  };
};

export const buildMissingPhysicalSelectionMessage = ({
  availableLocationCount,
  availableStockCount,
  product,
}: {
  availableLocationCount: number;
  availableStockCount: number;
  product?: ProductRecord | null;
}): string => {
  const productName = resolveProductName(product);

  if (availableStockCount <= 0) {
    return `El producto "${productName}" no tiene existencias físicas disponibles.`;
  }

  if (availableLocationCount > 1) {
    return `El producto "${productName}" tiene existencias en ${availableLocationCount} ubicaciones. Debes seleccionar una ubicación antes de continuar.`;
  }

  if (availableStockCount > 1) {
    return `El producto "${productName}" tiene ${availableStockCount} existencias físicas disponibles. Debes seleccionar una antes de continuar.`;
  }

  return `El producto "${productName}" requiere seleccionar una existencia física antes de continuar.`;
};

const buildSelectedProduct = async ({
  product,
  stock,
  user,
}: {
  product: ProductRecord;
  stock: InventoryStockItem;
  user: InventoryUser;
}): Promise<ProductRecord> => {
  const locationPath = buildLocationPath(stock.location);
  const locationName = locationPath
    ? await getLocationName(user, locationPath)
    : '';

  return {
    ...product,
    productStockId: stock.id ?? null,
    batchId: stock.batchId ?? null,
    stock: stock.quantity,
    batchInfo: {
      productStockId: stock.id ?? null,
      batchId: stock.batchId ?? null,
      batchNumber: stock.batchNumberId ?? null,
      quantity: stock.quantity ?? null,
      expirationDate: toMillis(stock.expirationDate) ?? null,
      locationId: locationPath || null,
      locationName: locationName || null,
    },
  };
};

export const resolveProductStockSelection = async ({
  product,
  user,
}: {
  product: ProductRecord;
  user: InventoryUser;
}): Promise<ProductStockSelectionResult> => {
  const rawStocks = await getProductStockByProductId(user, {
    productId: product.id ?? null,
  });
  const stocks = Array.isArray(rawStocks)
    ? (rawStocks as InventoryStockItem[])
    : [];
  const summary = analyzeAvailableProductStocks(stocks);

  if (summary.availableStockCount <= 0) {
    if (product?.restrictSaleWithoutStock) {
      return {
        kind: 'unavailable',
        message: buildMissingPhysicalSelectionMessage({
          availableLocationCount: summary.availableLocationCount,
          availableStockCount: summary.availableStockCount,
          product,
        }),
        ...summary,
      };
    }

    return {
      kind: 'direct',
      product,
      ...summary,
    };
  }

  if (
    summary.availableStockCount > 1 ||
    summary.availableLocationCount > 1
  ) {
    return {
      kind: 'needs-selection',
      reason: 'multiple-options',
      message: buildMissingPhysicalSelectionMessage({
        availableLocationCount: summary.availableLocationCount,
        availableStockCount: summary.availableStockCount,
        product,
      }),
      ...summary,
    };
  }

  const selectedStock = summary.availableStocks[0];
  const expirationTimestamp = toMillis(selectedStock?.expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isExpired =
    expirationTimestamp !== undefined &&
    expirationTimestamp < today.getTime();

  if (isExpired) {
    return {
      kind: 'needs-selection',
      reason: 'single-expired',
      message: `La única existencia disponible de "${resolveProductName(
        product,
      )}" está vencida. Revísala y selecciónala manualmente antes de continuar.`,
      ...summary,
    };
  }

  return {
    kind: 'direct',
    product: await buildSelectedProduct({
      product,
      stock: selectedStock,
      user,
    }),
    ...summary,
  };
};
