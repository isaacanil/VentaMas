import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import { getNextID } from '../../../core/utils/getNextID.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  assertAccountingPeriodOpenInTransaction,
} from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import {
  MovementReason,
  MovementType,
} from '../../Inventory/services/movementEnums.js';
import { getDefaultWarehouse } from '../../warehouse/services/defaultWarehouse.service.js';
import {
  THRESHOLD,
  asRecord,
  buildPurchasePaymentState,
  isActiveSupplierPaymentRecord,
  resolvePaymentAmount,
  resolvePurchaseDocumentTotal,
  roundToTwoDecimals,
  safeNumber,
  toCleanString,
  toMillis,
} from './payablePayments.shared.js';

const REGION = 'us-central1';
const MEMORY = '512MiB';
const NODE_VERSION = '20';
const QUANTITY_TOLERANCE = 0.001;
const RESUMABLE_RECEIPT_INVENTORY_STATUSES = new Set(['pending', 'failed']);

const CANCELED_STATUSES = new Set(['canceled', 'cancelled']);
const COMPLETED_STATUSES = new Set(['completed', 'delivered']);
const PARTIAL_RECEIPT_STATUSES = new Set(['processing']);
const PENDING_RECEIPT_STATUSES = new Set(['pending', 'requested']);
const UNSAFE_RECEIPT_PURCHASE_INPUT_FIELDS = new Set([
  'accountsPayable',
  'amount',
  'condition',
  'monetary',
  'payables',
  'payment',
  'paymentAt',
  'paymentMethods',
  'paymentState',
  'paymentTerms',
  'provider',
  'providerId',
  'providerName',
  'supplier',
  'supplierId',
  'supplierName',
  'supplierCreditNotes',
  'total',
  'totalAmount',
  'totalPurchase',
  'totalPurchaseWithoutTaxes',
  'totals',
  'vendorBill',
]);

const toNonEmptyString = (value) => toCleanString(value);
const clampNonNegative = (value) =>
  Math.max(0, Math.round(Number(value || 0) * 1000) / 1000);

const resolveFiniteNumber = (...values) => {
  for (const value of values) {
    const number = safeNumber(value);
    if (number != null && number > 0) return number;
  }
  return null;
};

const toAdminTimestampOrNull = (value) => {
  const millis = toMillis(value);
  return typeof millis === 'number' && Number.isFinite(millis)
    ? Timestamp.fromMillis(millis)
    : null;
};

const resolvePurchaseCompletionEffectiveDate = (purchase) =>
  purchase?.completedAt ??
  purchase?.deliveryAt ??
  asRecord(purchase?.dates).deliveryDate ??
  Date.now();

const sanitizeReceiptPurchaseInput = (purchaseInput) => {
  const record = asRecord(purchaseInput);
  const safeInput = {};
  for (const [key, value] of Object.entries(record)) {
    if (UNSAFE_RECEIPT_PURCHASE_INPUT_FIELDS.has(key)) continue;
    if (key === 'completedAt') continue;
    if (key === 'dates') {
      const dates = Object.fromEntries(
        Object.entries(asRecord(value)).filter(
          ([dateKey]) => dateKey !== 'paymentDate',
        ),
      );
      if (Object.keys(dates).length) {
        safeInput.dates = dates;
      }
      continue;
    }
    safeInput[key] = value;
  }
  return safeInput;
};

const resolveLineFinancialTotal = (item) => {
  const record = asRecord(item);
  const explicitTotal = safeNumber(record.total ?? record.totalAmount);
  if (explicitTotal != null) return roundToTwoDecimals(explicitTotal);

  const taxAmount = safeNumber(
    record.calculatedITBIS ?? record.taxAmount ?? record.taxes,
  );
  const explicitSubtotal = safeNumber(record.subtotal ?? record.subTotal);
  if (explicitSubtotal != null) {
    return roundToTwoDecimals(explicitSubtotal + (taxAmount ?? 0));
  }

  const quantity =
    safeNumber(record.orderedQuantity) ??
    safeNumber(record.purchaseQuantity) ??
    safeNumber(record.quantity) ??
    0;
  const unitCost = resolveFiniteNumber(
    record.unitCost,
    record.baseCost,
    record.cost,
  );
  return roundToTwoDecimals((unitCost ?? 0) * quantity + (taxAmount ?? 0));
};

const resolveReceiptDocumentTotal = (purchaseRecord) => {
  const trustedDocumentTotal = resolvePurchaseDocumentTotal({
    ...purchaseRecord,
    paymentState: null,
  });
  if (trustedDocumentTotal > 0) return trustedDocumentTotal;

  const replenishments = Array.isArray(purchaseRecord.replenishments)
    ? purchaseRecord.replenishments
    : [];
  return roundToTwoDecimals(
    replenishments.reduce(
      (sum, item) => sum + resolveLineFinancialTotal(item),
      0,
    ),
  );
};

