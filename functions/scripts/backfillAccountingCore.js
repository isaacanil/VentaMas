/*
  Script: backfillAccountingCore.js

  Purpose:
    Backfill mínimo para el go-live contable sin versionado:
    - asegura cuentas contables base faltantes;
    - materializa vendorBills canónicas desde purchases existentes.

  Usage:
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --business <businessId>
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

import {
  buildPurchasePaymentState,
} from '../src/app/modules/purchase/functions/payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
} from '../src/app/modules/purchase/functions/vendorBill.shared.js';

const REQUIRED_CHART_OF_ACCOUNTS = [
  {
    code: '1135',
    name: 'Activos fijos',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'fixed_assets',
    parentSystemKey: 'assets_root',
  },
  {
    code: '1138',
    name: 'Gastos pagados por anticipado',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'prepaid_expenses',
    parentSystemKey: 'assets_root',
  },
];

const args = process.argv.slice(2);

const getFlagValue = (flag) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
};

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

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  return admin.credential.cert(
    JSON.parse(fs.readFileSync(absolutePath, 'utf8')),
  );
};

const ensureChartOfAccounts = async (db, businessId) => {
  const accountsSnap = await db
    .collection(`businesses/${businessId}/chartOfAccounts`)
    .get();
  const accounts = accountsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...asRecord(docSnap.data()),
  }));
  const accountsBySystemKey = new Map(
    accounts
      .map((account) => [toCleanString(account.systemKey), account])
      .filter(([systemKey]) => Boolean(systemKey)),
  );

  const writes = [];
  for (const template of REQUIRED_CHART_OF_ACCOUNTS) {
    if (accountsBySystemKey.has(template.systemKey)) {
      continue;
    }

    const parentId =
      accountsBySystemKey.get(template.parentSystemKey)?.id ?? null;
    const ref = db.collection(`businesses/${businessId}/chartOfAccounts`).doc();
    writes.push({
      ref,
      payload: {
        id: ref.id,
        businessId,
        code: template.code,
        name: template.name,
        type: template.type,
        postingAllowed: template.postingAllowed,
        status: 'active',
        normalSide: template.normalSide,
        currencyMode: template.currencyMode,
        systemKey: template.systemKey,
        parentId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'script:backfillAccountingCore',
        updatedBy: 'script:backfillAccountingCore',
        metadata: {
          backfilledBy: 'backfillAccountingCore',
        },
      },
    });
  }

  if (!writes.length) {
    return { created: 0 };
  }

  const batch = db.batch();
  writes.forEach(({ ref, payload }) => batch.set(ref, payload, { merge: true }));
  await batch.commit();
  return { created: writes.length };
};

const syncVendorBillsFromPurchases = async (db, businessId) => {
  const purchasesSnap = await db.collection(`businesses/${businessId}/purchases`).get();
  let materialized = 0;
  let deleted = 0;

  for (const purchaseSnap of purchasesSnap.docs) {
    const purchaseId = toCleanString(purchaseSnap.id);
    if (!purchaseId) {
      continue;
    }

    const purchaseRecord = asRecord(purchaseSnap.data());
    const total = resolvePurchaseDocumentTotal(purchaseRecord);
    const paymentTerms = {
      ...asRecord(purchaseRecord.paymentTerms),
    };
    const paymentState =
      purchaseRecord.paymentState ??
      buildPurchasePaymentState({
        purchaseRecord,
        total,
        paid: 0,
        paymentCount: 0,
        lastPaymentAt: null,
        lastPaymentId: null,
        nextPaymentAt:
          paymentTerms.nextPaymentAt ?? paymentTerms.expectedPaymentAt ?? null,
      });
    const vendorBillId = buildCanonicalVendorBillIdFromPurchaseId(purchaseId);
    const vendorBillProjection = buildVendorBillProjection({
      purchaseId,
      purchaseRecord,
      paymentState,
      paymentTerms,
      vendorBillId,
    });
    const vendorBillRef = db.doc(
      `businesses/${businessId}/vendorBills/${vendorBillId}`,
    );

    if (!vendorBillProjection) {
      await vendorBillRef.delete().catch(() => null);
      deleted += 1;
      continue;
    }

    await vendorBillRef.set(vendorBillProjection, { merge: true });
    materialized += 1;
  }

  return { materialized, deleted };
};

const main = async () => {
  const serviceAccountPath =
    getFlagValue('--service-account') ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    null;
  const targetBusinessId = getFlagValue('--business');

  if (!serviceAccountPath) {
    throw new Error(
      'Debe indicar --service-account o GOOGLE_APPLICATION_CREDENTIALS.',
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: loadServiceAccountCredential(serviceAccountPath),
    });
  }

  const db = admin.firestore();
  const businessesSnap = targetBusinessId
    ? {
        docs: [
          await db.doc(`businesses/${targetBusinessId}`).get(),
        ].filter((snapshot) => snapshot.exists),
      }
    : await db.collection('businesses').get();

  for (const businessSnap of businessesSnap.docs) {
    const businessId = businessSnap.id;
    const accounts = await ensureChartOfAccounts(db, businessId);
    const vendorBills = await syncVendorBillsFromPurchases(db, businessId);

    console.log(
      JSON.stringify({
        businessId,
        createdChartAccounts: accounts.created,
        materializedVendorBills: vendorBills.materialized,
        deletedVendorBills: vendorBills.deleted,
      }),
    );
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[backfillAccountingCore] Failed:', error);
    process.exit(1);
  });
