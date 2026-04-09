export type ProductDoc = {
  id: string;
  name?: string;
  stock?: number;
  [key: string]: unknown;
};

export type BatchDoc = {
  id: string;
  productId?: string;
  quantity?: number;
  numberId?: string | number | null;
  [key: string]: unknown;
};

export type ProductStockDoc = {
  id: string;
  productId?: string;
  batchId?: string | null;
  quantity?: number;
  status?: string | null;
  isDeleted?: boolean;
  [key: string]: unknown;
};

export type DiagnosticsSummary = {
  products: number;
  batches: number;
  stocks: number;
  productMismatches: number;
  batchMismatches: number;
  orphans: number;
};

export type StockMismatchRow = {
  productId: string;
  name: string;
  declaredStock: number;
  stockFromProductsStock: number;
  delta: number;
};

export type BatchMismatchRow = {
  batchId: string;
  productId?: string | null;
  numberId?: string | number | null;
  declaredQuantity: number;
  stockFromProductsStock: number;
  delta: number;
  productMissing: boolean;
};

export type OrphanStockRow = {
  stockId: string;
  productId?: string;
  batchId?: string | null;
  quantity: number;
  reason: string;
};

export const numberValue = (v: unknown): number =>
  typeof v === 'number' ? v : parseFloat(String(v)) || 0;

export function includeActiveStock(s: ProductStockDoc): boolean {
  const notDeleted = s?.isDeleted !== true; // missing counts as not deleted
  const isActive = s?.status === 'active' || s?.status == null; // missing counts as active
  return notDeleted && isActive;
}

export function computeSyncDiagnostics(params: {
  products: ProductDoc[];
  batches: BatchDoc[];
  stocks: ProductStockDoc[];
}): {
  summary: DiagnosticsSummary;
  productMismatches: StockMismatchRow[];
  batchMismatches: BatchMismatchRow[];
  orphanStocks: OrphanStockRow[];
} {
  const { products, batches, stocks } = params;

  const activeStocks = stocks.filter(includeActiveStock);

  const productById = new Map(products.map((p) => [String(p.id), p]));
  const batchById = new Map(batches.map((b) => [String(b.id), b]));

  const stockByProduct = new Map<string, number>();
  for (const s of activeStocks) {
    const pid = String(s.productId || '');
    if (!stockByProduct.has(pid)) stockByProduct.set(pid, 0);
    stockByProduct.set(pid, (stockByProduct.get(pid) || 0) + numberValue(s.quantity));
  }

  const productDiffs: StockMismatchRow[] = [];
  for (const p of products) {
    const sum = stockByProduct.get(String(p.id)) || 0;
    const declared = numberValue(p.stock);
    if (declared !== sum) {
      productDiffs.push({
        productId: String(p.id),
        name: (p.name as string | undefined) || '',
        declaredStock: declared,
        stockFromProductsStock: sum,
        delta: sum - declared,
      });
    }
  }

  const stockByBatch = new Map<string, number>();
  for (const s of activeStocks) {
    const bid = s.batchId ? String(s.batchId) : null;
    if (!bid) continue;
    if (!stockByBatch.has(bid)) stockByBatch.set(bid, 0);
    stockByBatch.set(bid, (stockByBatch.get(bid) || 0) + numberValue(s.quantity));
  }

  const batchDiffs: BatchMismatchRow[] = [];
  for (const b of batches) {
    const sum = stockByBatch.get(String(b.id)) || 0;
    const declared = numberValue(b.quantity);
    const prodExists = b.productId ? productById.has(String(b.productId)) : false;
    const prodMissing = !prodExists;
    if (declared !== sum || prodMissing) {
      batchDiffs.push({
        batchId: String(b.id),
        productId: (b.productId as string | undefined) || null,
        numberId: (b.numberId as string | number | null | undefined) ?? null,
        declaredQuantity: declared,
        stockFromProductsStock: sum,
        delta: sum - declared,
        productMissing: prodMissing,
      });
    }
  }

  const orphans: OrphanStockRow[] = [];
  for (const s of activeStocks) {
    const pid = String(s.productId || '');
    const bid = s.batchId ? String(s.batchId) : null;
    const productExists = productById.has(pid);
    const batchExists = bid ? batchById.has(bid) : true;
    if (!productExists || !batchExists) {
      orphans.push({
        stockId: String(s.id),
        productId: (s.productId as string | undefined) || undefined,
        batchId: (s.batchId as string | null | undefined) ?? null,
        quantity: numberValue(s.quantity),
        reason: `${!productExists ? 'ProductNotFound ' : ''}${!batchExists ? 'BatchNotFound' : ''}`.trim(),
      });
    }
  }

  return {
    productMismatches: productDiffs,
    batchMismatches: batchDiffs,
    orphanStocks: orphans,
    summary: {
      products: products.length,
      batches: batches.length,
      stocks: activeStocks.length,
      productMismatches: productDiffs.length,
      batchMismatches: batchDiffs.length,
      orphans: orphans.length,
    },
  };
}

