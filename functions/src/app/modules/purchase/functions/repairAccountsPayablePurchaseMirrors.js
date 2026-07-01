import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldPath, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import {
  asRecord,
  toCleanString,
} from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildPurchaseAccountsPayableMirror,
  buildVendorBillProjection,
  hasSensitivePurchaseAccountsPayableDetails,
  preserveVendorBillControlDetails,
} from './vendorBill.shared.js';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const MAX_TARGET_IDS = 200;
const SAMPLE_LIMIT = 25;

const clampLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
};

const normalizeTargetIds = (value) => {
  if (value == null) return null;
  if (!Array.isArray(value)) {
    throw new HttpsError(
      'invalid-argument',
      'purchaseIds debe enviarse como una lista.',
    );
  }

  const ids = [...new Set(value.map(toCleanString).filter(Boolean))];
  if (ids.length > MAX_TARGET_IDS) {
    throw new HttpsError(
      'invalid-argument',
      `No se pueden reparar mas de ${MAX_TARGET_IDS} compras por ejecucion.`,
    );
  }

  return ids;
};

const mapDoc = (docSnap) => ({
  id: docSnap.id,
  ref: docSnap.ref,
  data: asRecord(docSnap.data()),
});

const LEGACY_ALIAS_PATHS = [
  ['payables'],
  ['vendorBill'],
  ['data', 'accountsPayable'],
  ['data', 'payables'],
  ['data', 'vendorBill'],
  ['purchase', 'accountsPayable'],
  ['purchase', 'payables'],
  ['purchase', 'vendorBill'],
];

const readPath = (record, path) =>
  path.reduce((current, segment) => asRecord(current)[segment], record);

const fetchPurchaseDocs = async ({
  businessId,
  limit,
  purchaseIds,
  startAfterId,
}) => {
  if (purchaseIds) {
    const snapshots = await Promise.all(
      purchaseIds.map((purchaseId) =>
        db.doc(`businesses/${businessId}/purchases/${purchaseId}`).get(),
      ),
    );
    return {
      docs: snapshots.filter((snap) => snap.exists).map(mapDoc),
      nextStartAfterId: null,
    };
  }

  let query = db
    .collection(`businesses/${businessId}/purchases`)
    .orderBy(FieldPath.documentId())
    .limit(limit);
  if (startAfterId) {
    query = query.startAfter(startAfterId);
  }

  const snap = await query.get();
  const lastDoc = snap.docs.at(-1);
  return {
    docs: snap.docs.map(mapDoc),
    nextStartAfterId: snap.docs.length === limit ? lastDoc?.id ?? null : null,
  };
};

const detectSensitiveLegacyAliases = (purchaseRecord) =>
  LEGACY_ALIAS_PATHS.filter((path) =>
    hasSensitivePurchaseAccountsPayableDetails(readPath(purchaseRecord, path)),
  ).map((path) => path.join('.'));

const resolvePaymentStateForProjection = ({ purchaseRecord, vendorBillRecord }) =>
  purchaseRecord.paymentState ?? vendorBillRecord.paymentState ?? null;

const resolvePaymentTermsForProjection = ({ purchaseRecord, vendorBillRecord }) =>
  purchaseRecord.paymentTerms ?? vendorBillRecord.paymentTerms ?? null;

const addSample = (samples, entry) => {
  if (samples.length < SAMPLE_LIMIT) {
    samples.push(entry);
  }
};

export const repairAccountsPayablePurchaseMirrors = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_ADMIN,
  });

  const dryRun = payload.dryRun !== false;
  const limit = clampLimit(payload.limit);
  const startAfterId = toCleanString(payload.startAfterId);
  const purchaseIds = normalizeTargetIds(payload.purchaseIds);
  const now = Timestamp.now();
  const { docs, nextStartAfterId } = await fetchPurchaseDocs({
    businessId,
    limit,
    purchaseIds,
    startAfterId,
  });

  const summary = {
    ok: true,
    dryRun,
    businessId,
    scanned: docs.length,
    sensitiveMirrors: 0,
    patchedPurchases: 0,
    protectedVendorBills: 0,
    skipped: 0,
    nextStartAfterId,
    samples: [],
    findings: [],
  };
  const batch = dryRun ? null : db.batch();

  for (const purchaseDoc of docs) {
    const purchaseRecord = purchaseDoc.data;
    const accountsPayable = asRecord(purchaseRecord.accountsPayable);
    const sensitiveMirror =
      hasSensitivePurchaseAccountsPayableDetails(accountsPayable);
    const legacySensitiveAliases = detectSensitiveLegacyAliases(purchaseRecord);

    if (legacySensitiveAliases.length) {
      summary.findings.push({
        purchaseId: purchaseDoc.id,
        type: 'legacy_sensitive_alias',
        fields: legacySensitiveAliases,
      });
    }

    if (!sensitiveMirror) {
      continue;
    }

    summary.sensitiveMirrors += 1;
    const vendorBillId = buildCanonicalVendorBillIdFromPurchaseId(purchaseDoc.id);
    const vendorBillRef = db.doc(
      `businesses/${businessId}/vendorBills/${vendorBillId}`,
    );
    const vendorBillSnap = await vendorBillRef.get();
    const vendorBillRecord = vendorBillSnap.exists
      ? asRecord(vendorBillSnap.data())
      : {};
    const vendorBillProjection = buildVendorBillProjection({
      purchaseId: purchaseDoc.id,
      purchaseRecord,
      paymentState: resolvePaymentStateForProjection({
        purchaseRecord,
        vendorBillRecord,
      }),
      paymentTerms: resolvePaymentTermsForProjection({
        purchaseRecord,
        vendorBillRecord,
      }),
      vendorBillId,
    });

    if (!vendorBillProjection) {
      summary.skipped += 1;
      summary.findings.push({
        purchaseId: purchaseDoc.id,
        type: 'manual_review',
        reason: 'vendor_bill_projection_unavailable',
      });
      continue;
    }

    const protectedVendorBill = preserveVendorBillControlDetails({
      existingVendorBill: vendorBillRecord,
      vendorBillProjection,
    });
    const sanitizedMirror = buildPurchaseAccountsPayableMirror(accountsPayable);
    addSample(summary.samples, {
      purchaseId: purchaseDoc.id,
      vendorBillId,
      legacySensitiveAliases,
    });

    if (!dryRun) {
      batch.set(vendorBillRef, protectedVendorBill, { merge: true });
      batch.set(
        purchaseDoc.ref,
        {
          accountsPayable: {
            ...sanitizedMirror,
            mirrorSanitizedAt: now,
            mirrorSanitizedBy: authUid,
            mirrorSanitizedSource: 'repairAccountsPayablePurchaseMirrors',
          },
        },
        { merge: true },
      );
    }

    summary.patchedPurchases += dryRun ? 0 : 1;
    summary.protectedVendorBills += dryRun ? 0 : 1;
  }

  if (!dryRun && summary.patchedPurchases > 0) {
    await batch.commit();
  }

  return summary;
});
