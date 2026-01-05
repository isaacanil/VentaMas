import { CLEAR_SENTINEL } from './constants';
import type {
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryStockItem,
} from './types';

export function getEffectiveExpirationDate(
  item: InventoryStockItem,
  expirationEdits: ExpirationEditsMap,
  countsMeta: CountsMetaMap,
) {
  if (!item) return item?.expirationDate;
  const edits = expirationEdits || {};
  const meta = countsMeta || {};
  const itemId = item.id;

  if (itemId && Object.prototype.hasOwnProperty.call(edits, itemId)) {
    const editValue = edits[itemId];
    if (editValue === CLEAR_SENTINEL) return null;
    if (editValue) return editValue;
  }
  if (
    itemId &&
    meta[itemId] &&
    Object.prototype.hasOwnProperty.call(meta[itemId], 'manualExpirationDate')
  ) {
    const saved = meta[itemId].manualExpirationDate;
    if (saved === CLEAR_SENTINEL) return null;
    if (saved) return saved;
  }

  const productKey =
    item.productId || `name:${(item.productName || '').toLowerCase()}`;
  const itemKey = `noexp:${productKey}`;
  const byIdKey = item.batchId ? `batchGroup:${item.batchId}` : null;
  const byNumberKey =
    item.batchNumberId !== undefined && item.batchNumberId !== null
      ? `batchGroup:bn:${item.batchNumberId}`
      : null;
  const fallbackKey = itemId ? `batchGroup:stock:${itemId}` : null;

  const candidateKeys = [itemKey, byIdKey, byNumberKey, fallbackKey].filter(
    Boolean,
  );
  for (const k of candidateKeys) {
    if (!Object.prototype.hasOwnProperty.call(edits, k)) continue;
    const editValue = edits[k];
    if (editValue === CLEAR_SENTINEL) return null;
    if (editValue) return editValue;
  }

  for (const k of candidateKeys) {
    if (
      !meta[k] ||
      !Object.prototype.hasOwnProperty.call(meta[k], 'manualExpirationDate')
    )
      continue;
    const saved = meta[k].manualExpirationDate;
    if (saved === CLEAR_SENTINEL) return null;
    if (saved) return saved;
  }

  return item.expirationDate;
}
