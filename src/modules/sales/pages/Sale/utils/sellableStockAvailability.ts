import { buildLocationPath } from '@/utils/inventory/locations';
import type { InventoryStockItem } from '@/utils/inventory/types';

export type SellableStockAvailability = {
  maxPhysicalStockQuantity: number;
  stockCount: number;
  totalPhysicalStockQuantity: number;
};

export type SellableStockAvailabilityIndex = Record<
  string,
  SellableStockAvailability
>;

type BuildSellableStockAvailabilityIndexOptions = {
  locationScopes?: Array<string | null | undefined>;
};

const normalizeProductId = (stock: InventoryStockItem): string => {
  const productId =
    stock.productId ??
    stock.productID ??
    stock.idProduct ??
    stock.product?.id ??
    null;
  return productId === null || productId === undefined
    ? ''
    : String(productId).trim();
};

const normalizeQuantity = (stock: InventoryStockItem): number => {
  const quantity = Number(stock.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
};

const normalizeLocationScopes = (
  locationScopes: BuildSellableStockAvailabilityIndexOptions['locationScopes'],
): string[] =>
  Array.isArray(locationScopes)
    ? locationScopes
        .map((scope) => buildLocationPath(scope))
        .filter((scope): scope is string => Boolean(scope))
    : [];

const isInLocationScope = (
  stock: InventoryStockItem,
  locationScopes: string[],
): boolean => {
  if (locationScopes.length === 0) return true;
  const locationPath = buildLocationPath(stock.location);
  if (!locationPath) return false;

  return locationScopes.some(
    (scope) => locationPath === scope || locationPath.startsWith(`${scope}/`),
  );
};

export const buildSellableStockAvailabilityIndex = (
  stocks: InventoryStockItem[] | null | undefined,
  options: BuildSellableStockAvailabilityIndexOptions = {},
): SellableStockAvailabilityIndex => {
  const locationScopes = normalizeLocationScopes(options.locationScopes);
  const index: SellableStockAvailabilityIndex = {};

  if (!Array.isArray(stocks)) return index;

  stocks.forEach((stock) => {
    if (!stock || stock.isDeleted === true) return;
    if (stock.status && stock.status !== 'active') return;
    if (!isInLocationScope(stock, locationScopes)) return;

    const productId = normalizeProductId(stock);
    const quantity = normalizeQuantity(stock);
    if (!productId || quantity <= 0) return;

    const current = index[productId] ?? {
      maxPhysicalStockQuantity: 0,
      stockCount: 0,
      totalPhysicalStockQuantity: 0,
    };

    index[productId] = {
      maxPhysicalStockQuantity: Math.max(
        current.maxPhysicalStockQuantity,
        quantity,
      ),
      stockCount: current.stockCount + 1,
      totalPhysicalStockQuantity: current.totalPhysicalStockQuantity + quantity,
    };
  });

  return index;
};