const resolveReceiptPaymentTerms = (purchaseRecord) => {
  const existingTerms = asRecord(purchaseRecord.paymentTerms);
  const dates = asRecord(purchaseRecord.dates);
  const condition = toNonEmptyString(
    existingTerms.condition ?? purchaseRecord.condition,
  );
  const expectedPaymentAt =
    existingTerms.expectedPaymentAt ??
    purchaseRecord.paymentAt ??
    dates.paymentDate ??
    null;
  const nextPaymentAt = existingTerms.nextPaymentAt ?? expectedPaymentAt ?? null;
  const isImmediate = existingTerms.isImmediate === true || condition === 'cash';
  const scheduleType =
    toNonEmptyString(existingTerms.scheduleType) ??
    (isImmediate ? 'immediate' : condition ? 'deferred' : null);

  if (
    !Object.keys(existingTerms).length &&
    !condition &&
    !expectedPaymentAt &&
    !nextPaymentAt
  ) {
    return null;
  }

  return {
    ...existingTerms,
    condition: condition ?? null,
    expectedPaymentAt,
    nextPaymentAt,
    isImmediate,
    scheduleType: scheduleType ?? 'custom',
  };
};

const resolveActivePaymentSummary = async ({ businessId, purchaseId }) => {
  const paymentsSnap = await db
    .collection(`businesses/${businessId}/accountsPayablePayments`)
    .where('purchaseId', '==', purchaseId)
    .get();

  const activePayments = paymentsSnap.docs
    .map((paymentDoc) => ({
      id: paymentDoc.id,
      ...asRecord(paymentDoc.data()),
    }))
    .filter((paymentRecord) => isActiveSupplierPaymentRecord(paymentRecord));
  const paid = roundToTwoDecimals(
    activePayments.reduce(
      (sum, paymentRecord) => sum + resolvePaymentAmount(paymentRecord),
      0,
    ),
  );
  const sortedPayments = activePayments.sort((left, right) => {
    const leftMillis = toMillis(left.occurredAt) ?? toMillis(left.createdAt) ?? 0;
    const rightMillis =
      toMillis(right.occurredAt) ?? toMillis(right.createdAt) ?? 0;
    return rightMillis - leftMillis;
  });
  const latestPayment = sortedPayments[0] ?? null;

  return {
    paid,
    paymentCount: activePayments.length,
    lastPaymentAt: latestPayment?.occurredAt ?? latestPayment?.createdAt ?? null,
    lastPaymentId: latestPayment?.id ?? null,
    nextPaymentAt: latestPayment?.nextPaymentAt ?? null,
  };
};

const resolveReceiptPaymentState = async ({
  businessId,
  purchaseId,
  purchaseRecord,
  paymentTerms,
}) => {
  const total = resolveReceiptDocumentTotal(purchaseRecord);
  const paymentSummary = await resolveActivePaymentSummary({
    businessId,
    purchaseId,
  });
  const balance = roundToTwoDecimals(Math.max(total - paymentSummary.paid, 0));
  const nextPaymentAt =
    balance > THRESHOLD
      ? paymentSummary.nextPaymentAt ??
        paymentTerms?.nextPaymentAt ??
        paymentTerms?.expectedPaymentAt ??
        null
      : null;

  return buildPurchasePaymentState({
    purchaseRecord,
    total,
    paid: paymentSummary.paid,
    paymentCount: paymentSummary.paymentCount,
    lastPaymentAt: paymentSummary.lastPaymentAt,
    lastPaymentId: paymentSummary.lastPaymentId,
    nextPaymentAt,
  });
};

const normalizeWorkflowStatusValue = (value) => {
  const normalized = toNonEmptyString(value)?.toLowerCase();
  if (!normalized) return null;
  if (normalized === 'pending_receipt') return 'pending_receipt';
  if (normalized === 'partial_receipt') return 'partial_receipt';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'canceled';
  return null;
};

