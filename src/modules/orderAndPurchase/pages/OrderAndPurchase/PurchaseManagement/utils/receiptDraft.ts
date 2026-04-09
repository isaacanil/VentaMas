import type { Purchase, PurchaseReplenishment } from '@/utils/purchase/types';
import { resolvePurchaseLineQuantities } from '@/utils/purchase/workflow';

type ReceiptDraftRow = PurchaseReplenishment & {
  key?: string | number;
  receivingNow?: unknown;
};

export const resolveReceiptRowKey = (
  item: { id?: string; key?: string | number },
  fallback: string | number,
): string | number => item.id || item.key || fallback;

export const stripTransientReceiptFields = <T extends ReceiptDraftRow>(
  item: T,
): Omit<T, 'receivingNow'> => {
  const { receivingNow: _receivingNow, ...sanitizedItem } = item;
  return sanitizedItem;
};

export const sanitizePurchaseReceiptDraftFields = (
  replenishments: Purchase['replenishments'],
): PurchaseReplenishment[] =>
  Array.isArray(replenishments)
    ? replenishments.map((item) =>
        stripTransientReceiptFields(item as ReceiptDraftRow),
      )
    : [];

export const resolveReceivingNowValue = (
  item: ReceiptDraftRow,
  initialReceivedMap: Map<string | number, number>,
  fallback: string | number,
): number => {
  const rowKey = resolveReceiptRowKey(item, fallback);
  const initialReceived = initialReceivedMap.get(rowKey) || 0;
  const currentReceived = resolvePurchaseLineQuantities(item).receivedQuantity;
  return Math.max(0, currentReceived - initialReceived);
};
