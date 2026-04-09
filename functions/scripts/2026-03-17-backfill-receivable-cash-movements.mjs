/**
 * Backfill additive and idempotent `cashMovements` for legacy AR payments.
 *
 * Safe defaults:
 * - dry-run by default
 * - deterministic movement ids
 * - additive writes only into `businesses/{businessId}/cashMovements`
 * - no mutation of existing AR, receipts or cashCounts
 *
 * Usage (PowerShell):
 *   cd C:\Dev\VentaMas\functions
 *   node .\scripts\2026-03-17-backfill-receivable-cash-movements.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P --dryRun=1
 *
 *   node .\scripts\2026-03-17-backfill-receivable-cash-movements.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P --write
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

import {
  buildReceivablePaymentCashMovements,
} from '../src/app/versions/v2/accounting/utils/cashMovement.util.js';

const SCRIPT_VERSION = '2026-03-17-backfill-receivable-cash-movements-v1';
const WRITE_BATCH_LIMIT = 400;

const parseArgs = () => {
  const rawArgs = process.argv.slice(2);
  const args = Object.fromEntries(
    rawArgs
      .map((raw) => raw.split('='))
      .map(([k, v]) => [k.replace(/^--/, ''), v ?? '']),
  );
  const hasFlag = (flag) => rawArgs.includes(flag);
  const readBool = (key) =>
    args[key] === '1' ||
    args[key] === 'true' ||
    hasFlag(`--${key}`);

  return {
    keyPath: args.keyPath || '',
    projectId: args.projectId || '',
    businessId: args.businessId || '',
    paymentId: args.paymentId || '',
    limit: args.limit ? Number(args.limit) : null,
    dryRun: !readBool('write') && args.dryRun !== '0',
    write: readBool('write'),
  };
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toTimestampMillis = (value) => {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number' ?
        value.seconds :
        typeof value._seconds === 'number' ?
          value._seconds :
          null;
    if (seconds != null) {
      return seconds * 1000;
    }
  }
  return null;
};

const uniqueStrings = (values) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => toCleanString(value))
        .filter(Boolean),
    ),
  );

const loadServiceAccount = (keyPath) =>
  JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const chunk = (items, size) => {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const getPaymentMethods = (payment) => {
  const methods = Array.isArray(payment?.paymentMethods) ?
    payment.paymentMethods :
    Array.isArray(payment?.paymentMethod) ?
      payment.paymentMethod :
      [];

  return methods.filter((method) => safeNumber(method?.value ?? method?.amount) > 0);
};

const collectPayments = async ({ db, businessId, paymentId, limit }) => {
  if (paymentId) {
    const docSnap = await db
      .doc(`businesses/${businessId}/accountsReceivablePayments/${paymentId}`)
      .get();
    return docSnap.exists ?
      [{...docSnap.data(), id: toCleanString(docSnap.data()?.id) || docSnap.id}] :
      [];
  }

  let query = db
    .collection(`businesses/${businessId}/accountsReceivablePayments`)
    .orderBy('createdAt', 'asc');

  if (Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }

  try {
    const snap = await query.get();
    return snap.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: toCleanString(docSnap.data()?.id) || docSnap.id,
    }));
  } catch {
    const fallbackQuery = Number.isFinite(limit) && limit > 0 ?
      db
        .collection(`businesses/${businessId}/accountsReceivablePayments`)
        .limit(limit) :
      db.collection(`businesses/${businessId}/accountsReceivablePayments`);
    const snap = await fallbackQuery.get();
    return snap.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: toCleanString(docSnap.data()?.id) || docSnap.id,
    }));
  }
};

const buildInstallmentLinkMap = async ({ db, businessId }) => {
  const snapshot = await db
    .collection(`businesses/${businessId}/accountsReceivableInstallmentPayments`)
    .get();
  const links = new Map();

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const paymentId = toCleanString(data.paymentId);
    const arId = toCleanString(data.arId);
    if (!paymentId || !arId) return;

    const current = links.get(paymentId) || {
      paymentId,
      arIds: new Set(),
      installmentIds: new Set(),
    };

    current.arIds.add(arId);
    const installmentId = toCleanString(data.installmentId);
    if (installmentId) {
      current.installmentIds.add(installmentId);
    }
    links.set(paymentId, current);
  });

  return links;
};

const buildReceiptLinkMap = async ({ db, businessId }) => {
  const snapshot = await db
    .collection(`businesses/${businessId}/accountsReceivablePaymentReceipt`)
    .get();
  const links = new Map();

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const paymentId = toCleanString(data.paymentId ?? data?.payment?.id);
    if (!paymentId) return;

    const accountEntries = Array.isArray(data.accounts) ?
      data.accounts :
      data.account ? [data.account] : [];

    links.set(paymentId, {
      paymentId,
      receiptId: docSnap.id,
      clientId: toCleanString(data.clientId ?? data?.client?.id),
      arIds: uniqueStrings(
        accountEntries.map((entry) => entry?.arId ?? entry?.id),
      ),
      invoiceIds: uniqueStrings(
        accountEntries.map((entry) => entry?.invoiceId),
      ),
    });
  });

  return links;
};

const buildCashCountLinkMap = async ({ db, businessId }) => {
  const snapshot = await db.collection(`businesses/${businessId}/cashCounts`).get();
  const links = new Map();

  snapshot.docs.forEach((docSnap) => {
    const cashCount = asRecord(docSnap.data()?.cashCount);
    const receivablePayments = Array.isArray(cashCount.receivablePayments) ?
      cashCount.receivablePayments :
      [];
    receivablePayments.forEach((entry) => {
      const paymentId = toCleanString(entry?.paymentId);
      if (paymentId && !links.has(paymentId)) {
        links.set(paymentId, docSnap.id);
      }
    });
  });

  return links;
};

const loadAccountsMap = async ({ db, businessId, accountIds }) => {
  const uniqueIds = uniqueStrings(accountIds);
  if (!uniqueIds.length) return new Map();

  const refs = uniqueIds.map((accountId) =>
    db.doc(`businesses/${businessId}/accountsReceivable/${accountId}`),
  );

  const docs = [];
  for (const refsChunk of chunk(refs, 200)) {
    const loaded = await db.getAll(...refsChunk);
    docs.push(...loaded);
  }

  const result = new Map();
  docs.forEach((docSnap) => {
    if (!docSnap.exists) return;
    result.set(docSnap.id, {id: docSnap.id, ...docSnap.data()});
  });
  return result;
};

const buildResolutionContext = ({
  payment,
  installmentLinks,
  receiptLinks,
  cashCountLinks,
  accountsMap,
}) => {
  const paymentId = toCleanString(payment.id);
  const paymentLink = paymentId ? installmentLinks.get(paymentId) : null;
  const receiptLink = paymentId ? receiptLinks.get(paymentId) : null;
  const cashCountId = paymentId ? cashCountLinks.get(paymentId) || null : null;

  const accountIds = uniqueStrings([
    ...(paymentLink ? Array.from(paymentLink.arIds) : []),
    payment.arId,
    ...(receiptLink?.arIds || []),
  ]);

  const accountEntries = accountIds.map((accountId) => {
    const account = accountsMap.get(accountId) || {};
    return {
      arId: accountId,
      accountType: toCleanString(account.type) || null,
      invoiceId: toCleanString(
        account.invoiceId ??
          account.preorderId ??
          account?.invoice?.id ??
          null,
      ),
      clientId: toCleanString(account.clientId),
    };
  });

  const resolvedClientId =
    toCleanString(payment.clientId) ||
    toCleanString(receiptLink?.clientId) ||
    (() => {
      const clientIds = uniqueStrings(
        accountEntries.map((entry) => entry.clientId),
      );
      return clientIds.length === 1 ? clientIds[0] : null;
    })();

  const resolutionSources = uniqueStrings([
    payment.arId || payment.clientId ? 'paymentDoc' : null,
    paymentLink ? 'installmentPayments' : null,
    receiptLink ? 'receipt' : null,
    cashCountId ? 'cashCountEmbedding' : null,
  ]);

  const unresolvedReview = uniqueStrings([
    accountEntries.length ? null : 'accountLink',
    resolvedClientId ? null : 'clientId',
  ]);

  return {
    cashCountId,
    clientId: resolvedClientId,
    accountEntries,
    resolutionSources,
    unresolvedReview,
    receiptId: receiptLink?.receiptId || null,
  };
};

const withMigrationMetadata = ({
  movement,
  payment,
  resolution,
  dryRun,
}) => ({
  ...movement,
  metadata: {
    ...(asRecord(movement.metadata)),
    migration: {
      version: SCRIPT_VERSION,
      sourceCollection: 'accountsReceivablePayments',
      paymentCreatedAt: toTimestampMillis(payment.createdAt ?? payment.date),
      resolutionSources: resolution.resolutionSources,
      unresolvedReview: resolution.unresolvedReview,
      cashCountLinked: Boolean(resolution.cashCountId),
      receiptId: resolution.receiptId,
      dryRun,
      migratedAt: new Date().toISOString(),
    },
    requiresReview: resolution.unresolvedReview.length > 0,
  },
});

const run = async () => {
  const {
    keyPath,
    projectId,
    businessId,
    paymentId,
    limit,
    dryRun,
    write,
  } = parseArgs();

  if (!businessId) {
    throw new Error('Missing --businessId=BUSINESS_ID');
  }
  if (!keyPath) {
    throw new Error('Missing --keyPath=C:\\path\\service-account.json');
  }

  const serviceAccount = loadServiceAccount(keyPath);

  if (!admin.apps.length) {
    const resolvedProjectId = projectId || serviceAccount.project_id || undefined;
    if (resolvedProjectId && !process.env.GOOGLE_CLOUD_PROJECT) {
      process.env.GOOGLE_CLOUD_PROJECT = resolvedProjectId;
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: resolvedProjectId,
    });
  }

  const db = admin.firestore();
  const payments = await collectPayments({db, businessId, paymentId, limit});

  const [installmentLinks, receiptLinks, cashCountLinks] = await Promise.all([
    buildInstallmentLinkMap({db, businessId}),
    buildReceiptLinkMap({db, businessId}),
    buildCashCountLinkMap({db, businessId}),
  ]);

  const allAccountIds = uniqueStrings(
    payments.flatMap((payment) => {
      const paymentKey = toCleanString(payment.id);
      const paymentLink = paymentKey ? installmentLinks.get(paymentKey) : null;
      const receiptLink = paymentKey ? receiptLinks.get(paymentKey) : null;
      return [
        ...(paymentLink ? Array.from(paymentLink.arIds) : []),
        payment.arId,
        ...(receiptLink?.arIds || []),
      ];
    }),
  );
  const accountsMap = await loadAccountsMap({db, businessId, accountIds: allAccountIds});

  const movementRefs = [];
  const writePayloads = [];
  const summary = {
    businessId,
    mode: dryRun || !write ? 'dry-run' : 'write',
    scannedPayments: payments.length,
    resolvedByInstallmentPayments: 0,
    resolvedByPaymentDoc: 0,
    resolvedByReceipt: 0,
    linkedToCashCount: 0,
    missingCashCountId: 0,
    missingClientIdAfterResolution: 0,
    missingAccountLink: 0,
    paymentsRequiringReview: 0,
    paymentsWithSupportedMethods: 0,
    paymentsSkippedNoSupportedMethod: 0,
    paymentsWithMultiAccount: 0,
    movementsBuilt: 0,
    existingMovements: 0,
    movementsToWrite: 0,
    sample: [],
  };

  payments.forEach((payment) => {
    const paymentMethods = getPaymentMethods(payment);
    if (!paymentMethods.length) {
      summary.paymentsSkippedNoSupportedMethod += 1;
      return;
    }
    summary.paymentsWithSupportedMethods += 1;

    const resolution = buildResolutionContext({
      payment,
      installmentLinks,
      receiptLinks,
      cashCountLinks,
      accountsMap,
    });

    if (resolution.resolutionSources.includes('installmentPayments')) {
      summary.resolvedByInstallmentPayments += 1;
    }
    if (resolution.resolutionSources.includes('paymentDoc')) {
      summary.resolvedByPaymentDoc += 1;
    }
    if (resolution.resolutionSources.includes('receipt')) {
      summary.resolvedByReceipt += 1;
    }
    if (resolution.cashCountId) {
      summary.linkedToCashCount += 1;
    } else {
      summary.missingCashCountId += 1;
    }
    if (!resolution.clientId) {
      summary.missingClientIdAfterResolution += 1;
    }
    if (!resolution.accountEntries.length) {
      summary.missingAccountLink += 1;
    }
    if (resolution.accountEntries.length > 1) {
      summary.paymentsWithMultiAccount += 1;
    }
    if (resolution.unresolvedReview.length > 0) {
      summary.paymentsRequiringReview += 1;
    }

    const builtMovements = buildReceivablePaymentCashMovements({
      businessId,
      payment,
      paymentMethods,
      cashCountId: resolution.cashCountId,
      clientId: resolution.clientId,
      accountEntries: resolution.accountEntries,
      createdAt: payment.createdAt ?? payment.date ?? new Date(),
      createdBy: payment.createdUserId ?? null,
    }).map((movement) =>
      withMigrationMetadata({
        movement,
        payment,
        resolution,
        dryRun: dryRun || !write,
      }),
    );

    summary.movementsBuilt += builtMovements.length;

    builtMovements.forEach((movement) => {
      movementRefs.push(
        db.doc(`businesses/${businessId}/cashMovements/${movement.id}`),
      );
      writePayloads.push({
        refPath: `businesses/${businessId}/cashMovements/${movement.id}`,
        movement,
      });
    });

    if (summary.sample.length < 10) {
      summary.sample.push({
        paymentId: payment.id,
        totalPaid: safeNumber(payment.totalPaid ?? payment.amount),
        paymentMethods: paymentMethods.map((method) => ({
          method: method.method ?? null,
          value: safeNumber(method.value ?? method.amount),
        })),
        cashCountId: resolution.cashCountId,
        clientId: resolution.clientId,
        accountIds: resolution.accountEntries.map((entry) => entry.arId),
        invoiceIds: uniqueStrings(
          resolution.accountEntries.map((entry) => entry.invoiceId),
        ),
        cashCountLinked: Boolean(resolution.cashCountId),
        unresolvedReview: resolution.unresolvedReview,
        movementIds: builtMovements.map((movement) => movement.id),
      });
    }
  });

  if (movementRefs.length) {
    for (const refsChunk of chunk(movementRefs, 200)) {
      const loaded = await db.getAll(...refsChunk);
      summary.existingMovements += loaded.filter((docSnap) => docSnap.exists).length;
    }
  }
  summary.movementsToWrite = Math.max(
    summary.movementsBuilt - summary.existingMovements,
    0,
  );

  if (write && !dryRun && writePayloads.length) {
    for (const items of chunk(writePayloads, WRITE_BATCH_LIMIT)) {
      const batch = db.batch();
      items.forEach(({refPath, movement}) => {
        batch.set(db.doc(refPath), movement, {merge: true});
      });
      await batch.commit();
    }
  }

  console.log(JSON.stringify(summary, null, 2));
};

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error?.message || String(error),
        stack: error?.stack || null,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