export const resolvePurchaseLineQuantities = (item) => {
  const orderedQuantity =
    safeNumber(item?.orderedQuantity) ??
    safeNumber(item?.purchaseQuantity) ??
    safeNumber(item?.quantity) ??
    0;
  const normalizedOrderedQuantity = clampNonNegative(orderedQuantity);
  const explicitReceivedQuantity = safeNumber(item?.receivedQuantity);
  const explicitPendingQuantity = safeNumber(item?.pendingQuantity);

  if (explicitReceivedQuantity != null) {
    const receivedQuantity = clampNonNegative(
      Math.min(explicitReceivedQuantity, normalizedOrderedQuantity),
    );
    const derivedPendingQuantity = clampNonNegative(
      normalizedOrderedQuantity - receivedQuantity,
    );
    const pendingQuantity =
      explicitPendingQuantity != null
        ? (() => {
            const normalizedPendingQuantity = clampNonNegative(
              Math.min(explicitPendingQuantity, normalizedOrderedQuantity),
            );
            const consistent =
              Math.abs(
                receivedQuantity +
                  normalizedPendingQuantity -
                  normalizedOrderedQuantity,
              ) <= QUANTITY_TOLERANCE;
            return consistent
              ? normalizedPendingQuantity
              : derivedPendingQuantity;
          })()
        : derivedPendingQuantity;

    return { orderedQuantity: normalizedOrderedQuantity, receivedQuantity, pendingQuantity };
  }

  if (explicitPendingQuantity != null) {
    const pendingQuantity = clampNonNegative(
      Math.min(explicitPendingQuantity, normalizedOrderedQuantity),
    );
    return {
      orderedQuantity: normalizedOrderedQuantity,
      receivedQuantity: clampNonNegative(normalizedOrderedQuantity - pendingQuantity),
      pendingQuantity,
    };
  }

  return {
    orderedQuantity: normalizedOrderedQuantity,
    receivedQuantity: 0,
    pendingQuantity: normalizedOrderedQuantity,
  };
};

const normalizePurchaseReplenishments = (replenishments) =>
  Array.isArray(replenishments)
    ? replenishments.map((item) => {
        const record = asRecord(item);
        const quantities = resolvePurchaseLineQuantities(record);
        return {
          ...record,
          orderedQuantity: quantities.orderedQuantity,
          receivedQuantity: quantities.receivedQuantity,
          pendingQuantity: quantities.pendingQuantity,
        };
      })
    : [];

const resolvePurchaseWorkflowStatus = (purchase) => {
  const explicitWorkflowStatus = normalizeWorkflowStatusValue(
    purchase?.workflowStatus,
  );
  if (explicitWorkflowStatus === 'canceled') return explicitWorkflowStatus;

  const normalizedStatus = toNonEmptyString(purchase?.status)?.toLowerCase();
  if (normalizedStatus && CANCELED_STATUSES.has(normalizedStatus)) return 'canceled';
  if (normalizedStatus && COMPLETED_STATUSES.has(normalizedStatus)) return 'completed';
  if (normalizedStatus && PARTIAL_RECEIPT_STATUSES.has(normalizedStatus)) {
    return 'partial_receipt';
  }

  const totals = normalizePurchaseReplenishments(purchase?.replenishments).reduce(
    (acc, item) => {
      const quantities = resolvePurchaseLineQuantities(item);
      acc.ordered += quantities.orderedQuantity;
      acc.received += quantities.receivedQuantity;
      acc.pending += quantities.pendingQuantity;
      return acc;
    },
    { ordered: 0, received: 0, pending: 0 },
  );

  if (
    totals.ordered > QUANTITY_TOLERANCE ||
    totals.received > QUANTITY_TOLERANCE ||
    totals.pending > QUANTITY_TOLERANCE
  ) {
    if (totals.ordered > 0 && totals.pending <= 0) return 'completed';
    if (totals.received > 0 && totals.pending > 0) return 'partial_receipt';
    if (totals.ordered > 0) return 'pending_receipt';
  }

  if (explicitWorkflowStatus) return explicitWorkflowStatus;
  if (normalizedStatus && PENDING_RECEIPT_STATUSES.has(normalizedStatus)) {
    return 'pending_receipt';
  }
  return 'pending_receipt';
};

const resolveLegacyPurchaseStatus = (workflowStatus) => {
  if (workflowStatus === 'completed') return 'completed';
  if (workflowStatus === 'canceled') return 'canceled';
  if (workflowStatus === 'partial_receipt') return 'processing';
  return 'pending';
};

const canCompletePurchase = (purchase) => {
  const workflowStatus = resolvePurchaseWorkflowStatus(purchase);
  return workflowStatus === 'pending_receipt' || workflowStatus === 'partial_receipt';
};

