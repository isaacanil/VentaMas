/**
 * Backfill additive and idempotent `cashMovements` for invoice POS and expenses.
 *
 * Safe defaults:
 * - dry-run by default
 * - deterministic movement ids
 * - additive writes only into `businesses/{businessId}/cashMovements`
 * - no mutation of invoices, expenses or cashCounts
 *
 * Usage (PowerShell):
 *   cd C:\Dev\VentaMas\functions
 *   node .\scripts\2026-03-18-backfill-cash-movements.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P --domains=invoice_pos,expense --dryRun=1
 *
 *   node .\scripts\2026-03-18-backfill-cash-movements.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P --domains=invoice_pos,expense --write
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

import {
  buildExpenseCashMovement,
  buildInvoicePosCashMovements,
} from '../src/app/versions/v2/accounting/utils/cashMovement.util.js';

const SCRIPT_VERSION = '2026-03-18-backfill-cash-movements-v1';
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
    invoiceId: args.invoiceId || '',
    expenseId: args.expenseId || '',
    domains: (args.domains || 'invoice_pos,expense')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    limit: args.limit ? Number(args.limit) : null,
    dryRun: !readBool('write') && args.dryRun !== '0',
    write: readBool('write'),
  };
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

const shouldProcessDomain = (domains, domain) =>
  Array.isArray(domains) && domains.includes(domain);

const initAdmin = ({ keyPath, projectId }) => {
  if (!keyPath) {
    throw new Error('Missing --keyPath');
  }
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
      batch.set(operation.ref, operation.data, { merge: true });
    });
    await batch.commit();
  }
};

const backfillInvoicePos = async (db, options) => {
  const {
    businessId,
    invoiceId,
    limit,
    dryRun,
  } = options;
  const invoicesRef = db.collection(`businesses/${businessId}/invoices`);
  const snapshot = invoiceId
    ? await invoicesRef.doc(invoiceId).get().then((doc) => ({
        docs: doc.exists ? [doc] : [],
      }))
    : await invoicesRef.limit(limit || 5000).get();

  const operations = [];
  let scanned = 0;
  let created = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    scanned += 1;
    const invoice = asRecord(doc.data()?.data);
    const cashCountId = toCleanString(invoice.cashCountId);
    if (!cashCountId) {
      skipped += 1;
      continue;
    }

    const movements = buildInvoicePosCashMovements({
      businessId,
      invoice,
      invoiceId: doc.id,
      cashCountId,
      createdAt: invoice.date ?? doc.createTime ?? new Date(),
      createdBy: invoice.userID ?? null,
    });

    if (!movements.length) {
      skipped += 1;
      continue;
    }

    created += movements.length;
    movements.forEach((movement) => {
      operations.push({
        ref: db.doc(`businesses/${businessId}/cashMovements/${movement.id}`),
        data: {
          ...movement,
          metadata: {
            ...asRecord(movement.metadata),
            backfilledBy: SCRIPT_VERSION,
          },
        },
      });
    });
  }

  await flushWrites(db, operations, dryRun);

  return { domain: 'invoice_pos', scanned, created, skipped, dryRun };
};

const backfillExpenses = async (db, options) => {
  const {
    businessId,
    expenseId,
    limit,
    dryRun,
  } = options;
  const expensesRef = db.collection(`businesses/${businessId}/expenses`);
  const snapshot = expenseId
    ? await expensesRef.doc(expenseId).get().then((doc) => ({
        docs: doc.exists ? [doc] : [],
      }))
    : await expensesRef.limit(limit || 5000).get();

  const operations = [];
  let scanned = 0;
  let created = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    scanned += 1;
    const expense = asRecord(doc.data()?.expense);
    const movement = buildExpenseCashMovement({
      businessId,
      expenseId: doc.id,
      expense,
      createdAt: expense?.dates?.createdAt ?? expense?.createdAt ?? doc.createTime,
      createdBy: expense?.createdBy ?? null,
    });

    if (!movement) {
      skipped += 1;
      continue;
    }

    created += 1;
    operations.push({
      ref: db.doc(`businesses/${businessId}/cashMovements/${movement.id}`),
      data: {
        ...movement,
        metadata: {
          ...asRecord(movement.metadata),
          backfilledBy: SCRIPT_VERSION,
        },
      },
    });
  }

  await flushWrites(db, operations, dryRun);

  return { domain: 'expense', scanned, created, skipped, dryRun };
};

const main = async () => {
  const options = parseArgs();
  if (!options.businessId) {
    throw new Error('Missing --businessId');
  }

  const db = initAdmin(options);
  const results = [];

  if (shouldProcessDomain(options.domains, 'invoice_pos')) {
    results.push(await backfillInvoicePos(db, options));
  }
  if (shouldProcessDomain(options.domains, 'expense')) {
    results.push(await backfillExpenses(db, options));
  }

  console.log(
    JSON.stringify(
      {
        scriptVersion: SCRIPT_VERSION,
        businessId: options.businessId,
        write: options.write,
        dryRun: options.dryRun,
        domains: options.domains,
        results,
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
