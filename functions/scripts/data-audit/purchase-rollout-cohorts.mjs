/**
 * Read-only cohort audit for purchase/CxP rollout across businesses with purchases.
 *
 * Usage:
 *   cd C:\Dev\VentaMas\functions
 *   node .\scripts\data-audit\purchase-rollout-cohorts.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json
 *
 * Optional:
 *   --businessIds=ID1,ID2
 *   --limit=25
 *   --sampleLimit=5
 *   --outDir=C:\some\folder
 *   --outDirBase=C:\base\folder
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

import {
  buildMigrationRiskScore,
  inspectPurchaseRolloutReadiness,
} from './purchaseRolloutReadiness.shared.mjs';

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .map((raw) => raw.split('='))
      .map(([k, v]) => [k.replace(/^--/, ''), v ?? '']),
  );

  const readNum = (key, fallback) => {
    if (!args[key]) return fallback;
    const parsed = Number(args[key]);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  return {
    keyPath: args.keyPath || '',
    projectId: args.projectId || '',
    businessIds: (args.businessIds || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    limit: readNum('limit', 25),
    sampleLimit: readNum('sampleLimit', 5),
    outDir: args.outDir || '',
    outDirBase: args.outDirBase || '',
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

const discoverBusinessIdsWithPurchases = async (db) => {
  const purchasesGroup = await db.collectionGroup('purchases').get();
  const counts = new Map();

  for (const doc of purchasesGroup.docs) {
    const businessRef = doc.ref.parent.parent;
    const businessId = businessRef?.id;
    if (!businessId) continue;
    counts.set(businessId, (counts.get(businessId) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([businessId]) => businessId);
};

const loadBusinessData = async (db, businessId) => {
  const businessRef = db.collection('businesses').doc(businessId);
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

const classifyTier = (analysis) => {
  const purchases = analysis.purchases.total;
  const invalidPaymentAt = analysis.purchases.invalidPaymentAt.count;
  if (purchases <= 20 && invalidPaymentAt === 0) return 'light';
  if (purchases <= 80 && invalidPaymentAt <= 5) return 'medium';
  return 'heavy';
};

const buildSuggestedActions = (analysis) => {
  const actions = [];
  const bankAccountsRequired =
    analysis.accountingSettings.bankAccountsRequired === true;

  if (!analysis.accountingSettings.exists) {
    actions.push(
      'crear settings/accounting y decidir si el negocio saldra cash-only o con pagos bancarios',
    );
  }
  if (bankAccountsRequired && analysis.bankAccounts.activeCount === 0) {
    actions.push('crear al menos una bankAccount activa');
  }
  if (
    analysis.purchases.missingPaymentTerms.count > 0 ||
    analysis.purchases.missingPaymentStateOperational.count > 0
  ) {
    actions.push(
      'correr backfill aditivo de paymentTerms/paymentState para compras legacy',
    );
  }
  if (analysis.purchases.invalidPaymentAt.count > 0) {
    actions.push('limpiar paymentAt invalidos antes de abrir el negocio');
  }
  if (analysis.purchases.baseCurrencyRateTypeMismatch.count > 0) {
    actions.push('corregir rateType base-currency a buy en compras legacy');
  }
  if (analysis.accountsPayable.baseCurrencyRateTypeMismatch.count > 0) {
    actions.push('corregir rateType base-currency a buy en accountsPayablePayments');
  }
  if (analysis.cashMovements.supplierPayment.repairCandidates.count > 0) {
    actions.push('reparar refs faltantes en supplier_payment cashMovements');
  }
  if (
    analysis.accountsPayable.total > 0 &&
    analysis.cashMovements.supplierPayment.postedPaymentsMissingMovement.count > 0
  ) {
    actions.push(
      'validar o backfillear supplier_payment en cashMovements para pagos CxP ya existentes',
    );
  }
  if (!actions.length) {
    actions.push('negocio listo para smoke test de rollout');
  }

  return actions;
};

const formatList = (items) =>
  items.length ? items.map((item) => `- ${item}`).join('\n') : '- none';

const buildMarkdown = ({ outputDir, rows, summary }) =>
  `# Purchase Rollout Cohorts\n\n` +
  `- Output dir: ${outputDir}\n` +
  `- Businesses scanned: ${summary.businessesScanned}\n` +
  `- Businesses with purchases: ${summary.businessesWithPurchases}\n` +
  `- Ready businesses: ${rows.filter((row) => row.ready).length}\n` +
  `- Blocked businesses: ${rows.filter((row) => !row.ready).length}\n\n` +
  `## Summary\n` +
  `- With accounting settings: ${summary.withAccountingSettings}\n` +
  `- With active bankAccounts: ${summary.withActiveBankAccounts}\n` +
  `- With accountsPayablePayments: ${summary.withAccountsPayablePayments}\n` +
  `- With supplier_payment cashMovements: ${summary.withSupplierPaymentCashMovements}\n` +
  `- With invalid paymentAt: ${summary.withInvalidPaymentAt}\n\n` +
  `## Suggested order\n` +
  rows
    .map(
      (row, index) =>
        `${index + 1}. ${row.businessId} | ready=${row.ready} | tier=${row.tier} | risk=${row.riskScore} | purchases=${row.purchases} | blockers=${row.blockers.length}`,
    )
    .join('\n') +
  '\n\n' +
  `## Per-business details\n` +
  rows
    .map(
      (row) =>
        `### ${row.businessId}\n` +
        `- Ready: ${row.ready}\n` +
        `- Tier: ${row.tier}\n` +
        `- Risk score: ${row.riskScore}\n` +
        `- Banking mode: ${row.bankingMode}\n` +
        `- Bank accounts required: ${row.bankAccountsRequired}\n` +
        `- Purchases: ${row.purchases}\n` +
        `- Active bankAccounts: ${row.activeBankAccounts}\n` +
        `- AccountsPayablePayments: ${row.accountsPayablePayments}\n` +
        `- supplier_payment cashMovements: ${row.supplierPaymentCashMovements}\n` +
        `- Blockers:\n${formatList(row.blockers)}\n` +
        `- Warnings:\n${formatList(row.warnings)}\n` +
        `- Suggested actions:\n${formatList(row.suggestedActions)}\n`,
    )
    .join('\n');

const run = async () => {
  const args = parseArgs();

  if (!args.keyPath) {
    throw new Error('Debes enviar --keyPath=...');
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
          'purchase-rollout-cohorts',
          timestamp,
          'analysis',
        );

  const db = admin.firestore();
  const businessIds = args.businessIds.length
    ? args.businessIds
    : await discoverBusinessIdsWithPurchases(db);
  const scopedBusinessIds =
    args.limit > 0 ? businessIds.slice(0, args.limit) : businessIds;

  const rows = [];
  const analyses = {};

  for (const businessId of scopedBusinessIds) {
    const businessData = await loadBusinessData(db, businessId);
    const inspection = inspectPurchaseRolloutReadiness({
      businessId,
      ...businessData,
      sampleLimit: args.sampleLimit,
    });
    const { analysis } = inspection;

    analyses[businessId] = analysis;
    rows.push({
      businessId,
      ready: analysis.readiness.isReady,
      tier: classifyTier(analysis),
      riskScore: buildMigrationRiskScore(analysis),
      bankingMode: analysis.accountingSettings.bankingMode,
      bankAccountsRequired: analysis.accountingSettings.bankAccountsRequired,
      purchases: analysis.purchases.total,
      activeBankAccounts: analysis.bankAccounts.activeCount,
      accountsPayablePayments: analysis.accountsPayable.total,
      supplierPaymentCashMovements: analysis.cashMovements.supplierPayment.total,
      blockers: analysis.readiness.blockers,
      warnings: analysis.readiness.warnings,
      suggestedActions: buildSuggestedActions(analysis),
    });
  }

  rows.sort((a, b) => a.riskScore - b.riskScore || a.purchases - b.purchases);

  const summary = {
    businessesScanned: rows.length,
    businessesWithPurchases: rows.filter((row) => row.purchases > 0).length,
    withAccountingSettings: rows.filter(
      (row) => analyses[row.businessId].accountingSettings.exists,
    ).length,
    withActiveBankAccounts: rows.filter((row) => row.activeBankAccounts > 0)
      .length,
    withAccountsPayablePayments: rows.filter(
      (row) => row.accountsPayablePayments > 0,
    ).length,
    withSupplierPaymentCashMovements: rows.filter(
      (row) => row.supplierPaymentCashMovements > 0,
    ).length,
    withInvalidPaymentAt: rows.filter(
      (row) => analyses[row.businessId].purchases.invalidPaymentAt.count > 0,
    ).length,
  };

  const jsonPath = path.resolve(outputDir, 'purchase-rollout-cohorts.json');
  const mdPath = path.resolve(outputDir, 'purchase-rollout-cohorts.md');

  writeJson(jsonPath, { summary, rows, analyses });
  writeText(mdPath, buildMarkdown({ outputDir, rows, summary }));

  console.log(
    JSON.stringify(
      {
        ok: true,
        jsonPath,
        mdPath,
        summary,
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
