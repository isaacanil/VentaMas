/**
 * Audit purchase/CxP rollout readiness for a single business.
 *
 * Usage:
 *   cd functions
 *   node .\scripts\data-audit\purchase-rollout-readiness.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=BUSINESS_ID
 *
 * Optional:
 *   --outDir=C:\some\folder
 *   --outDirBase=C:\base\folder
 *   --sampleLimit=25
 *   --write=1 --fixPaidNextPaymentAt=1
 *   --write=1 --fixSettledPaymentTermsNextPaymentAt=1
 *   --write=1 --fixBaseCurrencyRateType=1
 *   --write=1 --normalizeLegacyPurchaseEnvelope=1
 *   --write=1 --backfillDerivedPaymentTerms=1
 *   --write=1 --backfillDerivedPaymentState=1
 *   --write=1 --backfillCompletedImmediateCashPaymentState=1
 *   --write=1 --backfillCanceledLegacyTerminalState=1
 *   --write=1 --fixInvalidImmediateCashPaymentDates=1
 *   --write=1 --fixAccountsPayableBaseCurrencyRateType=1
 *   --write=1 --fixSupplierPaymentCashMovementRefs=1
 *
 * Notes:
 * - Readonly by default.
 * - The optional write path only applies narrowly scoped purchase cleanup fixes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

import {
  buildPurchaseRolloutMarkdown,
  inspectPurchaseRolloutReadiness,
} from './purchaseRolloutReadiness.shared.mjs';

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .map((raw) => raw.split('='))
      .map(([k, v]) => [k.replace(/^--/, ''), v ?? '']),
  );

  const readBool = (key) => args[key] === '1' || args[key] === 'true';
  const readNum = (key, fallback) => {
    if (!args[key]) return fallback;
    const parsed = Number(args[key]);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  return {
    keyPath: args.keyPath || '',
    projectId: args.projectId || '',
    businessId: args.businessId || '',
    outDir: args.outDir || '',
    outDirBase: args.outDirBase || '',
    sampleLimit: readNum('sampleLimit', 25),
    write: readBool('write'),
    fixPaidNextPaymentAt: readBool('fixPaidNextPaymentAt'),
    fixSettledPaymentTermsNextPaymentAt: readBool(
      'fixSettledPaymentTermsNextPaymentAt',
    ),
    fixBaseCurrencyRateType: readBool('fixBaseCurrencyRateType'),
    normalizeLegacyPurchaseEnvelope: readBool('normalizeLegacyPurchaseEnvelope'),
    backfillDerivedPaymentTerms: readBool('backfillDerivedPaymentTerms'),
    backfillDerivedPaymentState: readBool('backfillDerivedPaymentState'),
    backfillCompletedImmediateCashPaymentState: readBool(
      'backfillCompletedImmediateCashPaymentState',
    ),
    backfillCanceledLegacyTerminalState: readBool(
      'backfillCanceledLegacyTerminalState',
    ),
    fixInvalidImmediateCashPaymentDates: readBool(
      'fixInvalidImmediateCashPaymentDates',
    ),
    fixAccountsPayableBaseCurrencyRateType: readBool(
      'fixAccountsPayableBaseCurrencyRateType',
    ),
    fixSupplierPaymentCashMovementRefs: readBool(
      'fixSupplierPaymentCashMovementRefs',
    ),
  };
};

const ensureDir = (targetPath) => fs.mkdirSync(targetPath, { recursive: true });

const writeJson = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
};

const writeText = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, 'utf8');
};

const resolveRepoRoot = () => {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDir, '..', '..', '..');
};

const isoStamp = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    '-' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
};

const loadBusinessData = async (businessRef) => {
  const [
    purchasesSnap,
    accountsPayableSnap,
    accountingSettingsSnap,
    bankAccountsSnap,
    supplierPaymentCashMovementsSnap,
  ] = await Promise.all([
    businessRef.collection('purchases').get(),
    businessRef.collection('accountsPayablePayments').get(),
    businessRef.collection('settings').doc('accounting').get(),
    businessRef.collection('bankAccounts').get(),
    businessRef
      .collection('cashMovements')
      .where('sourceType', '==', 'supplier_payment')
      .get(),
  ]);

  return {
    purchases: purchasesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    accountsPayablePayments: accountsPayableSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
    accountingSettings: accountingSettingsSnap.exists
      ? accountingSettingsSnap.data()
      : null,
    bankAccounts: bankAccountsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
    cashMovements: supplierPaymentCashMovementsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
  };
};

const run = async () => {
  const args = parseArgs();

  if (!args.keyPath) {
    throw new Error('Debes enviar --keyPath=...');
  }
  if (!args.businessId) {
    throw new Error('Debes enviar --businessId=...');
  }

  const serviceAccount = JSON.parse(fs.readFileSync(args.keyPath, 'utf8'));
  const projectId = args.projectId || serviceAccount.project_id;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });

  const repoRoot = resolveRepoRoot();
  const timestamp = isoStamp();
  const outputDir = args.outDir
    ? path.resolve(args.outDir)
    : args.outDirBase
      ? path.resolve(args.outDirBase, timestamp, 'analysis')
      : path.resolve(
          repoRoot,
          '.tmp',
          'data-audit',
          args.businessId,
          timestamp,
          'analysis',
        );

  const db = admin.firestore();
  const businessRef = db.collection('businesses').doc(args.businessId);
  const initialData = await loadBusinessData(businessRef);
  const initialInspection = inspectPurchaseRolloutReadiness({
    businessId: args.businessId,
    ...initialData,
    sampleLimit: args.sampleLimit,
  });
  const analysisBeforeWrite = initialInspection.analysis;
  const {
    settledWithPaymentStateNextPaymentAt,
    settledWithPaymentTermsNextPaymentAt,
    baseCurrencyRateTypeMismatch,
    baseCurrencyRateTypeMismatchPayments,
    derivedPaymentTermsBackfillCandidates,
    derivedPaymentStateBackfillCandidates,
    legacyEnvelopePromotionCandidates,
    completedImmediateCashBackfillCandidates,
    canceledLegacyTerminalStateCandidates,
    invalidImmediateCashPaymentDateCandidates,
    supplierPaymentMovementRepairCandidates,
  } = initialInspection.findings;

  const purchaseUpdateTargets = new Map();
  const accountsPayableUpdateTargets = new Map();
  const cashMovementUpdateTargets = new Map();
  const ensureTarget = (targetMap, id) => {
    if (!targetMap.has(id)) {
      targetMap.set(id, {});
    }
    return targetMap.get(id);
  };

  const normalizeLegacyPurchaseEnvelopeTargets =
    args.normalizeLegacyPurchaseEnvelope ? legacyEnvelopePromotionCandidates : [];
  for (const target of normalizeLegacyPurchaseEnvelopeTargets) {
    Object.assign(ensureTarget(purchaseUpdateTargets, target.id), target.updates);
  }

  const backfillDerivedPaymentTermsTargets = args.backfillDerivedPaymentTerms
    ? derivedPaymentTermsBackfillCandidates
    : [];
  for (const target of backfillDerivedPaymentTermsTargets) {
    ensureTarget(purchaseUpdateTargets, target.id).paymentTerms =
      target.paymentTerms;
  }

  const backfillDerivedPaymentStateTargets = args.backfillDerivedPaymentState
    ? derivedPaymentStateBackfillCandidates
    : [];
  for (const target of backfillDerivedPaymentStateTargets) {
    ensureTarget(purchaseUpdateTargets, target.id).paymentState =
      target.paymentState;
  }

  const fixPaidNextPaymentAtTargets = args.fixPaidNextPaymentAt
    ? settledWithPaymentStateNextPaymentAt
    : [];
  for (const target of fixPaidNextPaymentAtTargets) {
    ensureTarget(purchaseUpdateTargets, target.id)['paymentState.nextPaymentAt'] =
      null;
  }

  const fixSettledPaymentTermsNextPaymentAtTargets =
    args.fixSettledPaymentTermsNextPaymentAt
      ? settledWithPaymentTermsNextPaymentAt
      : [];
  for (const target of fixSettledPaymentTermsNextPaymentAtTargets) {
    ensureTarget(purchaseUpdateTargets, target.id)['paymentTerms.nextPaymentAt'] =
      null;
  }

  const fixBaseCurrencyRateTypeTargets = args.fixBaseCurrencyRateType
    ? baseCurrencyRateTypeMismatch
    : [];
  for (const target of fixBaseCurrencyRateTypeTargets) {
    ensureTarget(
      purchaseUpdateTargets,
      target.id,
    )['monetary.exchangeRateSnapshot.rateType'] = 'buy';
  }

  const backfillCompletedImmediateCashPaymentStateTargets =
    args.backfillCompletedImmediateCashPaymentState
      ? completedImmediateCashBackfillCandidates
      : [];
  for (const target of backfillCompletedImmediateCashPaymentStateTargets) {
    ensureTarget(purchaseUpdateTargets, target.id).paymentTerms = {
      condition: 'cash',
      expectedPaymentAt: target.effectivePaymentAt,
      scheduleType: 'immediate',
      isImmediate: true,
      nextPaymentAt: null,
    };
    ensureTarget(purchaseUpdateTargets, target.id).paymentState = {
      status: 'paid',
      total: target.resolvedTotal,
      paid: target.resolvedTotal,
      balance: 0,
      paymentCount: 1,
      lastPaymentAt: target.effectivePaymentAt,
      lastPaymentId: null,
      requiresReview: false,
      migratedFromLegacy: true,
      nextPaymentAt: null,
    };
  }

  const backfillCanceledLegacyTerminalStateTargets =
    args.backfillCanceledLegacyTerminalState
      ? canceledLegacyTerminalStateCandidates
      : [];
  for (const target of backfillCanceledLegacyTerminalStateTargets) {
    ensureTarget(purchaseUpdateTargets, target.id).paymentTerms = {
      condition: 'cash',
      expectedPaymentAt: null,
      scheduleType: 'immediate',
      isImmediate: true,
      nextPaymentAt: null,
    };
    ensureTarget(purchaseUpdateTargets, target.id).paymentState = {
      status: 'unknown_legacy',
      total: 0,
      paid: 0,
      balance: 0,
      paymentCount: 0,
      lastPaymentAt: null,
      lastPaymentId: null,
      requiresReview: true,
      migratedFromLegacy: true,
      nextPaymentAt: null,
    };
  }

  const fixInvalidImmediateCashPaymentDatesTargets =
    args.fixInvalidImmediateCashPaymentDates
      ? invalidImmediateCashPaymentDateCandidates
      : [];
  for (const target of fixInvalidImmediateCashPaymentDatesTargets) {
    ensureTarget(purchaseUpdateTargets, target.id).paymentAt = null;
    ensureTarget(
      purchaseUpdateTargets,
      target.id,
    )['paymentTerms.expectedPaymentAt'] = null;
    ensureTarget(purchaseUpdateTargets, target.id)['paymentTerms.nextPaymentAt'] =
      null;
    ensureTarget(purchaseUpdateTargets, target.id)['paymentState.nextPaymentAt'] =
      null;
  }

  const fixAccountsPayableBaseCurrencyRateTypeTargets =
    args.fixAccountsPayableBaseCurrencyRateType
      ? baseCurrencyRateTypeMismatchPayments
      : [];
  for (const target of fixAccountsPayableBaseCurrencyRateTypeTargets) {
    ensureTarget(
      accountsPayableUpdateTargets,
      target.id,
    )['exchangeRateSnapshot.rateType'] = 'buy';
  }

  const fixSupplierPaymentCashMovementRefsTargets =
    args.fixSupplierPaymentCashMovementRefs
      ? supplierPaymentMovementRepairCandidates
      : [];
  for (const target of fixSupplierPaymentCashMovementRefsTargets) {
    Object.assign(
      ensureTarget(cashMovementUpdateTargets, target.id),
      target.updates,
    );
  }

  let updatedCount = 0;
  const targetCount =
    purchaseUpdateTargets.size +
    accountsPayableUpdateTargets.size +
    cashMovementUpdateTargets.size;

  if (args.write && targetCount > 0) {
    let batch = db.batch();
    let batchOps = 0;

    const updateGroups = [
      { targetMap: purchaseUpdateTargets, collectionName: 'purchases' },
      {
        targetMap: accountsPayableUpdateTargets,
        collectionName: 'accountsPayablePayments',
      },
      { targetMap: cashMovementUpdateTargets, collectionName: 'cashMovements' },
    ];

    for (const { targetMap, collectionName } of updateGroups) {
      for (const [id, updates] of targetMap.entries()) {
        const docRef = businessRef.collection(collectionName).doc(id);
        batch.update(docRef, {
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'scripts:data-audit/purchase-rollout-readiness',
        });
        batchOps += 1;
        updatedCount += 1;

        if (batchOps >= 400) {
          // eslint-disable-next-line no-await-in-loop
          await batch.commit();
          batch = db.batch();
          batchOps = 0;
        }
      }
    }

    if (batchOps > 0) {
      await batch.commit();
    }
  }

  let finalInspection = initialInspection;
  if (args.write && updatedCount > 0) {
    const finalData = await loadBusinessData(businessRef);
    finalInspection = inspectPurchaseRolloutReadiness({
      businessId: args.businessId,
      ...finalData,
      sampleLimit: args.sampleLimit,
    });
  }

  const analysis = finalInspection.analysis;
  const writeSummary = {
    enabled:
      args.write &&
      (args.fixPaidNextPaymentAt ||
        args.fixSettledPaymentTermsNextPaymentAt ||
        args.fixBaseCurrencyRateType ||
        args.normalizeLegacyPurchaseEnvelope ||
        args.backfillDerivedPaymentTerms ||
        args.backfillDerivedPaymentState ||
        args.backfillCompletedImmediateCashPaymentState ||
        args.backfillCanceledLegacyTerminalState ||
        args.fixInvalidImmediateCashPaymentDates ||
        args.fixAccountsPayableBaseCurrencyRateType ||
        args.fixSupplierPaymentCashMovementRefs),
    reaudited: args.write && updatedCount > 0,
    targetCount,
    updatedCount,
    fixPaidNextPaymentAt: {
      targetCount: fixPaidNextPaymentAtTargets.length,
      updatedCount:
        args.write && args.fixPaidNextPaymentAt
          ? fixPaidNextPaymentAtTargets.length
          : 0,
    },
    fixSettledPaymentTermsNextPaymentAt: {
      targetCount: fixSettledPaymentTermsNextPaymentAtTargets.length,
      updatedCount:
        args.write && args.fixSettledPaymentTermsNextPaymentAt
          ? fixSettledPaymentTermsNextPaymentAtTargets.length
          : 0,
    },
    fixBaseCurrencyRateType: {
      targetCount: fixBaseCurrencyRateTypeTargets.length,
      updatedCount:
        args.write && args.fixBaseCurrencyRateType
          ? fixBaseCurrencyRateTypeTargets.length
          : 0,
    },
    normalizeLegacyPurchaseEnvelope: {
      targetCount: normalizeLegacyPurchaseEnvelopeTargets.length,
      updatedCount:
        args.write && args.normalizeLegacyPurchaseEnvelope
          ? normalizeLegacyPurchaseEnvelopeTargets.length
          : 0,
    },
    backfillDerivedPaymentTerms: {
      targetCount: backfillDerivedPaymentTermsTargets.length,
      updatedCount:
        args.write && args.backfillDerivedPaymentTerms
          ? backfillDerivedPaymentTermsTargets.length
          : 0,
    },
    backfillDerivedPaymentState: {
      targetCount: backfillDerivedPaymentStateTargets.length,
      updatedCount:
        args.write && args.backfillDerivedPaymentState
          ? backfillDerivedPaymentStateTargets.length
          : 0,
    },
    backfillCompletedImmediateCashPaymentState: {
      targetCount: backfillCompletedImmediateCashPaymentStateTargets.length,
      updatedCount:
        args.write && args.backfillCompletedImmediateCashPaymentState
          ? backfillCompletedImmediateCashPaymentStateTargets.length
          : 0,
    },
    backfillCanceledLegacyTerminalState: {
      targetCount: backfillCanceledLegacyTerminalStateTargets.length,
      updatedCount:
        args.write && args.backfillCanceledLegacyTerminalState
          ? backfillCanceledLegacyTerminalStateTargets.length
          : 0,
    },
    fixInvalidImmediateCashPaymentDates: {
      targetCount: fixInvalidImmediateCashPaymentDatesTargets.length,
      updatedCount:
        args.write && args.fixInvalidImmediateCashPaymentDates
          ? fixInvalidImmediateCashPaymentDatesTargets.length
          : 0,
    },
    fixAccountsPayableBaseCurrencyRateType: {
      targetCount: fixAccountsPayableBaseCurrencyRateTypeTargets.length,
      updatedCount:
        args.write && args.fixAccountsPayableBaseCurrencyRateType
          ? fixAccountsPayableBaseCurrencyRateTypeTargets.length
          : 0,
    },
    fixSupplierPaymentCashMovementRefs: {
      targetCount: fixSupplierPaymentCashMovementRefsTargets.length,
      updatedCount:
        args.write && args.fixSupplierPaymentCashMovementRefs
          ? fixSupplierPaymentCashMovementRefsTargets.length
          : 0,
    },
  };

  const jsonPath = path.resolve(outputDir, 'purchase-rollout-readiness.json');
  const mdPath = path.resolve(outputDir, 'purchase-rollout-readiness.md');

  writeJson(jsonPath, {
    analysisBeforeWrite,
    analysis,
    writeSummary,
  });
  writeText(
    mdPath,
    buildPurchaseRolloutMarkdown({
      businessId: args.businessId,
      analysis,
      outputDir,
      writeSummary,
      analysisBeforeWrite,
    }),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        businessId: args.businessId,
        jsonPath,
        mdPath,
        writeSummary,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
