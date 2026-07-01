import { getLocationName } from '@/firebase/warehouse/locationService';
import { getProductStockByProductId } from '@/firebase/warehouse/productStockService';
import type { ProductRecord } from '@/types/products';
import { toMillis } from '@/utils/date/toMillis';
import {
  buildLocationPath,
  normalizeLocationId,
} from '@/utils/inventory/locations';
import type {
  InventoryStockItem,
  InventoryUser,
} from '@/utils/inventory/types';
import { resolveProductDisplayName } from '@/domain/products/display';
import { shouldResolveProductPhysicalStock } from '@/domain/products/productInventoryLogic';
import {
  resolveProductBaseQuantity,
  resolveSaleUnitLabel,
} from '@/domain/products/saleUnits';

export const shouldResolveProductStockSelection = (
  product?: ProductRecord | null,
): boolean => {
  return shouldResolveProductPhysicalStock(product);
};

type ProductStockSelectionSummary = {
  availableLocationCount: number;
  availableStockCount: number;
  availableStocks: InventoryStockItem[];
  totalPhysicalStockQuantity: number;
};

type ProductStockSelectionOptions = {
  minQuantity?: number;
};

type BaseSelectionResult = {
  availableLocationCount: number;
  availableStockCount: number;
  availableStocks: InventoryStockItem[];
  totalPhysicalStockQuantity: number;
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
  return resolveProductDisplayName(product, 'este producto');
};

export const analyzeAvailableProductStocks = (
  stocks: InventoryStockItem[] | null | undefined,
  options: ProductStockSelectionOptions = {},
): ProductStockSelectionSummary => {
  const minQuantity =
    Number.isFinite(options.minQuantity) && Number(options.minQuantity) > 0
      ? Number(options.minQuantity)
      : 0;
  const availableStocks = Array.isArray(stocks)
    ? stocks.filter((stock) => (Number(stock?.quantity) || 0) > 0)
    : [];
  const totalPhysicalStockQuantity = availableStocks.reduce(
    (total, stock) => total + (Number(stock?.quantity) || 0),
    0,
  );
  const eligibleStocks = availableStocks.filter(
    (stock) => (Number(stock?.quantity) || 0) >= minQuantity,
  );
  const locationIds = new Set(
    eligibleStocks
      .map((stock) => normalizeLocationId(stock?.location))
      .filter((locationId): locationId is string => Boolean(locationId)),
  );

  return {
    availableStocks: eligibleStocks,
    availableStockCount: eligibleStocks.length,
    availableLocationCount: locationIds.size,
    totalPhysicalStockQuantity,
  };
};

export const buildMissingPhysicalSelectionMessage = ({
  availableLocationCount,
  availableStockCount,
  minQuantity,
  product,
  totalPhysicalStockQuantity,
}: {
  availableLocationCount: number;
  availableStockCount: number;
  minQuantity?: number;
  product?: ProductRecord | null;
  totalPhysicalStockQuantity?: number;
}): string => {
  const productName = resolveProductName(product);
  const selectedUnitLabel = resolveSaleUnitLabel(product?.selectedSaleUnit);
  const hasRequiredQuantity =
    Number.isFinite(minQuantity) && Number(minQuantity) > 1;

  if (availableStockCount <= 0) {
    if (hasRequiredQuantity && selectedUnitLabel) {
      if (
        Number.isFinite(totalPhysicalStockQuantity) &&
        Number(totalPhysicalStockQuantity) > 0
      ) {
        return `El producto "${productName}" tiene ${totalPhysicalStockQuantity} unidades en total, pero ninguna ubicación o lote tiene ${minQuantity} unidades juntas para ${selectedUnitLabel}.`;
      }
      return `El producto "${productName}" no tiene una existencia física con al menos ${minQuantity} unidades disponibles para ${selectedUnitLabel}.`;
    }
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
  if (!shouldResolveProductStockSelection(product)) {
    const summary = analyzeAvailableProductStocks([]);
    return {
      kind: 'direct',
      product,
      ...summary,
    };
  }

  const rawStocks = await getProductStockByProductId(user, {
    productId: product.id ?? null,
  });
  const stocks = Array.isArray(rawStocks)
    ? (rawStocks as InventoryStockItem[])
    : [];
  const requiredBaseQuantity = resolveProductBaseQuantity(product);
  const summary = analyzeAvailableProductStocks(stocks, {
    minQuantity: requiredBaseQuantity,
  });

  if (summary.availableStockCount <= 0) {
    if (product?.restrictSaleWithoutStock) {
      return {
        kind: 'unavailable',
        message: buildMissingPhysicalSelectionMessage({
          availableLocationCount: summary.availableLocationCount,
          availableStockCount: summary.availableStockCount,
          minQuantity: requiredBaseQuantity,
          product,
          totalPhysicalStockQuantity: summary.totalPhysicalStockQuantity,
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

  if (summary.availableStockCount > 1 || summary.availableLocationCount > 1) {
    return {
      kind: 'needs-selection',
      reason: 'multiple-options',
      message: buildMissingPhysicalSelectionMessage({
        availableLocationCount: summary.availableLocationCount,
        availableStockCount: summary.availableStockCount,
        minQuantity: requiredBaseQuantity,
        product,
        totalPhysicalStockQuantity: summary.totalPhysicalStockQuantity,
      }),
      ...summary,
    };
  }

  const selectedStock = summary.availableStocks[0];
  const expirationTimestamp = toMillis(selectedStock?.expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isExpired =
    expirationTimestamp !== undefined && expirationTimestamp < today.getTime();

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
