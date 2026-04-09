import { useCallback, useMemo, useState } from 'react';

import { useGetProducts } from '@/firebase/products/fbGetProducts';
import type { ProductRecord } from '@/types/products';

import {
  exportInventorySummaryToExcel,
  type InventorySummaryRow,
} from '../utils/exportInventorySummaryToExcel';

export type InventorySummaryItem = {
  id: string | number | null;
  name: string;
  category: string;
  sku: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
};

export type CategorySummary = {
  category: string;
  qty: number;
  valueCost: number;
  valuePrice: number;
  avgCost: number;
  share: number;
};

export type TopProductRow = {
  id: string | number | null;
  name: string;
  category: string;
  qty: number;
  unitCost: number;
  value: number;
  sku: string;
};

const formatCurrency = (value: number, currency = 'DOP') =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatInteger = (value: number) =>
  new Intl.NumberFormat('es-DO', { maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  );

const getNumber = (n: unknown, def = 0) => {
  const value = Number(n);
  return Number.isFinite(value) ? value : def;
};

const getName = (product: ProductRecord | null | undefined) =>
  product?.name || product?.productName || 'Producto';

const getCategory = (product: ProductRecord | null | undefined) => {
  const group = typeof product?.group === 'string' ? product.group : undefined;
  return product?.category || group || 'Sin categoría';
};

const getListPriceUnit = (product: ProductRecord | null | undefined) => {
  if (typeof product?.pricing?.listPrice === 'number') {
    return getNumber(product.pricing.listPrice);
  }
  return 0;
};

const safeLower = (value: unknown) => {
  if (typeof value === 'string') return value.toLowerCase();
  if (typeof value === 'number') return String(value).toLowerCase();
  return '';
};

export const useInventorySummaryData = () => {
  const { products = [], loading } = useGetProducts() as {
    products?: ProductRecord[];
    loading?: boolean;
  };
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const currency = 'DOP';

  const itemsBase = useMemo<InventorySummaryItem[]>(() => {
    return (products || []).map((product) => {
      const primaryId =
        typeof product?.id === 'string' || typeof product?.id === 'number'
          ? product.id
          : null;
      const fallbackId =
        typeof product?.cid === 'string' || typeof product?.cid === 'number'
          ? product.cid
          : null;

      return {
        id: primaryId ?? fallbackId ?? null,
        name: getName(product),
        category: getCategory(product),
        sku:
          typeof product?.sku === 'string'
            ? product.sku
            : typeof product?.barcode === 'string'
              ? product.barcode
              : '',
        unitCost:
          typeof product?.pricing?.cost === 'number'
            ? getNumber(product.pricing.cost)
            : 0,
        unitPrice: getListPriceUnit(product),
        quantity: getNumber(product?.stock ?? 0),
      };
    });
  }, [products]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    for (const item of itemsBase) {
      if (item.category) categorySet.add(item.category);
    }
    return ['all', ...Array.from(categorySet.values()).sort()];
  }, [itemsBase]);

  const filtered = useMemo<InventorySummaryItem[]>(() => {
    const normalizedQuery = safeLower(query.trim());
    return itemsBase.filter((item) => {
      const matchQuery =
        !normalizedQuery ||
        safeLower(item.name).includes(normalizedQuery) ||
        safeLower(item.sku).includes(normalizedQuery) ||
        safeLower(item.category).includes(normalizedQuery);
      const matchCategory = category === 'all' || item.category === category;
      return matchQuery && matchCategory;
    });
  }, [category, itemsBase, query]);

  const productsFiltered = useMemo<ProductRecord[]>(() => {
    const normalizedQuery = safeLower(query.trim());
    return (products || []).filter((product) => {
      const categoryValue =
        typeof product?.category === 'string'
          ? product.category
          : typeof product?.group === 'string'
            ? product.group
            : '';
      const matchQuery =
        !normalizedQuery ||
        safeLower(product?.name ?? product?.productName).includes(
          normalizedQuery,
        ) ||
        safeLower(product?.sku ?? product?.barcode).includes(normalizedQuery) ||
        safeLower(categoryValue).includes(normalizedQuery);
      const matchCategory = category === 'all' || categoryValue === category;
      return matchQuery && matchCategory;
    });
  }, [category, products, query]);

  const ptTotals = useMemo(() => {
    return productsFiltered.reduce(
      (acc, product) => {
        const qty = Number(product?.stock) || 0;
        const unitCost = Number(product?.pricing?.cost) || 0;
        const unitListPrice = Number(product?.pricing?.listPrice) || 0;

        acc.stock += qty;
        acc.cost += qty * unitCost;
        acc.listPrice += qty * unitListPrice;
        return acc;
      },
      { stock: 0, cost: 0, listPrice: 0 },
    );
  }, [productsFiltered]);

  const categoriesSummary = useMemo<CategorySummary[]>(() => {
    const summaryByCategory = new Map<string, CategorySummary>();
    for (const item of filtered) {
      const key = item.category || 'Sin categoría';
      const row = summaryByCategory.get(key) || {
        category: key,
        qty: 0,
        valueCost: 0,
        valuePrice: 0,
        avgCost: 0,
        share: 0,
      };
      row.qty += getNumber(item.quantity);
      row.valueCost += getNumber(item.quantity) * getNumber(item.unitCost);
      row.valuePrice += getNumber(item.quantity) * getNumber(item.unitPrice);
      summaryByCategory.set(key, row);
    }

    const rows = Array.from(summaryByCategory.values());
    const totalCost = rows.reduce((acc, row) => acc + row.valueCost, 0) || 1;
    for (const row of rows) {
      row.avgCost = row.qty !== 0 ? row.valueCost / row.qty : 0;
      row.share = row.valueCost / totalCost;
    }
    return rows.sort((a, b) => b.valueCost - a.valueCost);
  }, [filtered]);

  const topProducts = useMemo<TopProductRow[]>(() => {
    return filtered
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category || 'Sin categoría',
        qty: getNumber(item.quantity),
        unitCost: getNumber(item.unitCost),
        value: getNumber(item.quantity) * getNumber(item.unitCost),
        sku: item.sku || '',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  const exportExcel = useCallback(async () => {
    const rows: InventorySummaryRow[] = filtered.map((item) => ({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: getNumber(item.quantity),
      unitCost: getNumber(item.unitCost),
      unitListPrice: getNumber(item.unitPrice),
    }));

    try {
      await exportInventorySummaryToExcel(rows, {
        filenamePrefix: 'inventario_resumen',
      });
    } catch {
      // noop
    }
  }, [filtered]);

  return {
    category,
    categories,
    categoriesSummary,
    currency,
    exportExcel,
    formatCurrency,
    formatInteger,
    loading,
    productsCount: productsFiltered.length,
    ptTotals,
    query,
    setCategory,
    setQuery,
    topProducts,
  };
};
