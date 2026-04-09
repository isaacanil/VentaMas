/**
 * Backfill additive and idempotent `paymentTerms` and `paymentState` for purchases.
 *
 * Usage (PowerShell):
 *   cd C:\Dev\VentaMas\functions
 *   node .\scripts\backfillPurchasePaymentTermsAndLegacyState.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P
 *
 *   node .\scripts\backfillPurchasePaymentTermsAndLegacyState.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P --write
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

const SCRIPT_VERSION = 'backfillPurchasePaymentTermsAndLegacyState-v1';
const WRITE_BATCH_LIMIT = 400;
const THRESHOLD = 0.01;
const IMMEDIATE_CONDITIONS = new Set(['cash']);

const parseArgs = () => {
  const rawArgs = process.argv.slice(2);
  const args = Object.fromEntries(
    rawArgs
      .map((raw) => raw.split('='))
      .map(([key, value]) => [key.replace(/^--/, ''), value ?? '']),
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
    limit: args.limit ? Number(args.limit) : 5000,
    write: readBool('write'),
    dryRun: !readBool('write') && args.dryRun !== '0',
    force: readBool('force'),
  };
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) =>
  Math.round(toFiniteNumber(value) * 100) / 100;

const resolvePaymentStateStatus = ({ total, paid, balance }) => {
  if (paid > total + THRESHOLD) {
    return 'overpaid';
  }
  if (balance <= THRESHOLD) {
    return 'paid';
  }
  if (paid > THRESHOLD) {
    return 'partial';
  }
  return 'unpaid';
};

const buildPaymentState = ({
  total,
  paid,
  balance,
  paymentCount,
  lastPaymentAt = null,
  nextPaymentAt = null,
  requiresReview = false,
  migratedFromLegacy = false,
}) => {
  const safeTotal = roundToTwoDecimals(total);
  const safePaid = roundToTwoDecimals(paid);
  const safeBalance = roundToTwoDecimals(
    balance == null ? Math.max(safeTotal - safePaid, 0) : balance,
  );

  return {
    status: resolvePaymentStateStatus({
      total: safeTotal,
      paid: safePaid,
      balance: safeBalance,
    }),
    total: safeTotal,
    paid: safePaid,
    balance: safeBalance,
    paymentCount,
    lastPaymentAt,
    nextPaymentAt,
    lastPaymentId: null,
    requiresReview,
    migratedFromLegacy,
  };
};

const initAdmin = ({ keyPath, projectId }) => {
  if (!keyPath) throw new Error('Missing --keyPath');
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Service account key not found: ${keyPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
    });
  }

  return admin.firestore();
};

const flushWrites = async (db, operations, dryRun) => {
  if (!operations.length || dryRun) return;

  for (let index = 0; index < operations.length; index += WRITE_BATCH_LIMIT) {
    const batch = db.batch();
    operations.slice(index, index + WRITE_BATCH_LIMIT).forEach((operation) => {
      batch.update(operation.ref, ...operation.updates);
    });
    await batch.commit();
  }
};

const resolvePurchaseDocShape = (rawDoc) => {
  const record = asRecord(rawDoc);
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return {
      purchase: asRecord(record.data),
      patchPrefix: 'data.',
    };
  }

  if (record.purchase && typeof record.purchase === 'object' && !Array.isArray(record.purchase)) {
    return {
      purchase: asRecord(record.purchase),
      patchPrefix: 'purchase.',
    };
  }

  return {
    purchase: record,
    patchPrefix: '',
  };
};

const resolvePurchaseCondition = (purchase) =>
  toCleanString(purchase?.paymentTerms?.condition) ?? toCleanString(purchase.condition);

const resolveExpectedPaymentAt = (purchase) =>
  purchase?.paymentTerms?.expectedPaymentAt ??
  purchase.paymentAt ??
  purchase?.dates?.paymentDate ??
  null;

const resolvePurchasePaymentTerms = (purchase) => {
  const condition = resolvePurchaseCondition(purchase);
  const expectedPaymentAt = resolveExpectedPaymentAt(purchase);
  const isImmediate = condition ? IMMEDIATE_CONDITIONS.has(condition) : false;

  return {
    condition,
    expectedPaymentAt,
    isImmediate,
    scheduleType: isImmediate ? 'immediate' : condition ? 'deferred' : 'custom',
  };
};

const resolvePurchaseLineSubtotal = (item) => {
  const unitCost = Number(item.unitCost);
  const quantity =
    Number(item.quantity ?? item.purchaseQuantity ?? 0);

  if (Number.isFinite(Number(item.subtotal))) {
    return roundToTwoDecimals(item.subtotal);
  }
  if (Number.isFinite(Number(item.subTotal))) {
    return roundToTwoDecimals(item.subTotal);
  }

  return roundToTwoDecimals(
    (Number.isFinite(unitCost) ? unitCost : 0) *
      (Number.isFinite(quantity) ? quantity : 0),
  );
};

const resolvePurchaseTotal = (purchase) => {
  if (Number.isFinite(Number(purchase.totalAmount))) {
    return roundToTwoDecimals(purchase.totalAmount);
  }
  if (Number.isFinite(Number(purchase.total))) {
    return roundToTwoDecimals(purchase.total);
  }
  if (Number.isFinite(Number(purchase.amount))) {
    return roundToTwoDecimals(purchase.amount);
  }

  const replenishments = Array.isArray(purchase.replenishments)
    ? purchase.replenishments
    : [];
  const subtotal = replenishments.reduce(
    (sum, item) => sum + resolvePurchaseLineSubtotal(asRecord(item)),
    0,
  );
  const taxes = replenishments.reduce(
    (sum, item) => sum + toFiniteNumber(asRecord(item).calculatedITBIS),
    0,
  );

  const total = subtotal + taxes;
  return total > 0 ? roundToTwoDecimals(total) : null;
};

const isPurchaseCompleted = (purchase) => {
  const normalizedStatus = toCleanString(purchase.status)?.toLowerCase();
  return normalizedStatus === 'completed' || purchase.completedAt != null;
};

const resolvePurchasePaymentState = (purchase, total, paymentTerms) => {
  if (total == null) return null;

  if (Object.keys(asRecord(purchase.paymentState)).length) {
    const current = asRecord(purchase.paymentState);
    return buildPaymentState({
      total,
      paid: current.paid,
      balance: current.balance,
      paymentCount: current.paymentCount,
      lastPaymentAt: current.lastPaymentAt ?? null,
      nextPaymentAt: current.nextPaymentAt ?? paymentTerms.expectedPaymentAt ?? null,
      requiresReview: Boolean(current.requiresReview),
      migratedFromLegacy: Boolean(current.migratedFromLegacy),
    });
  }

  const isImmediate = Boolean(paymentTerms.isImmediate);
  const isCompleted = isPurchaseCompleted(purchase);
  const lastPaymentAt =
    purchase.completedAt ??
    paymentTerms.expectedPaymentAt ??
    purchase.deliveryAt ??
    null;
  const inferredFromLegacy = Boolean(
    purchase.paymentAt ?? purchase.condition ?? purchase?.dates?.paymentDate,
  );

  if (isImmediate && isCompleted) {
    return buildPaymentState({
      total,
      paid: total,
      balance: 0,
      paymentCount: 1,
      lastPaymentAt,
      nextPaymentAt: null,
      migratedFromLegacy: inferredFromLegacy,
    });
  }

  return buildPaymentState({
    total,
    paid: 0,
    balance: total,
    paymentCount: 0,
    lastPaymentAt: null,
    nextPaymentAt: paymentTerms.expectedPaymentAt ?? null,
    requiresReview: !paymentTerms.expectedPaymentAt && !isImmediate,
    migratedFromLegacy: inferredFromLegacy,
  });
};

const main = async () => {
  const options = parseArgs();
  if (!options.businessId) {
    throw new Error('Missing --businessId');
  }

  const db = initAdmin(options);
  const snapshot = await db
    .collection(`businesses/${options.businessId}/purchases`)
    .limit(options.limit)
    .get();

  const operations = [];
  let scanned = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;
  let toWrite = 0;

  snapshot.docs.forEach((doc) => {
    scanned += 1;
    const { purchase, patchPrefix } = resolvePurchaseDocShape(doc.data());
    const hasPaymentTerms = Object.keys(asRecord(purchase.paymentTerms)).length > 0;
    const hasPaymentState = Object.keys(asRecord(purchase.paymentState)).length > 0;

    if (hasPaymentTerms && hasPaymentState && !options.force) {
      skippedExisting += 1;
      return;
    }

    const paymentTerms = resolvePurchasePaymentTerms(purchase);
    const total = resolvePurchaseTotal(purchase);
    const paymentState = resolvePurchasePaymentState(
      purchase,
      total,
      paymentTerms,
    );

    if (!paymentState) {
      skippedInvalid += 1;
      return;
    }

    const prefix = patchPrefix;
    toWrite += 1;
    const updates = [
      `${prefix}paymentTerms`, paymentTerms,
      `${prefix}paymentState`, paymentState,
      `${prefix}updatedAt`, admin.firestore.FieldValue.serverTimestamp(),
    ];

    if (prefix) {
      updates.push(
        new admin.firestore.FieldPath(`${prefix}paymentTerms`),
        admin.firestore.FieldValue.delete(),
        new admin.firestore.FieldPath(`${prefix}paymentState`),
        admin.firestore.FieldValue.delete(),
      );
    }

    operations.push({
      ref: doc.ref,
      updates,
    });
  });

  await flushWrites(db, operations, options.dryRun);

  console.log(
    JSON.stringify(
      {
        scriptVersion: SCRIPT_VERSION,
        businessId: options.businessId,
        write: options.write,
        dryRun: options.dryRun,
        force: options.force,
        scanned,
        toWrite,
        skippedExisting,
        skippedInvalid,
      },
      null,
      2,
    ),
  );
};

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        scriptVersion: SCRIPT_VERSION,
        error: error?.message || String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
