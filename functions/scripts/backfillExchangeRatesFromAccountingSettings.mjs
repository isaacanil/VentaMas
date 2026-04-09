/**
 * Materialize `exchangeRates` and `currentExchangeRateIdsByCurrency`
 * from existing `settings/accounting`.
 *
 * Usage (PowerShell):
 *   cd C:\Dev\VentaMas\functions
 *   node .\scripts\backfillExchangeRatesFromAccountingSettings.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P
 *
 *   node .\scripts\backfillExchangeRatesFromAccountingSettings.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P --write
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

const SCRIPT_VERSION = 'backfillExchangeRatesFromAccountingSettings-v1';

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

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value?.toMillis === 'function') {
    const parsed = value.toMillis();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate();
    return parsed instanceof Date ? parsed.getTime() : null;
  }
  const record = asRecord(value);
  const seconds =
    typeof record.seconds === 'number'
      ? record.seconds
      : typeof record._seconds === 'number'
        ? record._seconds
        : null;
  const nanoseconds =
    typeof record.nanoseconds === 'number'
      ? record.nanoseconds
      : typeof record._nanoseconds === 'number'
        ? record._nanoseconds
        : 0;
  if (seconds == null) return null;
  return seconds * 1000 + Math.floor(nanoseconds / 1e6);
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

const buildManualRatesByCurrency = (settings) => {
  const record = asRecord(settings.manualRatesByCurrency);
  return Object.entries(record).reduce((accumulator, [currencyKey, rawValue]) => {
    const currency = toUpperCleanString(currencyKey);
    if (!currency) {
      return accumulator;
    }

    const value = asRecord(rawValue);
    const buyRate =
      toFiniteNumber(value.buyRate) ??
      toFiniteNumber(value.purchase) ??
      toFiniteNumber(value.purchaseRate) ??
      toFiniteNumber(value.buy);
    const sellRate =
      toFiniteNumber(value.sellRate) ??
      toFiniteNumber(value.sale) ??
      toFiniteNumber(value.saleRate) ??
      toFiniteNumber(value.sell);

    if (buyRate == null && sellRate == null) {
      return accumulator;
    }

    accumulator[currency] = {
      buyRate,
      sellRate,
    };
    return accumulator;
  }, {});
};

const buildExchangeRateId = ({ quoteCurrency, baseCurrency, historyId }) =>
  `fx_${quoteCurrency}_${baseCurrency}_${historyId}`;

const main = async () => {
  const options = parseArgs();
  if (!options.businessId) {
    throw new Error('Missing --businessId');
  }

  const db = initAdmin(options);
  const settingsRef = db.doc(`businesses/${options.businessId}/settings/accounting`);
  const settingsSnap = await settingsRef.get();

  if (!settingsSnap.exists) {
    throw new Error('Accounting settings not found for business.');
  }

  const settings = asRecord(settingsSnap.data());
  const functionalCurrency = toUpperCleanString(settings.functionalCurrency);
  if (!functionalCurrency) {
    throw new Error('functionalCurrency is missing in settings/accounting.');
  }

  const documentCurrencies = Array.isArray(settings.documentCurrencies)
    ? settings.documentCurrencies
        .map((currency) => toUpperCleanString(currency))
        .filter(Boolean)
    : [functionalCurrency];
  const manualRatesByCurrency = buildManualRatesByCurrency(settings);
  const effectiveAtMillis = toMillis(settings.updatedAt) ?? Date.now();
  const effectiveAt = admin.firestore.Timestamp.fromMillis(effectiveAtMillis);
  const historyId =
    toCleanString(settings.lastChangeId) ?? `settings_${effectiveAtMillis}`;

  const exchangeRateRecords = [];
  const currentExchangeRateIdsByCurrency = {};

  Object.entries(manualRatesByCurrency).forEach(([currency, rates]) => {
    if (currency === functionalCurrency) {
      return;
    }
    if (!documentCurrencies.includes(currency)) {
      return;
    }

    const buyRate = toFiniteNumber(rates.buyRate);
    const sellRate = toFiniteNumber(rates.sellRate);
    if (buyRate == null && sellRate == null) {
      return;
    }

    const id = buildExchangeRateId({
      quoteCurrency: currency,
      baseCurrency: functionalCurrency,
      historyId,
    });

    currentExchangeRateIdsByCurrency[currency] = id;
    exchangeRateRecords.push({
      id,
      businessId: options.businessId,
      quoteCurrency: currency,
      baseCurrency: functionalCurrency,
      buyRate,
      sellRate,
      effectiveAt,
      source: 'settings_manual_backfill',
      status: 'active',
      createdAt: effectiveAt,
      createdBy: toCleanString(settings.updatedBy),
      historyId,
      metadata: {
        origin: 'settings/accounting',
        scriptVersion: SCRIPT_VERSION,
      },
    });
  });

  if (options.write) {
    const batch = db.batch();

    exchangeRateRecords.forEach((record) => {
      batch.set(
        db.doc(`businesses/${options.businessId}/exchangeRates/${record.id}`),
        record,
        { merge: true },
      );
    });

    batch.set(
      settingsRef,
      {
        currentExchangeRateIdsByCurrency,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await batch.commit();
  }

  console.log(
    JSON.stringify(
      {
        scriptVersion: SCRIPT_VERSION,
        businessId: options.businessId,
        write: options.write,
        dryRun: options.dryRun,
        force: options.force,
        functionalCurrency,
        documentCurrencies,
        manualRatesByCurrency,
        currentExchangeRateIdsByCurrency,
        exchangeRatesToWrite: exchangeRateRecords.length,
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
