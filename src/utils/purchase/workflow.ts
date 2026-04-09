import type {
  Purchase,
  PurchaseReplenishment,
  PurchaseWorkflowStatus,
} from './types';

const CANCELED_STATUSES = new Set(['canceled', 'cancelled']);
const COMPLETED_STATUSES = new Set(['completed', 'delivered']);
const PARTIAL_RECEIPT_STATUSES = new Set(['processing']);
const PENDING_RECEIPT_STATUSES = new Set(['pending', 'requested']);

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const clampNonNegative = (value: number): number =>
  Math.max(0, Math.round(value * 1000) / 1000);

const QUANTITY_TOLERANCE = 0.001;

export interface PurchaseLineQuantities {
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
}

export interface PurchaseReceiptChanges {
  nextReplenishments: PurchaseReplenishment[];
  receiptReplenishments: PurchaseReplenishment[];
  completedBackOrderIds: string[];
}

export const resolvePurchaseLineQuantities = (
  item: PurchaseReplenishment,
): PurchaseLineQuantities => {
  const orderedQuantity =
    toFiniteNumber(item.orderedQuantity) ??
    toFiniteNumber(item.purchaseQuantity) ??
    toFiniteNumber(item.quantity) ??
    0;
  const normalizedOrderedQuantity = clampNonNegative(orderedQuantity);
  const explicitReceivedQuantity = toFiniteNumber(item.receivedQuantity);
  const explicitPendingQuantity = toFiniteNumber(item.pendingQuantity);

  if (explicitReceivedQuantity != null) {
    const receivedQuantity = clampNonNegative(
      Math.min(explicitReceivedQuantity, normalizedOrderedQuantity),
    );
    const derivedPendingQuantity = clampNonNegative(
      normalizedOrderedQuantity - receivedQuantity,
    );
    const pendingQuantity = explicitPendingQuantity != null
      ? (() => {
          const normalizedPendingQuantity = clampNonNegative(
            Math.min(explicitPendingQuantity, normalizedOrderedQuantity),
          );
          const quantitiesAreConsistent =
            Math.abs(
              receivedQuantity +
                normalizedPendingQuantity -
                normalizedOrderedQuantity,
            ) <= QUANTITY_TOLERANCE;

          return quantitiesAreConsistent
            ? normalizedPendingQuantity
            : derivedPendingQuantity;
        })()
      : derivedPendingQuantity;

    return {
      orderedQuantity: normalizedOrderedQuantity,
      receivedQuantity,
      pendingQuantity,
    };
  }

  if (explicitPendingQuantity != null) {
    const pendingQuantity = clampNonNegative(
      Math.min(explicitPendingQuantity, normalizedOrderedQuantity),
    );
    return {
      orderedQuantity: normalizedOrderedQuantity,
      receivedQuantity: clampNonNegative(
        normalizedOrderedQuantity - pendingQuantity,
      ),
      pendingQuantity,
    };
  }

  return {
    orderedQuantity: normalizedOrderedQuantity,
    receivedQuantity: 0,
    pendingQuantity: normalizedOrderedQuantity,
  };
};

export const normalizePurchaseReplenishment = (
  item: PurchaseReplenishment,
  options: { receiveAll?: boolean } = {},
): PurchaseReplenishment => {
  const quantities = resolvePurchaseLineQuantities(item);
  const nextQuantities = options.receiveAll
    ? {
        orderedQuantity: quantities.orderedQuantity,
        receivedQuantity: quantities.orderedQuantity,
        pendingQuantity: 0,
      }
    : quantities;

  return {
    ...item,
    orderedQuantity: nextQuantities.orderedQuantity,
    receivedQuantity: nextQuantities.receivedQuantity,
    pendingQuantity: nextQuantities.pendingQuantity,
  };
};

export const normalizePurchaseReplenishments = (
  replenishments: Purchase['replenishments'],
  options: { receiveAll?: boolean } = {},
): PurchaseReplenishment[] =>
  Array.isArray(replenishments)
    ? replenishments.map((item) =>
        normalizePurchaseReplenishment(item, options),
      )
    : [];

const normalizeWorkflowStatusValue = (
  value: unknown,
): PurchaseWorkflowStatus | null => {
  const normalized = toNonEmptyString(value)?.toLowerCase();
  if (!normalized) return null;
  if (normalized === 'pending_receipt') return 'pending_receipt';
  if (normalized === 'partial_receipt') return 'partial_receipt';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'canceled';
  return null;
};

