import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import { buildPurchasePaymentState } from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
} from './vendorBill.shared.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwoDecimals = (value) =>
  Math.round((safeNumber(value) || 0) * 100) / 100;

const resolvePurchaseDocumentTotal = (purchaseRecord) => {
  const monetary = asRecord(purchaseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const totalFromPaymentState = safeNumber(purchaseRecord.paymentState?.total);
  const totalFromMonetary = safeNumber(
    documentTotals.total ?? documentTotals.gross,
  );
  const totalFallback =
    safeNumber(purchaseRecord.totalAmount) ??
    safeNumber(purchaseRecord.total) ??
    safeNumber(purchaseRecord.amount);

  return roundToTwoDecimals(
    totalFromPaymentState ?? totalFromMonetary ?? totalFallback ?? 0,
  );
};

export const syncVendorBillFromPurchase = onDocumentWritten(
  {
    document: 'businesses/{businessId}/purchases/{purchaseId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, purchaseId } = event.params;
    const normalizedPurchaseId = toCleanString(purchaseId);
    if (!normalizedPurchaseId) {
      return null;
    }

    const vendorBillId = buildCanonicalVendorBillIdFromPurchaseId(
      normalizedPurchaseId,
    );
    const vendorBillRef = db.doc(
      `businesses/${businessId}/vendorBills/${vendorBillId}`,
    );
    const afterPurchase = asRecord(event.data?.after?.data());

    if (!Object.keys(afterPurchase).length) {
      await vendorBillRef.delete().catch((error) => {
        logger.warn('Failed deleting vendorBill after purchase removal', {
          businessId,
          purchaseId: normalizedPurchaseId,
          vendorBillId,
          error: error?.message || String(error),
        });
      });
      return null;
    }

    const total = resolvePurchaseDocumentTotal(afterPurchase);
    const paymentState =
      afterPurchase.paymentState ??
      buildPurchasePaymentState({
        purchaseRecord: afterPurchase,
        total,
        paid: 0,
        paymentCount: 0,
        lastPaymentAt: null,
        lastPaymentId: null,
        nextPaymentAt:
          afterPurchase.paymentTerms?.nextPaymentAt ??
          afterPurchase.paymentTerms?.expectedPaymentAt ??
          null,
      });
    const paymentTerms = {
      ...asRecord(afterPurchase.paymentTerms),
    };

    const vendorBillProjection = buildVendorBillProjection({
      purchaseId: normalizedPurchaseId,
      purchaseRecord: afterPurchase,
      paymentState,
      paymentTerms,
      vendorBillId,
    });

    if (!vendorBillProjection) {
      await vendorBillRef.delete().catch(() => null);
      return null;
    }

    await vendorBillRef.set(vendorBillProjection, { merge: true });
    return null;
  },
);
