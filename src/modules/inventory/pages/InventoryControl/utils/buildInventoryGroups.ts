// Construcción de grupos de inventario (pura) extraída de InventoryControl.tsxx
// Acepta colecciones y estados necesarios y devuelve la misma estructura que esperaba la tabla.

import {
  sum,
  buildLocations,
  getItemLocationKey,
  normalizeDateKey,
} from './inventoryHelpers';
import { CLEAR_SENTINEL } from '@/utils/inventory/constants';
import { getEffectiveExpirationDate } from '@/utils/inventory/expiration';

import type {
  BuildInventoryGroupsParams,
  InventoryChild,
  InventoryGroup,
  InventoryStockItem,
} from '@/utils/inventory/types';

function normalizeSortDate(value: unknown) {
  if (!value || value === CLEAR_SENTINEL) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  const key = normalizeDateKey(value);
  return key === 'no-date' ? '' : key;
}

/**
 * Construye los grupos de inventario.
 * @returns {Array} groups
 */
export function buildInventoryGroups({
  items, // array filtrado base
  counts,
  serverCounts,
  locationNames,
  stockFilter,
  sortDir,
  searchTerm,
  session,
  expirationEdits = {},
  countsMeta = {},
}: BuildInventoryGroupsParams): InventoryGroup[] {
  if (!Array.isArray(items)) return [];

  // Agrupar por producto
  const byProduct = new Map<string, InventoryStockItem[]>();
  for (const s of items) {
    const pid =
      s.productId || s.productID || s.product?.id || s.idProduct || null;
    const pName = s.productName || '';
    const productKey = pid || `name:${(pName || '').toLowerCase()}`;
    const arr = byProduct.get(productKey) || [];
    arr.push(s);
    byProduct.set(productKey, arr);
  }

  const out: InventoryGroup[] = [];

  for (const [productKey, groupedItems] of byProduct) {
    const productName = groupedItems[0]?.productName || 'Producto';
    const productId =
      groupedItems[0]?.productId ||
      groupedItems[0]?.productID ||
      groupedItems[0]?.product?.id ||
      groupedItems[0]?.idProduct ||
      null;

    const noExpItems = groupedItems.filter(
      (it) => !getEffectiveExpirationDate(it, expirationEdits, countsMeta),
    );
    const expItems = groupedItems.filter(
      (it) => !!getEffectiveExpirationDate(it, expirationEdits, countsMeta),
    );

    const children: InventoryChild[] = [];

    if (noExpItems.length > 0) {
      let stock = sum(noExpItems.map((x) => x.quantity ?? x.stock ?? 0));
      const key = `noexp:${productKey}`;
      const legacySum = sum(noExpItems.map((x) => counts[x.id] ?? 0));
      const real = key in counts ? counts[key] : legacySum || stock;
      if (
        session?.status === 'closed' &&
        session?.frozenChildrenStock &&
        Object.prototype.hasOwnProperty.call(session.frozenChildrenStock, key)
      ) {
        stock = Number(session.frozenChildrenStock[key] ?? stock) || 0;
      }
      children.push({
        key,
        type: 'noexp',
        productId,
        productName,
        stock,
        real,
        diff: (real ?? 0) - stock,
        expirationDate: null,
        locations: buildLocations(noExpItems, locationNames),
        sourceIds: noExpItems.map((x) => x.id),
        sources: noExpItems.map((x) => {
          const locationKey = getItemLocationKey(x);
          return {
            id: x.id,
            quantity: Number(x.quantity ?? x.stock ?? 0) || 0,
            batchNumberId: x.batchNumberId ?? null,
            batchId: x.batchId ?? null,
            expirationDate: getEffectiveExpirationDate(
              x,
              expirationEdits,
              countsMeta,
            ),
            location: locationKey || '',
            locationKey: locationKey || '',
            locationLabel: (locationKey && locationNames?.[locationKey]) || '',
          };
        }),
      });
    }

    if (expItems.length > 0) {
      const byBatch = new Map<string, InventoryStockItem[]>();
      for (const it of expItems) {
        const byId = it.batchId && String(it.batchId);
        const byNumber =
          it.batchNumberId !== undefined && it.batchNumberId !== null
            ? `bn:${String(it.batchNumberId)}`
            : null;
        const fallback = it.id ? `stock:${String(it.id)}` : 'batch-unknown';
        const bKey = byId || byNumber || fallback;
        const arr = byBatch.get(bKey) || [];
        arr.push(it);
        byBatch.set(bKey, arr);
      }
      for (const [bKey, arr] of byBatch) {
        let stock = sum(arr.map((x) => x.quantity ?? x.stock ?? 0));
        const key = `batchGroup:${bKey}`;
        const legacySum = sum(arr.map((x) => counts[x.id] ?? 0));
        const real = key in counts ? counts[key] : legacySum || stock;
        if (session?.status === 'closed' && session?.frozenChildrenStock) {
          const sample = arr[0];
          const altKeys = [key];
          const byId = sample?.batchId && String(sample.batchId);
          const byNumber =
            sample?.batchNumberId !== undefined &&
              sample?.batchNumberId !== null
              ? `bn:${String(sample.batchNumberId)}`
              : null;
          const fallbackKeys = arr
            .map((x) => (x.id ? `batchGroup:stock:${String(x.id)}` : ''))
            .filter(Boolean);
          if (byId) altKeys.push(`batchGroup:${byId}`);
          if (byNumber) altKeys.push(`batchGroup:${byNumber}`);
          altKeys.push(...fallbackKeys);
          const foundKey = altKeys.find((k) =>
            Object.prototype.hasOwnProperty.call(
              session.frozenChildrenStock,
              k,
            ),
          );
          if (foundKey) {
            stock = Number(session.frozenChildrenStock[foundKey] ?? stock) || 0;
          }
        }
        const sample = arr[0];
        children.push({
          key,
          type: 'batch',
          productId,
          productName,
          batchId: sample?.batchId,
          batchNumberId: sample?.batchNumberId,
          expirationDate: getEffectiveExpirationDate(
            sample,
            expirationEdits,
            countsMeta,
          ),
          stock,
          real,
          diff: (real ?? 0) - stock,
          locations: buildLocations(arr, locationNames),
          sourceIds: arr.map((x) => x.id),
          sources: arr.map((x) => {
            const locationKey = getItemLocationKey(x);
            return {
              id: x.id,
              quantity: Number(x.quantity ?? x.stock ?? 0) || 0,
              batchNumberId: x.batchNumberId ?? null,
              batchId: x.batchId ?? null,
              expirationDate: getEffectiveExpirationDate(
                x,
                expirationEdits,
                countsMeta,
              ),
              location: locationKey || '',
              locationKey: locationKey || '',
              locationLabel: (locationKey && locationNames?.[locationKey]) || '',
            };
          }),
        });
      }
    }

    // Ajuste real/diff si existen ediciones por source
    for (const child of children) {
      if (Array.isArray(child.sources) && child.sources.length) {
        const hasSourceEdits = child.sources.some((src) =>
          Object.prototype.hasOwnProperty.call(counts, src.id || src.key),
        );
        if (hasSourceEdits) {
          const sumSourcesReal = child.sources.reduce(
            (s, src) =>
              s +
              Number(counts[src.id || (src.key as string)] ?? src.real ?? src.stock ?? 0),
            0,
          );
          child.real = sumSourcesReal;
          child.diff = Number(sumSourcesReal ?? 0) - Number(child.stock ?? 0);
        }
      }
    }

    let totalStock = sum(children.map((c) => c.stock));
    if (session?.status === 'closed' && session?.frozenProductTotals) {
      const frozenKey = productId || productName || 'unknown';
      if (
        Object.prototype.hasOwnProperty.call(
          session.frozenProductTotals,
          frozenKey,
        )
      ) {
        totalStock = Number(
          (session?.frozenProductTotals && session.frozenProductTotals[frozenKey]) ?? totalStock,
        ) || 0;
      }
    }
    const totalReal = sum(
      children.map((c) => {
        if (Array.isArray(c.sources) && c.sources.length) {
          const hasSourceEdits =
            c.sources.some((src) =>
              Object.prototype.hasOwnProperty.call(counts, src.id || (src.key as string)),
            ) ||
            (!Object.prototype.hasOwnProperty.call(counts, c.key) &&
              c.sources.some((src) =>
                Object.prototype.hasOwnProperty.call(
                  serverCounts || {},
                  src.id || (src.key as string),
                ),
              ));
          if (hasSourceEdits) {
            return c.sources.reduce(
              (s, src) =>
                s +
                Number(counts[src.id || (src.key as string)] ?? src.real ?? src.stock ?? 0),
              0,
            );
          }
        }
        return counts[c.key] ?? c.real ?? c.stock;
      }),
    );
    const totalDiff = (totalReal ?? 0) - (totalStock ?? 0);
    const expirationSortValue = (() => {
      const dates = [];
      for (const child of children) {
        if (child.type !== 'batch') continue;
        if (Array.isArray(child.sources) && child.sources.length) {
          for (const src of child.sources) {
            const normalized = normalizeSortDate(
              src.expirationDate || child.expirationDate,
            );
            if (normalized) dates.push(normalized);
          }
        } else {
          const normalized = normalizeSortDate(child.expirationDate);
          if (normalized) dates.push(normalized);
        }
      }
      if (!dates.length) return '';
      dates.sort();
      return dates[0];
    })();

    let canEditAtTop = false;
    let topKey = undefined;
    if (children.length === 1) {
      canEditAtTop = true;
      topKey = children[0].key;
    }

    out.push({
      productId,
      productKey,
      productName,
      totalStock,
      totalReal,
      totalDiff,
      expirationSortValue,
      _children: children,
      canEditAtTop,
      topKey,
    });
  }

  const sorted = [...out].sort((a, b) => {
    const an = (a.productName || '').toLowerCase();
    const bn = (b.productName || '').toLowerCase();
    if (an < bn) return sortDir === 'asc' ? -1 : 1;
    if (an > bn) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  let filteredOut = sorted;
  if (stockFilter === 'with')
    filteredOut = sorted.filter((g) => Number(g.totalStock ?? 0) > 0);
  else if (stockFilter === 'without')
    filteredOut = sorted.filter((g) => Number(g.totalStock ?? 0) <= 0);

  const term = (searchTerm || '').trim().toLowerCase();
  if (!term) return filteredOut;
  return filteredOut.filter(
    (g) =>
      (g.productName || '').toLowerCase().includes(term) ||
      g._children?.some((c) =>
        String(c.batchNumberId ?? '')
          .toLowerCase()
          .includes(term),
      ),
  );
}

export default buildInventoryGroups;
