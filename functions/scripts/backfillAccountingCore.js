/*
  Script: backfillAccountingCore.js

  Purpose:
    Backfill mínimo para el go-live contable sin versionado:
    - asegura cuentas contables base faltantes;
    - migra perfiles default sembrados para separar ITBIS/retenciones;
    - materializa vendorBills canónicas desde purchases existentes.

  Usage:
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --business <businessId> --dry-run
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --business <businessId> --write
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --all-businesses --dry-run

    Por seguridad, solo se actualizan perfiles con metadata.seededBy == "default_posting_profiles".
    Para auditar perfiles antiguos que solo tienen metadata.seedKey:
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --business <businessId> --dry-run --include-seed-key-only
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

import { buildPurchasePaymentState } from '../src/app/modules/purchase/functions/payablePayments.shared.js';
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
  {
    code: '2210',
    name: 'Retenciones ITBIS por pagar',
    type: 'liability',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'withholding_itbis_payable',
    parentSystemKey: 'liabilities_root',
  },
  {
    code: '2220',
    name: 'Retenciones ISR por pagar',
    type: 'liability',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'withholding_isr_payable',
    parentSystemKey: 'liabilities_root',
  },
];

const PURCHASE_PROFILE_SPECS = [
  ['purchase_immediate_inventory_cash', 'inventory', 'cash'],
  ['purchase_immediate_inventory_bank', 'inventory', 'bank'],
  ['purchase_immediate_expense_cash', 'operating_expenses', 'cash'],
  ['purchase_immediate_expense_bank', 'operating_expenses', 'bank'],
  ['purchase_immediate_asset_cash', 'fixed_assets', 'cash'],
  ['purchase_immediate_asset_bank', 'fixed_assets', 'bank'],
  ['purchase_immediate_service_cash', 'operating_expenses', 'cash'],
  ['purchase_immediate_service_bank', 'operating_expenses', 'bank'],
  ['purchase_committed_inventory', 'inventory', 'accounts_payable'],
  ['purchase_committed_expense', 'operating_expenses', 'accounts_payable'],
  ['purchase_committed_asset', 'fixed_assets', 'accounts_payable'],
  ['purchase_committed_service', 'operating_expenses', 'accounts_payable'],
];

const EXPENSE_PROFILE_SPECS = [
  ['expense_cash', 'cash'],
  ['expense_bank', 'bank'],
  ['expense_payable', 'accounts_payable'],
];

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);

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

const buildAccountMaps = (accounts) => ({
  bySystemKey: new Map(
    accounts
      .map((account) => [toCleanString(account.systemKey), account])
      .filter(([systemKey]) => Boolean(systemKey)),
  ),
});

const buildPostingLine = ({
  accountsBySystemKey,
  accountSystemKey,
  amountSource,
  id,
  side,
}) => {
  const account = accountsBySystemKey.get(accountSystemKey) ?? null;
  if (!account) {
    return null;
  }

  return {
    id,
    side,
    accountId: account.id,
    accountCode: toCleanString(account.code),
    accountName: toCleanString(account.name),
    accountSystemKey,
    amountSource,
    omitIfZero: true,
    metadata: {},
  };
};

const buildPurchaseFiscalLines = ({
  accountsBySystemKey,
  creditSystemKey,
  debitSystemKey,
  seedKey,
}) => [
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: debitSystemKey,
    amountSource: 'purchase_subtotal',
    id: `${seedKey}__purchase_subtotal`,
    side: 'debit',
  }),
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: 'tax_receivable',
    amountSource: 'purchase_tax',
    id: `${seedKey}__purchase_tax`,
    side: 'debit',
  }),
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: creditSystemKey,
    amountSource: 'purchase_net_payable',
    id: `${seedKey}__purchase_net_payable`,
    side: 'credit',
  }),
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: 'withholding_itbis_payable',
    amountSource: 'purchase_withholding_itbis',
    id: `${seedKey}__purchase_withholding_itbis`,
    side: 'credit',
  }),
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: 'withholding_isr_payable',
    amountSource: 'purchase_withholding_isr',
    id: `${seedKey}__purchase_withholding_isr`,
    side: 'credit',
  }),
];

const buildExpenseFiscalLines = ({
  accountsBySystemKey,
  creditSystemKey,
  seedKey,
}) => [
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: 'operating_expenses',
    amountSource: 'expense_subtotal',
    id: `${seedKey}__expense_subtotal`,
    side: 'debit',
  }),
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: 'tax_receivable',
    amountSource: 'expense_tax',
    id: `${seedKey}__expense_tax`,
    side: 'debit',
  }),
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: creditSystemKey,
    amountSource: 'expense_net_payable',
    id: `${seedKey}__expense_net_payable`,
    side: 'credit',
  }),
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: 'withholding_itbis_payable',
    amountSource: 'expense_withholding_itbis',
    id: `${seedKey}__expense_withholding_itbis`,
    side: 'credit',
  }),
  buildPostingLine({
    accountsBySystemKey,
    accountSystemKey: 'withholding_isr_payable',
    amountSource: 'expense_withholding_isr',
    id: `${seedKey}__expense_withholding_isr`,
    side: 'credit',
  }),
];

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

const ensureChartOfAccounts = async (db, businessId, { dryRun }) => {
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
    return { planned: 0, created: 0 };
  }

  if (dryRun) {
    return { planned: writes.length, created: 0 };
  }

  const batch = db.batch();
  writes.forEach(({ ref, payload }) =>
    batch.set(ref, payload, { merge: true }),
  );
  await batch.commit();
  return { planned: writes.length, created: writes.length };
};

const loadChartOfAccounts = async (db, businessId) => {
  const accountsSnap = await db
    .collection(`businesses/${businessId}/chartOfAccounts`)
    .get();
  return accountsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...asRecord(docSnap.data()),
  }));
};

const buildFiscalProfileLinesBySeedKey = (accounts) => {
  const { bySystemKey: accountsBySystemKey } = buildAccountMaps(accounts);
  const entries = [];

  PURCHASE_PROFILE_SPECS.forEach(
    ([seedKey, debitSystemKey, creditSystemKey]) => {
      entries.push([
        seedKey,
        buildPurchaseFiscalLines({
          accountsBySystemKey,
          creditSystemKey,
          debitSystemKey,
          seedKey,
        }),
      ]);
    },
  );

  EXPENSE_PROFILE_SPECS.forEach(([seedKey, creditSystemKey]) => {
    entries.push([
      seedKey,
      buildExpenseFiscalLines({
        accountsBySystemKey,
        creditSystemKey,
        seedKey,
      }),
    ]);
  });

  return new Map(entries);
};

const normalizeLineForComparison = (line) => ({
  accountId: toCleanString(line.accountId),
  accountSystemKey: toCleanString(line.accountSystemKey),
  amountSource: toCleanString(line.amountSource),
  side: toCleanString(line.side),
});

const linesMatchTemplate = (currentLines, nextLines) =>
  JSON.stringify(
    (Array.isArray(currentLines) ? currentLines : []).map(
      normalizeLineForComparison,
    ),
  ) === JSON.stringify(nextLines.map(normalizeLineForComparison));

const migrateDefaultPostingProfiles = async (
  db,
  businessId,
  { dryRun, includeSeedKeyOnly },
) => {
  const [accounts, profilesSnap] = await Promise.all([
    loadChartOfAccounts(db, businessId),
    db.collection(`businesses/${businessId}/accountingPostingProfiles`).get(),
  ]);
  const linesBySeedKey = buildFiscalProfileLinesBySeedKey(accounts);
  let planned = 0;
  let updated = 0;
  let alreadyCurrent = 0;
  let skippedSeedKeyOnly = 0;
  let skippedMissingAccounts = 0;

  for (const profileSnap of profilesSnap.docs) {
    const profile = asRecord(profileSnap.data());
    const metadata = asRecord(profile.metadata);
    const seedKey = toCleanString(metadata.seedKey);
    const nextLines = seedKey ? (linesBySeedKey.get(seedKey) ?? null) : null;
    if (!nextLines) {
      continue;
    }

    const isDefaultSeeded = metadata.seededBy === 'default_posting_profiles';
    if (!isDefaultSeeded && !includeSeedKeyOnly) {
      skippedSeedKeyOnly += 1;
      continue;
    }

    if (nextLines.some((line) => !line)) {
      skippedMissingAccounts += 1;
      continue;
    }

    if (linesMatchTemplate(profile.linesTemplate, nextLines)) {
      alreadyCurrent += 1;
      continue;
    }

    planned += 1;
    if (!dryRun) {
      await profileSnap.ref.set(
        {
          linesTemplate: nextLines,
          metadata: {
            ...metadata,
            backfilledFiscalSourcesBy: 'backfillAccountingCore',
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'script:backfillAccountingCore',
        },
        { merge: true },
      );
      updated += 1;
    }
  }

  return {
    planned,
    updated,
    alreadyCurrent,
    skippedSeedKeyOnly,
    skippedMissingAccounts,
  };
};

const syncVendorBillsFromPurchases = async (db, businessId, { dryRun }) => {
  const purchasesSnap = await db
    .collection(`businesses/${businessId}/purchases`)
    .get();
  let plannedMaterialized = 0;
  let materialized = 0;
  let plannedDeleted = 0;
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
      plannedDeleted += 1;
      if (!dryRun) {
        await vendorBillRef.delete().catch(() => null);
        deleted += 1;
      }
      continue;
    }

    plannedMaterialized += 1;
    if (!dryRun) {
      await vendorBillRef.set(vendorBillProjection, { merge: true });
      materialized += 1;
    }
  }

  return { plannedMaterialized, materialized, plannedDeleted, deleted };
};

const main = async () => {
  const serviceAccountPath =
    getFlagValue('--service-account') ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    null;
  const targetBusinessId = getFlagValue('--business');
  const dryRun = !hasFlag('--write') || hasFlag('--dry-run');
  const allBusinesses = hasFlag('--all-businesses');
  const includeSeedKeyOnly = hasFlag('--include-seed-key-only');

  if (!serviceAccountPath) {
    throw new Error(
      'Debe indicar --service-account o GOOGLE_APPLICATION_CREDENTIALS.',
    );
  }

  if (!targetBusinessId && !allBusinesses) {
    throw new Error(
      'Debe indicar --business <businessId> o --all-businesses. Dry-run por defecto; agregue --write para escribir.',
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
        docs: [await db.doc(`businesses/${targetBusinessId}`).get()].filter(
          (snapshot) => snapshot.exists,
        ),
      }
    : await db.collection('businesses').get();

  console.log(
    JSON.stringify({
      mode: dryRun ? 'dry-run' : 'write',
      target: targetBusinessId ?? 'all-businesses',
    }),
  );

  for (const businessSnap of businessesSnap.docs) {
    const businessId = businessSnap.id;
    const accounts = await ensureChartOfAccounts(db, businessId, { dryRun });
    const postingProfiles = await migrateDefaultPostingProfiles(
      db,
      businessId,
      {
        dryRun,
        includeSeedKeyOnly,
      },
    );
    const vendorBills = await syncVendorBillsFromPurchases(db, businessId, {
      dryRun,
    });

    console.log(
      JSON.stringify({
        businessId,
        plannedChartAccounts: accounts.planned,
        createdChartAccounts: accounts.created,
        plannedPostingProfiles: postingProfiles.planned,
        updatedPostingProfiles: postingProfiles.updated,
        currentPostingProfiles: postingProfiles.alreadyCurrent,
        skippedSeedKeyOnlyPostingProfiles: postingProfiles.skippedSeedKeyOnly,
        skippedMissingAccountPostingProfiles:
          postingProfiles.skippedMissingAccounts,
        plannedVendorBills: vendorBills.plannedMaterialized,
        materializedVendorBills: vendorBills.materialized,
        plannedDeletedVendorBills: vendorBills.plannedDeleted,
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
