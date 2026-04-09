import { DateTime } from 'luxon';

import { toMillis } from '@/utils/inventory/dates';

import { NO_BATCH_VALUE, getProductFilterKey } from './productFilterUtils';
import type {
  DateRangeValue,
  InventoryRow,
  ProductStockLike,
  SortConfig,
} from '../types';

interface ActiveDateRange {
  start: number;
  end: number;
}

interface BuildInventoryRowsParams {
  productsStock: ProductStockLike[];
  showOnlyWithExpiration: boolean;
  selectedProductFilter: string | null;
  selectedBatches: string[];
  searchTerm: string;
  activeDateRange: ActiveDateRange | null;
  sortConfig: SortConfig;
}

const getBatchSearchValue = (stock: ProductStockLike): string => {
  if (!stock.batch) return '';
  if (typeof stock.batch === 'string') return stock.batch.toLowerCase();
  if (typeof stock.batch === 'number') return String(stock.batch).toLowerCase();
  if (
    'batchNumberId' in stock.batch &&
    typeof stock.batch.batchNumberId === 'string'
  ) {
    return stock.batch.batchNumberId.toLowerCase();
  }
  return '';
};

const filterBySearchTerm = (
  stock: ProductStockLike,
  searchTerm: string,
): boolean => {
  if (!searchTerm) return true;
  const normalizedSearch = searchTerm.toLowerCase();
  const productName = stock.productName?.toLowerCase() ?? '';
  const batchValue = getBatchSearchValue(stock);
  return (
    productName.includes(normalizedSearch) ||
    batchValue.includes(normalizedSearch)
  );
};

const toInventoryRow = (stock: ProductStockLike, todayStartMillis: number) => {
  const expirationDateMillis = toMillis(stock.expirationDate);
  const isExpired = expirationDateMillis
    ? DateTime.fromMillis(expirationDateMillis).startOf('day').toMillis() <
      todayStartMillis
    : false;

  return {
    ...stock,
    id: stock.id ?? '',
    key: stock.id ?? '',
    productName: stock.productName || 'Producto sin nombre',
    productId: stock.productId || '',
    quantity: stock.quantity ?? 0,
    batch: {
      batchNumberId: stock.batchNumberId || 'Sin lote',
      batchId: stock.batchId ?? null,
    },
    batchId: stock.batchId ?? null,
    actions: stock,
    expirationDateMillis,
    expiryDate: expirationDateMillis
      ? {
          label: DateTime.fromMillis(expirationDateMillis).toFormat(
            'dd/MM/yyyy',
          ),
          isExpired,
        }
      : { label: 'N/A', isExpired: false },
  } satisfies InventoryRow;
};

const sortInventoryRows = (
  data: InventoryRow[],
  sortConfig: SortConfig,
): InventoryRow[] => {
  if (!sortConfig.field) return data;

  const { field, order } = sortConfig;
  const direction = order === 'desc' ? -1 : 1;

  return [...data].sort((a, b) => {
    if (field === 'expirationDate') {
      const aMillis = a.expirationDateMillis ?? Number.POSITIVE_INFINITY;
      const bMillis = b.expirationDateMillis ?? Number.POSITIVE_INFINITY;
      return direction * (aMillis - bMillis);
    }

    if (field === 'createdAt') {
      const aMillis = toMillis(a.createdAt);
      const bMillis = toMillis(b.createdAt);
      const aValid = aMillis !== null;
      const bValid = bMillis !== null;

      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;

      return direction * ((aMillis ?? 0) - (bMillis ?? 0));
    }

    if (field === 'productName') {
      return direction * a.productName.localeCompare(b.productName);
    }

    if (field === 'batchNumberId') {
      const batchA = a.batch?.batchNumberId ?? '';
      const batchB = b.batch?.batchNumberId ?? '';
      return direction * batchA.localeCompare(batchB);
    }

    return 0;
  });
};

export const getActiveDateRange = (
  dateFilter: DateRangeValue,
): ActiveDateRange | null => {
  if (!Array.isArray(dateFilter) || !dateFilter[0] || !dateFilter[1]) {
    return null;
  }

  return {
    start: dateFilter[0].startOf('day').toMillis(),
    end: dateFilter[1].endOf('day').toMillis(),
  };
};

export const buildInventoryRows = ({
  productsStock,
  showOnlyWithExpiration,
  selectedProductFilter,
  selectedBatches,
  searchTerm,
  activeDateRange,
  sortConfig,
}: BuildInventoryRowsParams): InventoryRow[] => {
  const todayStartMillis = DateTime.now().startOf('day').toMillis();
  const filteredRows = productsStock
    .filter((stock) => {
      const expirationMillis = toMillis(stock.expirationDate);
      if (showOnlyWithExpiration && expirationMillis === null) return false;

      if (selectedProductFilter) {
        const productKey = getProductFilterKey(stock);
        if (!productKey || productKey !== selectedProductFilter) return false;
      }

      if (selectedBatches.length) {
        const batchValue = stock.batchNumberId || NO_BATCH_VALUE;
        if (!selectedBatches.includes(batchValue)) return false;
      }

      if (!filterBySearchTerm(stock, searchTerm)) return false;

      if (activeDateRange) {
        if (expirationMillis === null) return false;
        return (
          expirationMillis >= activeDateRange.start &&
          expirationMillis <= activeDateRange.end
        );
      }

      return true;
    })
    .map((stock) => toInventoryRow(stock, todayStartMillis));

  return sortInventoryRows(filteredRows, sortConfig);
};
