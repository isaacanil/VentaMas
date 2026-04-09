/**
 * Read-only audit of accounting phase coverage for a business.
 *
 * Usage (PowerShell):
 *   cd C:\Dev\VentaMas\functions
 *   node .\scripts\auditCashMovementsCoverage.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

const SCRIPT_VERSION = 'auditCashMovementsCoverage-v2';
const DEFAULT_LIMIT = 5000;
const BANK_METHODS = new Set([
  'card',
  'transfer',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'check',
]);
const CASH_METHODS = new Set(['cash', 'open_cash']);

const parseArgs = () => {
  const rawArgs = process.argv.slice(2);
  const args = Object.fromEntries(
    rawArgs
      .map((raw) => raw.split('='))
      .map(([key, value]) => [key.replace(/^--/, ''), value ?? '']),
  );

  return {
    keyPath: args.keyPath || '',
    projectId: args.projectId || '',
    businessId: args.businessId || '',
    limit: args.limit ? Number(args.limit) : DEFAULT_LIMIT,
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

const toUpperCleanString = (value) => {
  const cleaned = toCleanString(value);
  return cleaned ? cleaned.toUpperCase() : null;
};

const normalizeMethodCode = (value) => {
  const cleaned = toCleanString(value);
  return cleaned ? cleaned.toLowerCase() : null;
};

const readNested = (value, path) =>
  path.reduce((current, key) => asRecord(current)[key], value);

const hasPaymentState = (invoiceRecord) => {
  const paymentState = asRecord(invoiceRecord.paymentState);
  return Object.keys(paymentState).length > 0;
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

const requiresRateId = (value) => {
  const documentCurrency = extractDocumentCurrency(value);
  const functionalCurrency = extractFunctionalCurrency(value);
  if (!documentCurrency || !functionalCurrency) {
    return false;
  }

  return documentCurrency !== functionalCurrency;
};

const hasRateId = (value) =>
  Boolean(toCleanString(extractExchangeRateSnapshot(value).rateId));

const requiresCashCountId = (value) => {
  const record = asRecord(value);
  const method = normalizeMethodCode(record.method);
  return record.impactsCashDrawer === true || CASH_METHODS.has(method);
};

const requiresBankAccountId = (value) => {
  const record = asRecord(value);
  const method = normalizeMethodCode(record.method);
  return record.impactsBankLedger === true || BANK_METHODS.has(method);
};

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

const increment = (record, key) => {
  record[key] = (record[key] || 0) + 1;
};

const limitQuery = async (collectionRef, limit) => collectionRef.limit(limit).get();

const auditCashMovements = async (db, businessId, limit, bankAccountIds) => {
  const snapshot = await limitQuery(
    db.collection(`businesses/${businessId}/cashMovements`),
    limit,
  );

  const summary = {
    total: snapshot.size,
    bySourceType: {},
    missingCashCountIdBySourceType: {},
    missingBankAccountIdBySourceType: {},
    unknownBankAccountIdBySourceType: {},
  };

  snapshot.docs.forEach((doc) => {
    const movement = asRecord(doc.data());
    const sourceType = toCleanString(movement.sourceType) ?? 'unknown';
    increment(summary.bySourceType, sourceType);

    if (requiresCashCountId(movement) && !toCleanString(movement.cashCountId)) {
      increment(summary.missingCashCountIdBySourceType, sourceType);
    }

    if (requiresBankAccountId(movement) && !toCleanString(movement.bankAccountId)) {
      increment(summary.missingBankAccountIdBySourceType, sourceType);
    }

    const bankAccountId = toCleanString(movement.bankAccountId);
    if (bankAccountId && !bankAccountIds.has(bankAccountId)) {
      increment(summary.unknownBankAccountIdBySourceType, sourceType);
    }
  });

  return summary;
};

const auditExpenses = async (db, businessId, limit, bankAccountIds) => {
  const snapshot = await limitQuery(
    db.collection(`businesses/${businessId}/expenses`),
    limit,
  );

  const summary = {
    total: snapshot.size,
    missingBankAccountId: 0,
    unknownBankAccountId: 0,
    missingCashRegister: 0,
    missingRateId: 0,
  };

  snapshot.docs.forEach((doc) => {
    const expense = asRecord(doc.data()?.expense);
    const payment = asRecord(expense.payment);
    const method = normalizeMethodCode(payment.method);
    const bankAccountId = toCleanString(payment.bankAccountId);

    if (BANK_METHODS.has(method) && !bankAccountId) {
      summary.missingBankAccountId += 1;
    }

    if (bankAccountId && !bankAccountIds.has(bankAccountId)) {
      summary.unknownBankAccountId += 1;
    }

    if (method === 'open_cash' && !toCleanString(payment.cashRegister)) {
      summary.missingCashRegister += 1;
    }

    if (requiresRateId(expense) && !hasRateId(expense)) {
      summary.missingRateId += 1;
    }
  });

  return summary;
};

const auditInvoices = async (db, businessId, limit) => {
  const snapshot = await limitQuery(
    db.collection(`businesses/${businessId}/invoices`),
    limit,
  );

  const summary = {
    total: snapshot.size,
    missingPaymentState: 0,
    missingRateId: 0,
  };

  snapshot.docs.forEach((doc) => {
    const invoice = asRecord(doc.data()?.data);

    if (!hasPaymentState(invoice)) {
      summary.missingPaymentState += 1;
    }

    if (requiresRateId(invoice) && !hasRateId(invoice)) {
      summary.missingRateId += 1;
    }
  });

  return summary;
};

const auditPurchases = async (db, businessId, limit) => {
  const snapshot = await limitQuery(
    db.collection(`businesses/${businessId}/purchases`),
    limit,
  );

  const summary = {
    total: snapshot.size,
    missingPaymentTerms: 0,
    missingPaymentState: 0,
    missingRateId: 0,
  };

  snapshot.docs.forEach((doc) => {
    const purchase = asRecord(doc.data()?.data ?? doc.data()?.purchase ?? doc.data());

    if (!Object.keys(asRecord(purchase.paymentTerms)).length) {
      summary.missingPaymentTerms += 1;
    }

    if (!Object.keys(asRecord(purchase.paymentState)).length) {
      summary.missingPaymentState += 1;
    }

    if (requiresRateId(purchase) && !hasRateId(purchase)) {
      summary.missingRateId += 1;
    }
  });

  return summary;
};

const auditAccountsPayablePayments = async (db, businessId, limit, bankAccountIds) => {
  const snapshot = await limitQuery(
    db.collection(`businesses/${businessId}/accountsPayablePayments`),
    limit,
  );

  const summary = {
    total: snapshot.size,
    missingBankAccountId: 0,
    unknownBankAccountId: 0,
    missingCashCountId: 0,
    missingRateId: 0,
  };

  snapshot.docs.forEach((doc) => {
    const payment = asRecord(doc.data());
    const status = normalizeMethodCode(payment.status);
    if (status === 'void' || status === 'draft') {
      return;
    }

    const paymentMethods = Array.isArray(payment.paymentMethods)
      ? payment.paymentMethods.map((item) => asRecord(item))
      : [];

    const hasBankMethod = paymentMethods.some((entry) =>
      BANK_METHODS.has(normalizeMethodCode(entry.method)),
    );
    const hasCashMethod = paymentMethods.some((entry) =>
      CASH_METHODS.has(normalizeMethodCode(entry.method)),
    );
    const bankAccountId = toCleanString(payment.bankAccountId);

    if (hasBankMethod && !bankAccountId) {
      summary.missingBankAccountId += 1;
    }

    if (bankAccountId && !bankAccountIds.has(bankAccountId)) {
      summary.unknownBankAccountId += 1;
    }

    if (hasCashMethod && !toCleanString(payment.cashCountId)) {
      summary.missingCashCountId += 1;
    }

    if (requiresRateId(payment) && !hasRateId(payment)) {
      summary.missingRateId += 1;
    }
  });

  return summary;
};

const auditReferenceCollections = async (db, businessId, limit) => {
  const [bankAccountsSnapshot, exchangeRatesSnapshot, settingsSnapshot] = await Promise.all([
    limitQuery(db.collection(`businesses/${businessId}/bankAccounts`), limit),
    limitQuery(db.collection(`businesses/${businessId}/exchangeRates`), limit),
    db.doc(`businesses/${businessId}/settings/accounting`).get(),
  ]);
  const settings = settingsSnapshot.exists ? asRecord(settingsSnapshot.data()) : {};
  const functionalCurrency = toUpperCleanString(settings.functionalCurrency);
  const documentCurrencies = Array.isArray(settings.documentCurrencies)
    ? settings.documentCurrencies
        .map((currency) => toUpperCleanString(currency))
        .filter(Boolean)
    : [];
  const currentRateIdsByCurrency = asRecord(settings.currentExchangeRateIdsByCurrency);
  const foreignCurrenciesWithoutCurrentRateId = documentCurrencies.filter(
    (currency) =>
      currency &&
      currency !== functionalCurrency &&
      !toCleanString(currentRateIdsByCurrency[currency]),
  );

  return {
    settings: {
      exists: settingsSnapshot.exists,
      functionalCurrency,
      documentCurrencies,
      foreignCurrenciesWithoutCurrentRateId,
    },
    bankAccounts: {
      total: bankAccountsSnapshot.size,
      active: bankAccountsSnapshot.docs.filter(
        (doc) => toCleanString(doc.data()?.status) !== 'inactive',
      ).length,
      ids: new Set(bankAccountsSnapshot.docs.map((doc) => doc.id)),
    },
    exchangeRates: {
      total: exchangeRatesSnapshot.size,
      active: exchangeRatesSnapshot.docs.filter(
        (doc) => toCleanString(doc.data()?.status) === 'active',
      ).length,
    },
  };
};

const main = async () => {
  const options = parseArgs();
  if (!options.businessId) {
    throw new Error('Missing --businessId');
  }

  const db = initAdmin(options);
  const references = await auditReferenceCollections(
    db,
    options.businessId,
    options.limit,
  );

  const [
    cashMovements,
    expenses,
    invoices,
    purchases,
    accountsPayablePayments,
  ] = await Promise.all([
    auditCashMovements(
      db,
      options.businessId,
      options.limit,
      references.bankAccounts.ids,
    ),
    auditExpenses(
      db,
      options.businessId,
      options.limit,
      references.bankAccounts.ids,
    ),
    auditInvoices(db, options.businessId, options.limit),
    auditPurchases(db, options.businessId, options.limit),
    auditAccountsPayablePayments(
      db,
      options.businessId,
      options.limit,
      references.bankAccounts.ids,
    ),
  ]);

  console.log(
    JSON.stringify(
      {
        scriptVersion: SCRIPT_VERSION,
        businessId: options.businessId,
        limit: options.limit,
        referenceCollections: {
          settings: references.settings,
          bankAccounts: {
            total: references.bankAccounts.total,
            active: references.bankAccounts.active,
          },
          exchangeRates: references.exchangeRates,
        },
        coverage: {
          cashMovements,
          expenses,
          invoices,
          purchases,
          accountsPayablePayments,
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
