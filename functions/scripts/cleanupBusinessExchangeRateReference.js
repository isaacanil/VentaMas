/* global console, process */
/*
  Script: cleanupBusinessExchangeRateReference.js

  Purpose:
    Remove legacy business-level exchange rate reference data stored at:
      businesses/{businessId}/settings/accounting/exchangeRateReference/latest
      businesses/{businessId}/settings/accounting/exchangeRateReference/latest/history/{entryId}

    The market reference is now stored globally at:
      system/marketData/exchangeRateProviders/open-exchange-rates

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/cleanupBusinessExchangeRateReference.js --dry-run
    node functions/scripts/cleanupBusinessExchangeRateReference.js --write

  Flags:
    --businessId <id>       Optional. Process only one business.
    --dry-run               Default. Only reports what would be deleted.
    --write                 Apply deletes.
    --limit <n>             Optional. Max businesses to scan.
    --page-size <n>         Optional. Pagination size for businesses/history docs.
    --service-account <p>   Optional. Explicit Firebase service account JSON path.
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

const args = process.argv.slice(2);

const hasFlag = (flag) => args.includes(flag);
const getFlagValue = (flag) => {
  const index = args.indexOf(flag);
  if (index !== -1) {
    const nextValue = args[index + 1];
    return nextValue && !nextValue.startsWith('--') ? nextValue : null;
  }

  const inlineArg = args.find((item) => item.startsWith(`${flag}=`));
  return inlineArg ? inlineArg.split('=').slice(1).join('=') || null : null;
};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const parsePositiveInt = (value, fallback) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : fallback;
};

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const json = JSON.parse(raw);
  return admin.credential.cert(json);
};

const dryRun = !hasFlag('--write') || hasFlag('--dry-run');
const writeMode = !dryRun;
const businessIdFilter = toCleanString(getFlagValue('--businessId'));
const limit = parsePositiveInt(getFlagValue('--limit'), 0);
const pageSize = Math.min(
  500,
  parsePositiveInt(getFlagValue('--page-size'), 200),
);
const serviceAccountPath =
  toCleanString(getFlagValue('--service-account')) ||
  toCleanString(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (hasFlag('--help') || hasFlag('-h')) {
  console.log(
    'Usage: node functions/scripts/cleanupBusinessExchangeRateReference.js [--businessId <id>] [--dry-run|--write] [--limit <n>] [--page-size <n>] [--service-account <path>]',
  );
  process.exit(0);
}

if (!serviceAccountPath) {
  console.error(
    '[cleanupBusinessExchangeRateReference] Missing service account. Use --service-account or GOOGLE_APPLICATION_CREDENTIALS.',
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: loadServiceAccountCredential(serviceAccountPath),
  });
}

const db = admin.firestore();

const resolveBusinessName = (data) => {
  const root = asRecord(data);
  const nestedBusiness = asRecord(root.business);
  return toCleanString(root.name) || toCleanString(nestedBusiness.name) || null;
};

const countOrDeleteCollectionDocs = async (collectionRef) => {
  let total = 0;

  while (true) {
    const snapshot = await collectionRef
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize)
      .get();

    if (snapshot.empty) {
      break;
    }

    total += snapshot.size;

    if (writeMode) {
      const batch = db.batch();
      for (const docSnap of snapshot.docs) {
        batch.delete(docSnap.ref);
      }
      await batch.commit();
    }

    if (snapshot.size < pageSize) {
      break;
    }
  }

  return total;
};

const inspectAndCleanupBusiness = async (businessDoc) => {
  const businessId = businessDoc.id;
  const latestRef = db.doc(
    `businesses/${businessId}/settings/accounting/exchangeRateReference/latest`,
  );
  const historyRef = latestRef.collection('history');

  const [latestSnap, historyDocsCount] = await Promise.all([
    latestRef.get(),
    countOrDeleteCollectionDocs(historyRef),
  ]);

  const matched = latestSnap.exists || historyDocsCount > 0;

  if (!matched) {
    return {
      businessId,
      businessName: resolveBusinessName(businessDoc.data()),
      matched: false,
      latestDeleted: 0,
      historyDeleted: 0,
    };
  }

  if (writeMode && latestSnap.exists) {
    await latestRef.delete();
  }

  return {
    businessId,
    businessName: resolveBusinessName(businessDoc.data()),
    matched: true,
    latestDeleted: writeMode && latestSnap.exists ? 1 : 0,
    historyDeleted: writeMode ? historyDocsCount : 0,
    latestFound: latestSnap.exists ? 1 : 0,
    historyFound: historyDocsCount,
  };
};

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    businessIdFilter: businessIdFilter || null,
    scannedBusinesses: 0,
    matchedBusinesses: 0,
    latestDocsFound: 0,
    historyDocsFound: 0,
    latestDocsDeleted: 0,
    historyDocsDeleted: 0,
    samples: [],
  };

  const sampleLimit = 20;

  if (businessIdFilter) {
    const businessDoc = await db.doc(`businesses/${businessIdFilter}`).get();

    if (!businessDoc.exists) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            ...stats,
            scannedBusinesses: 0,
            notFoundBusinessId: businessIdFilter,
          },
          null,
          2,
        ),
      );
      return;
    }

    stats.scannedBusinesses = 1;
    const result = await inspectAndCleanupBusiness(businessDoc);

    if (result.matched) {
      stats.matchedBusinesses += 1;
      stats.latestDocsFound += result.latestFound || 0;
      stats.historyDocsFound += result.historyFound || 0;
      stats.latestDocsDeleted += result.latestDeleted || 0;
      stats.historyDocsDeleted += result.historyDeleted || 0;
      stats.samples.push({
        businessId: result.businessId,
        businessName: result.businessName,
        latestFound: result.latestFound || 0,
        historyFound: result.historyFound || 0,
      });
    }
  } else {
    let lastDoc = null;

    while (true) {
      let query = db
        .collection('businesses')
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(pageSize);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        break;
      }

      for (const businessDoc of snapshot.docs) {
        stats.scannedBusinesses += 1;

        if (limit && stats.scannedBusinesses > limit) {
          break;
        }

        const result = await inspectAndCleanupBusiness(businessDoc);
        if (!result.matched) {
          continue;
        }

        stats.matchedBusinesses += 1;
        stats.latestDocsFound += result.latestFound || 0;
        stats.historyDocsFound += result.historyFound || 0;
        stats.latestDocsDeleted += result.latestDeleted || 0;
        stats.historyDocsDeleted += result.historyDeleted || 0;

        if (stats.samples.length < sampleLimit) {
          stats.samples.push({
            businessId: result.businessId,
            businessName: result.businessName,
            latestFound: result.latestFound || 0,
            historyFound: result.historyFound || 0,
          });
        }
      }

      if (limit && stats.scannedBusinesses >= limit) {
        break;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.size < pageSize) {
        break;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        scannedAt: new Date().toISOString(),
        ...stats,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[cleanupBusinessExchangeRateReference] failed:', error);
  process.exit(1);
});
