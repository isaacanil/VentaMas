import { nanoid } from 'nanoid';

import type { UserIdentity } from '@/types/users';

import type {
  Purchase,
  PurchaseReceiptEvent,
  PurchaseReplenishment,
  PurchaseWorkflowStatus,
} from './types';
import { resolvePurchaseLineQuantities } from './workflow';

interface WarehouseSnapshot {
  id?: string | null;
  name?: unknown;
  shortName?: unknown;
}

interface BuildPurchaseReceiptHistoryParams {
  currentHistory?: Purchase['receiptHistory'];
  nextReplenishments?: Purchase['replenishments'];
  receiptReplenishments: PurchaseReplenishment[];
  user: UserIdentity;
  warehouse?: WarehouseSnapshot | null;
  workflowStatusAfter: PurchaseWorkflowStatus;
  receivedAt?: number;
}

const resolveWarehouseName = (warehouse?: WarehouseSnapshot | null) => {
  if (!warehouse) return null;

  if (typeof warehouse.name === 'string' && warehouse.name.trim()) {
    return warehouse.name.trim();
  }

  if (typeof warehouse.shortName === 'string' && warehouse.shortName.trim()) {
    return warehouse.shortName.trim();
  }

  return warehouse.id ?? null;
};

const resolveReceiptActor = (user: UserIdentity) => ({
  uid: user.uid ?? user.id ?? null,
  name: user.displayName ?? user.realName ?? user.name ?? user.uid ?? null,
  role: user.activeRole ?? user.role ?? null,
});

const resolveRemainingPurchasePendingQuantity = (
  replenishments?: Purchase['replenishments'],
) =>
  (Array.isArray(replenishments) ? replenishments : []).reduce((sum, item) => {
    const { pendingQuantity } = resolvePurchaseLineQuantities(item);
    return sum + pendingQuantity;
  }, 0);

export const buildPurchaseReceiptHistory = ({
  currentHistory,
  nextReplenishments,
  receiptReplenishments,
  user,
  warehouse,
  workflowStatusAfter,
  receivedAt = Date.now(),
}: BuildPurchaseReceiptHistoryParams): PurchaseReceiptEvent[] => {
  const history = Array.isArray(currentHistory) ? currentHistory : [];
  const items = receiptReplenishments.map((item) => ({
    ...item,
  }));
  const receivedQuantity = items.reduce((sum, item) => {
    const qty =
      Number(item.receivedQuantity ?? item.quantity ?? item.purchaseQuantity) ||
      0;
    return sum + qty;
  }, 0);

  const entry: PurchaseReceiptEvent = {
    id: nanoid(),
    receivedAt,
    warehouseId: warehouse?.id ?? null,
    warehouseName: resolveWarehouseName(warehouse),
    receivedBy: resolveReceiptActor(user),
    workflowStatusAfter,
    items,
    summary: {
      lineCount: items.length,
      receivedQuantity,
      remainingPurchasePendingQuantity:
        resolveRemainingPurchasePendingQuantity(nextReplenishments),
    },
  };

  return [...history, entry];
};
