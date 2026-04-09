/**
 * Backfill additive and idempotent `rateId` using `settings/accounting.currentExchangeRateIdsByCurrency`.
 *
 * Usage (PowerShell):
 *   cd C:\Dev\VentaMas\functions
 *   node .\scripts\backfillAccountingRateIdsFromSettings.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P
 *
 *   node .\scripts\backfillAccountingRateIdsFromSettings.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P --write
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

const SCRIPT_VERSION = 'backfillAccountingRateIdsFromSettings-v1';
const WRITE_BATCH_LIMIT = 400;

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

const toUpperCleanString = (value) => {
  const cleaned = toCleanString(value);
  return cleaned ? cleaned.toUpperCase() : null;
};

const readNested = (value, path) =>
  path.reduce((current, key) => asRecord(current)[key], value);

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

const extractExchangeRateSnapshot = (value) =>
  asRecord(
    readNested(value, ['monetary', 'exchangeRateSnapshot']) ||
      readNested(value, ['monetary', 'exchangeRate']) ||
      readNested(value, ['exchangeRateSnapshot']) ||
      readNested(value, ['exchangeRate']),
  );

const extractDocumentCurrency = (value) => {
  const snapshot = extractExchangeRateSnapshot(value);
  return (
    toUpperCleanString(readNested(value, ['monetary', 'documentCurrency', 'code'])) ??
    toUpperCleanString(readNested(value, ['documentCurrency', 'code'])) ??
    toUpperCleanString(snapshot.quoteCurrency)
  );
};

const extractFunctionalCurrency = (value) => {
  const snapshot = extractExchangeRateSnapshot(value);
  return (
    toUpperCleanString(readNested(value, ['monetary', 'functionalCurrency', 'code'])) ??
    toUpperCleanString(readNested(value, ['functionalCurrency', 'code'])) ??
    toUpperCleanString(snapshot.baseCurrency)
  );
};

const hasRateId = (value) =>
  Boolean(toCleanString(extractExchangeRateSnapshot(value).rateId));

const resolveRequiredRateId = (value, currentRateIdsByCurrency) => {
  const documentCurrency = extractDocumentCurrency(value);
  const functionalCurrency = extractFunctionalCurrency(value);

  if (!documentCurrency || !functionalCurrency) {
    return null;
  }

  if (documentCurrency === functionalCurrency) {
    return null;
  }

  return toCleanString(currentRateIdsByCurrency[documentCurrency]) ?? null;
};

const resolveInvoiceDocShape = (rawDoc) => {
  const record = asRecord(rawDoc);
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return {
      payload: asRecord(record.data),
      patchPath: 'data.monetary.exchangeRateSnapshot.rateId',
    };
  }

  return {
    payload: record,
    patchPath: 'monetary.exchangeRateSnapshot.rateId',
  };
};

const resolvePurchaseDocShape = (rawDoc) => {
  const record = asRecord(rawDoc);
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return {
      payload: asRecord(record.data),
      patchPath: 'data.monetary.exchangeRateSnapshot.rateId',
    };
  }

  if (record.purchase && typeof record.purchase === 'object' && !Array.isArray(record.purchase)) {
    return {
      payload: asRecord(record.purchase),
      patchPath: 'purchase.monetary.exchangeRateSnapshot.rateId',
    };
  }

  return {
    payload: record,
    patchPath: 'monetary.exchangeRateSnapshot.rateId',
  };
};

const resolveExpenseDocShape = (rawDoc) => {
  const record = asRecord(rawDoc);
  if (record.expense && typeof record.expense === 'object' && !Array.isArray(record.expense)) {
    return {
      payload: asRecord(record.expense),
      patchPath: 'expense.monetary.exchangeRateSnapshot.rateId',
    };
  }

  return {
    payload: record,
    patchPath: 'monetary.exchangeRateSnapshot.rateId',
  };
};

const resolveAccountsPayablePaymentShape = (rawDoc) => ({
  payload: asRecord(rawDoc),
  patchPath: 'exchangeRateSnapshot.rateId',
});

const buildOperationsForCollection = ({
  snapshot,
  currentRateIdsByCurrency,
  resolveShape,
  force,
}) => {
  const operations = [];
  let scanned = 0;
  let skippedExisting = 0;
  let skippedNoForeignRate = 0;
  let toWrite = 0;

  snapshot.docs.forEach((doc) => {
    scanned += 1;
    const { payload, patchPath } = resolveShape(doc.data());

    if (hasRateId(payload) && !force) {
      skippedExisting += 1;
      return;
    }

    const rateId = resolveRequiredRateId(payload, currentRateIdsByCurrency);
    if (!rateId) {
      skippedNoForeignRate += 1;
      return;
    }

    toWrite += 1;
    operations.push({
      ref: doc.ref,
      updates: [
        patchPath,
        rateId,
        'updatedAt',
        admin.firestore.FieldValue.serverTimestamp(),
      ],
    });
  });

  return {
    operations,
    scanned,
    skippedExisting,
    skippedNoForeignRate,
    toWrite,
  };
};

const main = async () => {
  const options = parseArgs();
  if (!options.businessId) {
    throw new Error('Missing --businessId');
  }

  const db = initAdmin(options);
  const settingsSnap = await db
    .doc(`businesses/${options.businessId}/settings/accounting`)
    .get();

  if (!settingsSnap.exists) {
    throw new Error('Accounting settings not found for business.');
  }

  const settings = asRecord(settingsSnap.data());
  const currentRateIdsByCurrency = asRecord(settings.currentExchangeRateIdsByCurrency);

  const [invoicesSnap, purchasesSnap, expensesSnap, accountsPayablePaymentsSnap] =
    await Promise.all([
      db.collection(`businesses/${options.businessId}/invoices`).limit(options.limit).get(),
      db.collection(`businesses/${options.businessId}/purchases`).limit(options.limit).get(),
      db.collection(`businesses/${options.businessId}/expenses`).limit(options.limit).get(),
      db
        .collection(`businesses/${options.businessId}/accountsPayablePayments`)
        .limit(options.limit)
        .get(),
    ]);

  const invoicesResult = buildOperationsForCollection({
    snapshot: invoicesSnap,
    currentRateIdsByCurrency,
    resolveShape: resolveInvoiceDocShape,
    force: options.force,
  });
  const purchasesResult = buildOperationsForCollection({
    snapshot: purchasesSnap,
    currentRateIdsByCurrency,
    resolveShape: resolvePurchaseDocShape,
    force: options.force,
  });
  const expensesResult = buildOperationsForCollection({
    snapshot: expensesSnap,
    currentRateIdsByCurrency,
    resolveShape: resolveExpenseDocShape,
    force: options.force,
  });
  const accountsPayablePaymentsResult = buildOperationsForCollection({
    snapshot: accountsPayablePaymentsSnap,
    currentRateIdsByCurrency,
    resolveShape: resolveAccountsPayablePaymentShape,
    force: options.force,
  });

  const operations = [
    ...invoicesResult.operations,
    ...purchasesResult.operations,
    ...expensesResult.operations,
    ...accountsPayablePaymentsResult.operations,
  ];

  await flushWrites(db, operations, options.dryRun);

  console.log(
    JSON.stringify(
      {
        scriptVersion: SCRIPT_VERSION,
        businessId: options.businessId,
        write: options.write,
        dryRun: options.dryRun,
        force: options.force,
        currentRateIdsByCurrency,
        results: {
          invoices: {
            scanned: invoicesResult.scanned,
            toWrite: invoicesResult.toWrite,
            skippedExisting: invoicesResult.skippedExisting,
            skippedNoForeignRate: invoicesResult.skippedNoForeignRate,
          },
          purchases: {
            scanned: purchasesResult.scanned,
            toWrite: purchasesResult.toWrite,
            skippedExisting: purchasesResult.skippedExisting,
            skippedNoForeignRate: purchasesResult.skippedNoForeignRate,
          },
          expenses: {
            scanned: expensesResult.scanned,
            toWrite: expensesResult.toWrite,
            skippedExisting: expensesResult.skippedExisting,
            skippedNoForeignRate: expensesResult.skippedNoForeignRate,
          },
          accountsPayablePayments: {
            scanned: accountsPayablePaymentsResult.scanned,
            toWrite: accountsPayablePaymentsResult.toWrite,
            skippedExisting: accountsPayablePaymentsResult.skippedExisting,
            skippedNoForeignRate:
              accountsPayablePaymentsResult.skippedNoForeignRate,
          },
        },
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