export const resolvePurchaseWorkflowStatus = (
  purchase: Purchase | Record<string, unknown>,
): PurchaseWorkflowStatus => {
  const explicitWorkflowStatus = normalizeWorkflowStatusValue(
    (purchase as Purchase).workflowStatus,
  );
  if (explicitWorkflowStatus === 'canceled') {
    return explicitWorkflowStatus;
  }

  const normalizedStatus = toNonEmptyString((purchase as Purchase).status)?.toLowerCase();
  if (normalizedStatus && CANCELED_STATUSES.has(normalizedStatus)) {
    return 'canceled';
  }
  if (normalizedStatus && COMPLETED_STATUSES.has(normalizedStatus)) {
    return 'completed';
  }
  if (normalizedStatus && PARTIAL_RECEIPT_STATUSES.has(normalizedStatus)) {
    return 'partial_receipt';
  }

  const replenishments = normalizePurchaseReplenishments(
    (purchase as Purchase).replenishments,
  );
  const totals = replenishments.reduce(
    (acc, item) => {
      const quantities = resolvePurchaseLineQuantities(item);
      return {
        ordered: acc.ordered + quantities.orderedQuantity,
        received: acc.received + quantities.receivedQuantity,
        pending: acc.pending + quantities.pendingQuantity,
      };
    },
    { ordered: 0, received: 0, pending: 0 },
  );
  const hasReceiptQuantities =
    totals.ordered > QUANTITY_TOLERANCE ||
    totals.received > QUANTITY_TOLERANCE ||
    totals.pending > QUANTITY_TOLERANCE;

  if (hasReceiptQuantities) {
    if (totals.ordered > 0 && totals.pending <= 0) {
      return 'completed';
    }
    if (totals.received > 0 && totals.pending > 0) {
      return 'partial_receipt';
    }
    if (totals.ordered > 0) {
      return 'pending_receipt';
    }
  }

  if (explicitWorkflowStatus) {
    return explicitWorkflowStatus;
  }
  if (normalizedStatus && PENDING_RECEIPT_STATUSES.has(normalizedStatus)) {
    return 'pending_receipt';
  }
  return 'pending_receipt';
};

export const resolveLegacyPurchaseStatus = (
  workflowStatus: PurchaseWorkflowStatus,
): string => {
  switch (workflowStatus) {
    case 'completed':
      return 'completed';
    case 'canceled':
      return 'canceled';
    case 'partial_receipt':
      return 'processing';
    case 'pending_receipt':
    default:
      return 'pending';
  }
};

export const canEditPurchase = (
  purchase: Purchase | Record<string, unknown>,
): boolean => resolvePurchaseWorkflowStatus(purchase) === 'pending_receipt';

export const canCompletePurchase = (
  purchase: Purchase | Record<string, unknown>,
): boolean => {
  const workflowStatus = resolvePurchaseWorkflowStatus(purchase);
  return (
    workflowStatus === 'pending_receipt' ||
    workflowStatus === 'partial_receipt'
  );
};

export const canCancelPurchase = (
  purchase: Purchase | Record<string, unknown>,
): boolean => {
  if (resolvePurchaseWorkflowStatus(purchase) !== 'pending_receipt') {
    return false;
  }
  const paid = Number((purchase as Purchase).paymentState?.paid ?? 0);
  return !Number.isFinite(paid) || paid <= 0;
};

export const enrichPurchaseWorkflow = <T extends Purchase | Record<string, unknown>>(
  purchase: T,
): T & { workflowStatus: PurchaseWorkflowStatus } => {
  const workflowStatus = resolvePurchaseWorkflowStatus(purchase);
  const normalizedStatus = toNonEmptyString((purchase as Purchase).status);

  return {
    ...purchase,
    workflowStatus,
    status: normalizedStatus ?? resolveLegacyPurchaseStatus(workflowStatus),
  };
};

export const resolvePurchaseReceiptChanges = (
  previousReplenishments: Purchase['replenishments'],
  nextReplenishments: Purchase['replenishments'],
): PurchaseReceiptChanges => {
  const previous = normalizePurchaseReplenishments(previousReplenishments);
  const next = normalizePurchaseReplenishments(nextReplenishments);
  const receiptReplenishments: PurchaseReplenishment[] = [];
  const completedBackOrderIds = new Set<string>();

  next.forEach((item, index) => {
    const previousItem = previous[index];
    const previousQuantities = previousItem
      ? resolvePurchaseLineQuantities(previousItem)
      : {
          orderedQuantity: 0,
          receivedQuantity: 0,
          pendingQuantity: 0,
        };
    const nextQuantities = resolvePurchaseLineQuantities(item);

    if (nextQuantities.receivedQuantity < previousQuantities.receivedQuantity) {
      throw new Error(
        `La cantidad recibida no puede disminuir para el producto "${item.name || item.id || index}".`,
      );
    }

    const receivedNowQuantity = clampNonNegative(
      nextQuantities.receivedQuantity - previousQuantities.receivedQuantity,
    );

    if (receivedNowQuantity > 0) {
      receiptReplenishments.push({
        ...item,
        quantity: receivedNowQuantity,
        purchaseQuantity: receivedNowQuantity,
        receivedQuantity: receivedNowQuantity,
        pendingQuantity: nextQuantities.pendingQuantity,
      });
    }

    if (
      previousQuantities.pendingQuantity > 0 &&
      nextQuantities.pendingQuantity <= 0
    ) {
      (item.selectedBackOrders || []).forEach((backOrder) => {
        if (backOrder?.id) {
          completedBackOrderIds.add(backOrder.id);
        }
      });
    }
  });

  return {
    nextReplenishments: next,
    receiptReplenishments,
    completedBackOrderIds: Array.from(completedBackOrderIds),
  };
};
