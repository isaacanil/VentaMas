/**
 * Backfill additive and idempotent `paymentState` for invoices.
 *
 * Usage (PowerShell):
 *   cd C:\Dev\VentaMas\functions
 *   node .\scripts\backfillInvoicePaymentState.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P
 *
 *   node .\scripts\backfillInvoicePaymentState.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P --write
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

const SCRIPT_VERSION = 'backfillInvoicePaymentState-v1';
const WRITE_BATCH_LIMIT = 400;
const THRESHOLD = 0.01;

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
    nextPaymentAt: null,
    lastPaymentId: null,
    migratedFromLegacy: true,
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

const resolveInvoiceDocShape = (rawDoc) => {
  const record = asRecord(rawDoc);
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return {
      invoice: asRecord(record.data),
      patchPrefix: 'data.',
    };
  }

  return {
    invoice: record,
    patchPrefix: '',
  };
};

const resolveInvoicePaymentState = (invoice) => {
  const accumulatedPaidRaw = Number(invoice.accumulatedPaid);
  const hasAccumulatedPaid = Number.isFinite(accumulatedPaidRaw);
  const paymentGross = Number(invoice?.payment?.value ?? 0);
  const changeGross = Number(invoice?.change?.value ?? 0);
  const paidFromSnapshot = Math.max(
    0,
    roundToTwoDecimals(paymentGross - (Number.isFinite(changeGross) ? changeGross : 0)),
  );
  const paid = hasAccumulatedPaid ? accumulatedPaidRaw : paidFromSnapshot;
  const total = Number(invoice?.totalPurchase?.value ?? invoice?.totalAmount ?? 0);

  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }

  const paymentHistory = Array.isArray(invoice.paymentHistory)
    ? invoice.paymentHistory
    : [];
  const lastPayment = paymentHistory.length
    ? paymentHistory[paymentHistory.length - 1]
    : null;

  return buildPaymentState({
    total,
    paid,
    balance: Math.max(roundToTwoDecimals(total - paid), 0),
    paymentCount: paymentHistory.length,
    lastPaymentAt: lastPayment?.date ?? null,
  });
};

const main = async () => {
  const options = parseArgs();
  if (!options.businessId) {
    throw new Error('Missing --businessId');
  }

  const db = initAdmin(options);
  const snapshot = await db
    .collection(`businesses/${options.businessId}/invoices`)
    .limit(options.limit)
    .get();

  const operations = [];
  let scanned = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;
  let toWrite = 0;

  snapshot.docs.forEach((doc) => {
    scanned += 1;
    const { invoice, patchPrefix } = resolveInvoiceDocShape(doc.data());
    const hasExistingPaymentState = Object.keys(asRecord(invoice.paymentState)).length > 0;
    if (hasExistingPaymentState && !options.force) {
      skippedExisting += 1;
      return;
    }

    const paymentState = resolveInvoicePaymentState(invoice);
    if (!paymentState) {
      skippedInvalid += 1;
      return;
    }

    const prefix = patchPrefix;
    toWrite += 1;
    const updates = [
      `${prefix}paymentState`, paymentState,
      `${prefix}paymentStatus`, paymentState.status,
      `${prefix}accumulatedPaid`, paymentState.paid,
      `${prefix}balanceDue`, paymentState.balance,
      `${prefix}updatedAt`, admin.firestore.FieldValue.serverTimestamp(),
    ];

    if (prefix) {
      updates.push(
        new admin.firestore.FieldPath(`${prefix}paymentState`),
        admin.firestore.FieldValue.delete(),
        new admin.firestore.FieldPath(`${prefix}paymentStatus`),
        admin.firestore.FieldValue.delete(),
        new admin.firestore.FieldPath(`${prefix}accumulatedPaid`),
        admin.firestore.FieldValue.delete(),
        new admin.firestore.FieldPath(`${prefix}balanceDue`),
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
