import { buildLocationPath } from '@/utils/inventory/locations';
import type {
  AggregatedProductStock,
  ProductStockRecord,
} from '@/utils/inventory/types';

export function normalizeToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof (value as { toDate?: () => Date } | null)?.toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof (value as { seconds?: number } | null)?.seconds === 'number') {
    const parsed = new Date((value as { seconds: number }).seconds * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function resolveProductId(stock: ProductStockRecord): string | null {
  const raw =
    (stock as { productId?: unknown }).productId ??
    (stock as { productID?: unknown }).productID ??
    (stock as { idProduct?: unknown }).idProduct;
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  return str.length > 0 ? str : null;
}

export function resolveStockLocationPath(stock: ProductStockRecord): string | null {
  const raw = (stock as { location?: unknown }).location;
  if (typeof raw === 'string') {
    const s = raw.trim();
    return s.length > 0 ? s : null;
  }
  if (raw && typeof raw === 'object') {
    const path = (raw as { path?: unknown }).path;
    if (typeof path === 'string') {
      const s = path.trim();
      return s.length > 0 ? s : null;
    }
  }
  return null;
}

export function resolveExpirationDate(stock: ProductStockRecord): Date | null {
  const s = stock as Record<string, unknown>;
  return (
    normalizeToDate(s.expirationDate) ||
    normalizeToDate(s.expDate) ||
    normalizeToDate(s.expiration)
  );
}

export function buildLocationBounds(locationPath: string | null | undefined = ''): {
  lower: string;
  upper: string;
} | null {
  const normalized = buildLocationPath(locationPath);
  if (!normalized) return null;
  return { lower: normalized, upper: `${normalized}\uf8ff` };
}

type GroupedStockBucket = {
  id: string;
  name: string;
  productName: string;
  totalStock: number;
  locations: Array<string | null>;
  batches: Set<string>;
  stockItems: ProductStockRecord[];
  hasExpiration: boolean;
  hasExpired?: boolean;
};

export function aggregateActiveProductStocksByProduct(
  stockItems: ProductStockRecord[],
): AggregatedProductStock[] {
  const groupedByProduct = stockItems.reduce<Record<string, GroupedStockBucket>>(
    (acc, stock) => {
      const productId = resolveProductId(stock);
      if (!productId) return acc;

      if (!acc[productId]) {
        const productName =
          (stock as { productName?: unknown }).productName ?? 'Producto sin nombre';
        acc[productId] = {
          id: productId,
          name: String(productName || 'Producto sin nombre'),
          productName: String(productName || 'Producto sin nombre'),
          totalStock: 0,
          locations: [],
          batches: new Set(),
          stockItems: [],
          hasExpiration: false,
        };
      }

      acc[productId].totalStock += Number((stock as { quantity?: unknown }).quantity) || 0;
      acc[productId].locations.push(resolveStockLocationPath(stock));
      acc[productId].stockItems.push(stock);

      if (resolveExpirationDate(stock)) {
        acc[productId].hasExpiration = true;
      }

      const batchId = (stock as { batchId?: unknown }).batchId;
      if (batchId !== null && batchId !== undefined && String(batchId).trim().length > 0) {
        acc[productId].batches.add(String(batchId));
      }

      return acc;
    },
    {},
  );

  return Object.values(groupedByProduct)
    .map((product): AggregatedProductStock => {
      const uniqueLocations = new Set(product.locations.filter(Boolean));
      const uniqueBatches = product.batches.size;
      const stockRecords = product.stockItems.length;

      return {
        id: product.id,
        name: product.name,
        productName: product.productName,
        totalStock: product.totalStock,
        locations: product.locations,
        stockItems: product.stockItems,
        stockRecords,
        uniqueBatches,
        uniqueLocations: uniqueLocations.size,
        hasExpiration: product.hasExpiration,
        hasExpired: product.hasExpired,
        stockSummary: {
          totalLots: uniqueBatches,
          totalUnits: product.totalStock,
          directLots: uniqueBatches,
          directUnits: product.totalStock,
        },
      };
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export function isTrackInventoryEnabled(rawTrack: unknown): boolean {
  if (rawTrack === false || rawTrack === 0 || rawTrack === 'false') return false;
  if (rawTrack === true || rawTrack === 1) return true;
  if (typeof rawTrack === 'string') {
    const normalized = rawTrack.trim();
    return (
      normalized === 'true' ||
      normalized === 'True' ||
      normalized === 'TRUE' ||
      normalized === 'si' ||
      normalized === 'Si' ||
      normalized === 'SI' ||
      // Accept both correct accent and common mojibake/replacement forms.
      normalized === 's\u00ed' ||
      normalized === 'S\u00ed' ||
      normalized === 's\uFFFD' ||
      normalized === 'S\uFFFD'
    );
  }
  return false;
}

type ProductDocLike = {
  id: string;
  isDeleted?: boolean;
  trackInventory?: unknown;
};

export function extractInventoriedProductIds(products: ProductDocLike[]): Set<string> {
  const ids = new Set<string>();
  for (const p of products) {
    if (!p || p.isDeleted === true) continue;
    if (isTrackInventoryEnabled(p.trackInventory)) ids.add(p.id);
  }
  return ids;
}
