import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import {
  asRecord,
  buildPurchasePaymentState,
  resolvePurchaseDocumentTotal,
  toCleanString,
} from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
} from './vendorBill.shared.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

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