export const resolvePurchaseReceiptChanges = (
  previousReplenishments,
  nextReplenishments,
) => {
  const previous = normalizePurchaseReplenishments(previousReplenishments);
  const next = normalizePurchaseReplenishments(nextReplenishments);
  const receiptReplenishments = [];
  const completedBackOrderIds = new Set();

  next.forEach((item, index) => {
    const previousItem = previous[index];
    if (!previousItem) {
      throw new HttpsError(
        'failed-precondition',
        'No se pueden recibir productos que no pertenecen a la compra persistida.',
      );
    }
    const previousQuantities = previousItem
      ? resolvePurchaseLineQuantities(previousItem)
      : { orderedQuantity: 0, receivedQuantity: 0, pendingQuantity: 0 };
    const nextQuantities = resolvePurchaseLineQuantities({
      ...item,
      orderedQuantity: previousQuantities.orderedQuantity,
      purchaseQuantity: previousQuantities.orderedQuantity,
      quantity: previousQuantities.orderedQuantity,
    });
    const safeNextItem = {
      ...previousItem,
      receivedQuantity: nextQuantities.receivedQuantity,
      pendingQuantity: nextQuantities.pendingQuantity,
      orderedQuantity: previousQuantities.orderedQuantity,
    };

    if (nextQuantities.receivedQuantity < previousQuantities.receivedQuantity) {
      throw new HttpsError(
        'failed-precondition',
        `La cantidad recibida no puede disminuir para el producto "${previousItem.name || previousItem.id || index}".`,
      );
    }

    const receivedNowQuantity = clampNonNegative(
      nextQuantities.receivedQuantity - previousQuantities.receivedQuantity,
    );
    if (receivedNowQuantity > 0) {
      receiptReplenishments.push({
        ...safeNextItem,
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
      (
        Array.isArray(safeNextItem.selectedBackOrders)
          ? safeNextItem.selectedBackOrders
          : []
      ).forEach((backOrder) => {
        const id = toCleanString(backOrder?.id);
        if (id) completedBackOrderIds.add(id);
      });
    }
  });

  return {
    nextReplenishments: previous.map((previousItem, index) => {
      const item = next[index];
      if (!item) return previousItem;
      const previousQuantities = resolvePurchaseLineQuantities(previousItem);
      const nextQuantities = resolvePurchaseLineQuantities({
        ...item,
        orderedQuantity: previousQuantities.orderedQuantity,
        purchaseQuantity: previousQuantities.orderedQuantity,
        quantity: previousQuantities.orderedQuantity,
      });
      return {
        ...previousItem,
        receivedQuantity: nextQuantities.receivedQuantity,
        pendingQuantity: nextQuantities.pendingQuantity,
        orderedQuantity: previousQuantities.orderedQuantity,
      };
    }),
    receiptReplenishments,
    completedBackOrderIds: Array.from(completedBackOrderIds),
  };
};

const toReceiptInventoryStatus = (state) =>
  toCleanString(asRecord(state).status)?.toLowerCase() ?? '';

const isReceiptInventoryResumable = (state) =>
  RESUMABLE_RECEIPT_INVENTORY_STATUSES.has(toReceiptInventoryStatus(state));

const sanitizeFirestoreIdPart = (value) => {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized.slice(0, 180) || 'part';
};

const buildReceiptMovementId = ({ groupKey, operationId, purchaseId }) =>
  [
    'purchaseReceipt',
    sanitizeFirestoreIdPart(purchaseId),
    sanitizeFirestoreIdPart(operationId),
    sanitizeFirestoreIdPart(groupKey),
  ].join('_');

const buildReceiptInventoryState = ({
  completedBackOrderIds,
  nextReplenishments,
  operationId,
  receiptReplenishments,
  status,
  warehouseId,
  workflowStatusAfter,
  extra = {},
}) => ({
  status,
  operationId,
  warehouseId,
  receiptReplenishments,
  nextReplenishments,
  completedBackOrderIds,
  workflowStatusAfter,
  updatedAt: FieldValue.serverTimestamp(),
  ...extra,
});

const resolveResumableReceiptInventoryClaim = (storedPurchase) => {
  const state = asRecord(storedPurchase.receiptInventoryState);
  if (!isReceiptInventoryResumable(state)) return null;

  const operationId = toCleanString(state.operationId);
  const receiptReplenishments = Array.isArray(state.receiptReplenishments)
    ? state.receiptReplenishments
    : null;
  const nextReplenishments = Array.isArray(state.nextReplenishments)
    ? state.nextReplenishments
    : null;
  if (!operationId || !receiptReplenishments || !nextReplenishments) {
    throw new HttpsError(
      'failed-precondition',
      'La compra tiene una recepción de inventario pendiente sin datos suficientes para reintentar.',
    );
  }

  const completedBackOrderIds = Array.isArray(state.completedBackOrderIds)
    ? state.completedBackOrderIds.map(toCleanString).filter(Boolean)
    : [];
  const workflowStatus =
    normalizeWorkflowStatusValue(state.workflowStatusAfter) ??
    resolvePurchaseWorkflowStatus({
      ...storedPurchase,
      replenishments: nextReplenishments,
    });

  return {
    operationId,
    receiptChanges: {
      nextReplenishments,
      receiptReplenishments,
      completedBackOrderIds,
    },
    workflowStatus,
  };
};

const resolveProviderId = (purchase) => {
  const providerId = toCleanString(purchase?.providerId);
  if (providerId) return providerId;
  if (typeof purchase?.provider === 'string') return toCleanString(purchase.provider);
  return toCleanString(asRecord(purchase?.provider).id);
};

const resolveLineUnitCost = (items) =>
  resolveFiniteNumber(
    ...items.flatMap((item) => {
      const pricing = asRecord(item?.pricing);
      const cost = asRecord(item?.cost);
      return [
        item?.unitCost,
        item?.baseCost,
        item?.cost,
        pricing.cost,
        cost.unit,
      ];
    }),
  );

const buildCostSnapshot = (unitCost) => {
  const rounded = roundToTwoDecimals(unitCost);
  if (!rounded || rounded <= 0) return {};
  return {
    unitCost: rounded,
    cost: rounded,
    pricing: { cost: rounded },
  };
};

const resolvePurchaseBatchGroups = (purchase) => {
  const groups = new Map();
  for (const replenishment of Array.isArray(purchase.replenishments)
    ? purchase.replenishments
    : []) {
    const productId = toCleanString(replenishment?.id) ||
      toCleanString(replenishment?.productId);
    if (!productId) continue;
    const expirationMillis = toMillis(replenishment.expirationDate);
    const expirationKey =
      typeof expirationMillis === 'number' && Number.isFinite(expirationMillis)
        ? String(expirationMillis)
        : 'no-expiration';
    const key = `${productId}_${expirationKey}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        productId,
        productName: toCleanString(replenishment.name) || 'Producto sin nombre',
        expirationDate: replenishment.expirationDate ?? null,
        items: [],
      });
    }
    groups.get(key).items.push(replenishment);
  }
  return Array.from(groups.values());
};

const normalizeLocationPath = (warehouseId) => toCleanString(warehouseId) || '';

const getWarehouseById = async ({ businessId, warehouseId }) => {
  const normalizedWarehouseId = toCleanString(warehouseId);
  if (!normalizedWarehouseId) return null;
  const snap = await db.doc(`businesses/${businessId}/warehouses/${normalizedWarehouseId}`).get();
  return snap.exists ? { id: snap.id, ...asRecord(snap.data()) } : null;
};

const resolveDestinationWarehouse = async ({ businessId, uid, warehouseId }) => {
  const selected = await getWarehouseById({ businessId, warehouseId });
  if (selected?.id) return selected;
  return getDefaultWarehouse({ businessID: businessId, uid });
};

const buildReceiptHistoryEvent = ({
  receiptReplenishments,
  userId,
  warehouse,
  workflowStatusAfter,
}) => ({
  id: nanoid(),
  receivedAt: FieldValue.serverTimestamp(),
  warehouseId: warehouse.id,
  warehouseName:
    toCleanString(warehouse.name) || toCleanString(warehouse.shortName) || null,
  receivedBy: {
    uid: userId,
  },
  workflowStatusAfter,
  items: receiptReplenishments,
  summary: {
    lineCount: receiptReplenishments.length,
    receivedQuantity: receiptReplenishments.reduce(
      (sum, item) => sum + (safeNumber(item.quantity) ?? 0),
      0,
    ),
  },
});

const applyPurchaseReceiptInventory = async ({
  businessId,
  completedBackOrderIds,
  operationId,
  purchase,
  uid,
  warehouse,
}) => {
  const batch = db.batch();
  let writeCount = 0;
  const groups = resolvePurchaseBatchGroups(purchase);

  for (const group of groups) {
    const totalStock = group.items.reduce(
      (sum, item) => sum + (safeNumber(item.quantity ?? item.purchaseQuantity) ?? 0),
      0,
    );
    if (totalStock <= 0) continue;

    const expirationMillis = toMillis(group.expirationDate) ?? 0;
    const batchNumber = `${purchase.id}_${group.productId}_${expirationMillis}`;
    const movementId = buildReceiptMovementId({
      groupKey: group.key,
      operationId,
      purchaseId: purchase.id,
    });
    const movementRef = db.doc(`businesses/${businessId}/movements/${movementId}`);
    const movementSnap = await movementRef.get();
    if (movementSnap.exists) {
      continue;
    }

    const productRef = db.doc(`businesses/${businessId}/products/${group.productId}`);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        `Producto ${group.productId} no encontrado durante la compra ${purchase.id}`,
      );
    }

    const providerId = resolveProviderId(purchase);
    const existingBatchSnap = await db
      .collection(`businesses/${businessId}/batches`)
      .where('productId', '==', group.productId)
      .where('purchaseId', '==', purchase.id)
      .where('batchNumber', '==', batchNumber)
      .limit(1)
      .get();
    const existingBatchDoc = existingBatchSnap.docs.find(
      (docSnap) => docSnap.data()?.isDeleted !== true,
    );
    const batchRef = existingBatchDoc
      ? existingBatchDoc.ref
      : db.collection(`businesses/${businessId}/batches`).doc();
    const existingBatch = existingBatchDoc?.data() || null;
    const batchNumberId =
      existingBatch?.numberId ??
      (await getNextID({ businessID: businessId }, 'batches'));
    const expirationTimestamp = toAdminTimestampOrNull(group.expirationDate);
    const expirationDate = expirationTimestamp
      ? expirationTimestamp.toDate()
      : null;
    const shortDate = expirationDate
      ? expirationDate.toISOString().split('T')[0]
      : 'sin-fecha';
    const unitCost = resolveLineUnitCost(group.items);
    const costSnapshot = buildCostSnapshot(unitCost);
    const productData = productSnap.data() || {};

    batch.update(productRef, {
      stock: FieldValue.increment(totalStock),
      status: productData.status === 'inactive' ? 'active' : productData.status ?? 'active',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });
    writeCount += 1;

    if (existingBatchDoc) {
      batch.set(
        batchRef,
        {
          shortName: existingBatch.shortName || `${group.productName}_${shortDate}`,
          providerId,
          status: 'active',
          quantity: FieldValue.increment(totalStock),
          initialQuantity: FieldValue.increment(totalStock),
          receivedDate: FieldValue.serverTimestamp(),
          purchaseId: purchase.id,
          ...costSnapshot,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true },
      );
    } else {
      batch.set(batchRef, {
        id: batchRef.id,
        productId: group.productId,
        purchaseId: purchase.id,
        numberId: batchNumberId,
        shortName: `${group.productName}_${shortDate}`,
        batchNumber,
        providerId,
        status: 'active',
        quantity: totalStock,
        initialQuantity: totalStock,
        receivedDate: FieldValue.serverTimestamp(),
        expirationDate: expirationTimestamp,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
        ...costSnapshot,
      });
    }
    writeCount += 1;

    const location = normalizeLocationPath(warehouse.id);
    const existingStockSnap = await db
      .collection(`businesses/${businessId}/productsStock`)
      .where('batchId', '==', batchRef.id)
      .where('location', '==', location)
      .where('isDeleted', '==', false)
      .limit(1)
      .get();
    const existingStockDoc = existingStockSnap.docs.find(
      (docSnap) => docSnap.data()?.isDeleted !== true,
    );
    const stockRef = existingStockDoc
      ? existingStockDoc.ref
      : db.collection(`businesses/${businessId}/productsStock`).doc();
    if (existingStockDoc) {
      batch.set(
        stockRef,
        {
          batchNumberId,
          productName: group.productName,
          quantity: FieldValue.increment(totalStock),
          stock: FieldValue.increment(totalStock),
          initialQuantity: FieldValue.increment(totalStock),
          status: 'active',
          expirationDate: expirationTimestamp,
          ...costSnapshot,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true },
      );
    } else {
      batch.set(stockRef, {
        id: stockRef.id,
        batchId: batchRef.id,
        batchNumberId,
        location,
        productId: group.productId,
        productName: group.productName,
        quantity: totalStock,
        stock: totalStock,
        status: 'active',
        initialQuantity: totalStock,
        expirationDate: expirationTimestamp,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
        ...costSnapshot,
      });
    }
    writeCount += 1;

    batch.set(movementRef, {
      id: movementId,
      batchId: batchRef.id,
      batchNumberId,
      destinationLocation: warehouse.id,
      sourceLocation: null,
      productId: group.productId,
      productName: group.productName,
      quantity: totalStock,
      movementType: MovementType.Entry,
      movementReason: MovementReason.Purchase,
      receiptInventoryOperationId: operationId,
      purchaseId: purchase.id,
      unitCost: costSnapshot.unitCost ?? null,
      totalCost: costSnapshot.unitCost
        ? roundToTwoDecimals(costSnapshot.unitCost * totalStock)
        : null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });
    writeCount += 1;
  }

  for (const backOrderId of completedBackOrderIds) {
    batch.set(
      db.doc(`businesses/${businessId}/backOrders/${backOrderId}`),
      {
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
        completedBy: uid,
        completedWithPurchaseId: purchase.id,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
        pendingQuantity: 0,
      },
      { merge: true },
    );
    writeCount += 1;
  }

  if (writeCount > 0) {
    await batch.commit();
  }

  return { writeCount, groupCount: groups.length };
};

const claimReceiptOperation = async ({
  accountingRolloutEnabled,
  accountingSettings,
  businessId,
  purchase,
  purchaseRef,
  storedPurchase,
  uid,
  warehouse,
}) => {
  const operationId = nanoid();

  return db.runTransaction(async (transaction) => {
    const currentSnap = await transaction.get(purchaseRef);
    if (!currentSnap.exists) {
      throw new HttpsError('not-found', 'Compra no encontrada');
    }
    const currentPurchase = currentSnap.data() || {};
    if (isReceiptInventoryResumable(currentPurchase.receiptInventoryState)) {
      throw new HttpsError(
        'failed-precondition',
        'Esta compra ya tiene una recepción de inventario en proceso.',
      );
    }
    if (!canCompletePurchase(currentPurchase)) {
      throw new HttpsError(
        'failed-precondition',
        'Solo se pueden registrar recepciones sobre compras pendientes o parciales.',
      );
    }

    const receiptChanges = resolvePurchaseReceiptChanges(
      currentPurchase.replenishments,
      purchase.replenishments,
    );
    if (receiptChanges.receiptReplenishments.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'Debes registrar al menos una cantidad recibida para continuar.',
      );
    }

    const workflowStatus = resolvePurchaseWorkflowStatus({
      ...purchase,
      replenishments: receiptChanges.nextReplenishments,
    });
    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: resolvePurchaseCompletionEffectiveDate({
        ...purchase,
        workflowStatus,
      }),
      settings: accountingSettings,
      rolloutEnabled: accountingRolloutEnabled,
      operationLabel: 'completar esta compra',
      createError: (message) => new HttpsError('failed-precondition', message),
    });

    transaction.set(
      purchaseRef,
      {
        receiptInventoryState: buildReceiptInventoryState({
          completedBackOrderIds: receiptChanges.completedBackOrderIds,
          nextReplenishments: receiptChanges.nextReplenishments,
          operationId,
          receiptReplenishments: receiptChanges.receiptReplenishments,
          status: 'pending',
          warehouseId: warehouse.id,
          workflowStatusAfter: workflowStatus,
          extra: {
            startedAt: FieldValue.serverTimestamp(),
          },
        }),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true },
    );

    return {
      operationId,
      receiptChanges,
      storedPurchase,
      workflowStatus,
    };
  });
};

const finalizeReceiptOperation = async ({
  attachments,
  monetary,
  operationId,
  paymentState,
  paymentTerms,
  purchase,
  purchaseRef,
  receiptChanges,
  uid,
  warehouse,
  workflowStatus,
}) => {
  const appliedState = buildReceiptInventoryState({
    completedBackOrderIds: receiptChanges.completedBackOrderIds,
    nextReplenishments: receiptChanges.nextReplenishments,
    operationId,
    receiptReplenishments: receiptChanges.receiptReplenishments,
    status: 'applied',
    warehouseId: warehouse.id,
    workflowStatusAfter: workflowStatus,
    extra: {
      appliedAt: FieldValue.serverTimestamp(),
    },
  });
  let completedAt = null;
  if (workflowStatus === 'completed') {
    completedAt = purchase.completedAt
      ? (toAdminTimestampOrNull(purchase.completedAt) ?? FieldValue.serverTimestamp())
      : FieldValue.serverTimestamp();
  }

  const receiptEvent = buildReceiptHistoryEvent({
    receiptReplenishments: receiptChanges.receiptReplenishments,
    userId: uid,
    warehouse,
    workflowStatusAfter: workflowStatus,
  });

  const updatedData = {
    ...purchase,
    id: purchase.id,
    status: resolveLegacyPurchaseStatus(workflowStatus),
    workflowStatus,
    replenishments: receiptChanges.nextReplenishments,
    destinationWarehouseId: warehouse.id,
    attachmentUrls: attachments,
    completedAt,
    deliveryAt:
      toAdminTimestampOrNull(purchase.deliveryAt) ??
      toAdminTimestampOrNull(asRecord(purchase.dates).deliveryDate) ??
      null,
    paymentAt:
      toAdminTimestampOrNull(purchase.paymentAt) ??
      toAdminTimestampOrNull(asRecord(purchase.dates).paymentDate) ??
      null,
    paymentTerms: paymentTerms ?? purchase.paymentTerms ?? null,
    paymentState: paymentState ?? purchase.paymentState ?? null,
    monetary: monetary ?? purchase.monetary ?? null,
    receiptHistory: [
      ...(Array.isArray(purchase.receiptHistory) ? purchase.receiptHistory : []),
      receiptEvent,
    ],
    receiptInventoryState: appliedState,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  };

  await db.runTransaction(async (transaction) => {
    const purchaseSnap = await transaction.get(purchaseRef);
    if (!purchaseSnap.exists) {
      throw new HttpsError('not-found', 'Compra no encontrada');
    }
    const state = asRecord(purchaseSnap.data()?.receiptInventoryState);
    const status = toReceiptInventoryStatus(state);
    if (status === 'applied' && state.operationId === operationId) return;
    if (
      state.operationId !== operationId ||
      !RESUMABLE_RECEIPT_INVENTORY_STATUSES.has(status)
    ) {
      throw new HttpsError(
        'failed-precondition',
        'No se pudo cerrar la recepción porque el estado de inventario cambió.',
      );
    }
    transaction.set(purchaseRef, updatedData, { merge: true });
  });

  return {
    updatedData,
    appliedState,
  };
};

const markReceiptOperationFailed = async ({ error, operationId, purchaseRef }) => {
  await db.runTransaction(async (transaction) => {
    const purchaseSnap = await transaction.get(purchaseRef);
    if (!purchaseSnap.exists) return;
    const state = asRecord(purchaseSnap.data()?.receiptInventoryState);
    if (state.operationId !== operationId) return;
    if (toReceiptInventoryStatus(state) === 'applied') return;
    transaction.set(
      purchaseRef,
      {
        receiptInventoryState: {
          ...state,
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Error aplicando inventario',
          failedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
  });
};

export const completePurchaseReceiptHandler = async (request) => {
  const payload = asRecord(request.data);
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    toCleanString(request.auth?.token?.businessId) ||
    toCleanString(request.auth?.token?.businessID);
  const rawPurchaseInput = asRecord(payload.purchase);
  const purchaseId =
    toCleanString(payload.purchaseId) || toCleanString(rawPurchaseInput.id);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!purchaseId) {
    throw new HttpsError('invalid-argument', 'purchaseId es requerido.');
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.MAINTENANCE,
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    requiredModule: 'inventory',
  });

  const purchaseRef = db.doc(`businesses/${businessId}/purchases/${purchaseId}`);
  const storedPurchaseSnap = await purchaseRef.get();
  if (!storedPurchaseSnap.exists) {
    throw new HttpsError('not-found', 'Compra no encontrada');
  }

  const storedPurchase = {
    id: purchaseId,
    ...asRecord(storedPurchaseSnap.data()),
  };
  const warehouse = await resolveDestinationWarehouse({
    businessId,
    uid: authUid,
    warehouseId: payload.warehouseId,
  });
  if (!warehouse?.id) {
    throw new HttpsError(
      'failed-precondition',
      'No se encontró un almacén válido para completar la compra.',
    );
  }

  const purchase = {
    ...storedPurchase,
    ...sanitizeReceiptPurchaseInput(rawPurchaseInput),
    id: purchaseId,
  };
  const accountingSettings = await getPilotAccountingSettingsForBusiness(businessId);
  const accountingRolloutEnabled = isAccountingRolloutEnabledForBusiness(
    businessId,
    accountingSettings,
  );
  const resumableClaim = resolveResumableReceiptInventoryClaim(storedPurchase);
  const claim =
    resumableClaim ??
    (await claimReceiptOperation({
      accountingRolloutEnabled,
      accountingSettings,
      businessId,
      purchase,
      purchaseRef,
      storedPurchase,
      uid: authUid,
      warehouse,
    }));

  try {
    const inventoryResult = await applyPurchaseReceiptInventory({
      businessId,
      completedBackOrderIds: claim.receiptChanges.completedBackOrderIds,
      operationId: claim.operationId,
      purchase: {
        ...purchase,
        replenishments: claim.receiptChanges.receiptReplenishments,
      },
      uid: authUid,
      warehouse,
    });
    const financialPurchase = {
      ...purchase,
      replenishments: claim.receiptChanges.nextReplenishments,
    };
    const paymentTerms = resolveReceiptPaymentTerms(financialPurchase);
    const paymentState = await resolveReceiptPaymentState({
      businessId,
      paymentTerms,
      purchaseId,
      purchaseRecord: {
        ...financialPurchase,
        paymentTerms,
      },
    });

    const { updatedData, appliedState } = await finalizeReceiptOperation({
      attachments: Array.isArray(payload.attachmentUrls)
        ? payload.attachmentUrls
        : purchase.attachmentUrls ?? [],
      monetary: purchase.monetary ?? null,
      operationId: claim.operationId,
      paymentState,
      paymentTerms,
      purchase: {
        ...purchase,
        receiptHistory: claim.storedPurchase?.receiptHistory ?? storedPurchase.receiptHistory,
      },
      purchaseRef,
      receiptChanges: claim.receiptChanges,
      uid: authUid,
      warehouse,
      workflowStatus: claim.workflowStatus,
    });

    return {
      ok: true,
      businessId,
      purchaseId,
      destinationWarehouseId: warehouse.id,
      receiptInventoryState: appliedState,
      workflowStatus: updatedData.workflowStatus,
      status: updatedData.status,
      purchase: updatedData,
      inventory: inventoryResult,
    };
  } catch (error) {
    await markReceiptOperationFailed({
      error,
      operationId: claim.operationId,
      purchaseRef,
    }).catch((stateError) => {
      logger.error('[completePurchaseReceipt] failed to persist failure state', {
        businessId,
        purchaseId,
        error: stateError?.message || String(stateError),
      });
    });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      'internal',
      error?.message || 'Error completando recepción de compra.',
    );
  }
};

export const completePurchaseReceipt = onCall(
  {
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
    timeoutSeconds: 540,
  },
  completePurchaseReceiptHandler,
);
