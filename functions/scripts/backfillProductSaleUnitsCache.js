/*
  Script: backfillProductSaleUnitsCache.js

  Purpose:
    Materializa products.saleUnits desde la subcoleccion legacy
    products/{productId}/saleUnits solo cuando el producto no tiene
    saleUnits embebido. Dry-run por defecto.

  Uso (PowerShell):
    node functions/scripts/backfillProductSaleUnitsCache.js --projectId ventamaxpos --businessId <id> --dry-run
    node functions/scripts/backfillProductSaleUnitsCache.js --projectId ventamaxpos --businessId <id> --write
    node functions/scripts/backfillProductSaleUnitsCache.js --projectId ventamaxpos --businessId <id> --productId <id> --dry-run
    node functions/scripts/backfillProductSaleUnitsCache.js --projectId ventamaxpos --businessId <id> --limit 100 --dry-run
*/

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import admin from 'firebase-admin';

import {
  buildSaleUnitsCacheBackfill,
} from '../src/app/modules/products/utils/saleUnitsCacheBackfill.util.js';

const SCRIPT_NAME = 'backfillProductSaleUnitsCache';

const usage = `
Usage:
  node functions/scripts/backfillProductSaleUnitsCache.js --projectId <id> --businessId <id> [--dry-run|--write] [--productId <id>] [--limit <n>] [--service-account <path>]

Notes:
  --dry-run es el modo por defecto.
  --write aplica los cambios planeados.
  Solo copia desde subcoleccion cuando products.saleUnits esta vacio.
`;

const getFlag = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const hasFlag = (args, name) => args.includes(name);

const hasOption = (args, name) =>
  hasFlag(args, name) || args.some((item) => item.startsWith(`${name}=`));

const readPositiveInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const loadServiceAccountCredential = (serviceAccountPath) => {
  const resolvedPath = path.resolve(serviceAccountPath);
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  return admin.credential.cert(JSON.parse(raw));
};

const initializeFirestore = ({ projectId, serviceAccountPath }) => {
  const options = {};
  if (projectId) options.projectId = projectId;
  if (serviceAccountPath) {
    options.credential = loadServiceAccountCredential(serviceAccountPath);
  }
  admin.initializeApp(Object.keys(options).length ? options : undefined);
  return admin.firestore();
};

const readProductSnapshots = async (db, { businessId, productId, limit }) => {
  if (productId) {
    const snap = await db
      .doc(`businesses/${businessId}/products/${productId}`)
      .get();
    return snap.exists ? [snap] : [];
  }

  let query = db.collection(`businesses/${businessId}/products`);
  if (limit) query = query.limit(limit);
  const snapshot = await query.get();
  return snapshot.docs;
};

const readSubcollectionSaleUnits = async (productSnap) => {
  const snapshot = await productSnap.ref.collection('saleUnits').get();
  return snapshot.docs.map((saleUnitDoc) => ({
    id: saleUnitDoc.id,
    ...saleUnitDoc.data(),
  }));
};

export const backfillProductSaleUnitsCache = async (
  db,
  { businessId, productId = null, limit = null, dryRun = true },
) => {
  const productSnapshots = await readProductSnapshots(db, {
    businessId,
    productId,
    limit,
  });

  const summary = {
    mode: dryRun ? 'dry-run' : 'write',
    businessId,
    productId,
    scanned: productSnapshots.length,
    plannedUpdates: 0,
    writtenUpdates: 0,
    skipped: {
      embedded_sale_units_present: 0,
      no_valid_subcollection_sale_units: 0,
    },
    countRepairs: 0,
    invalidUnits: 0,
    duplicateIds: [],
    updatedProducts: [],
  };
  const plannedWrites = [];

  for (const productSnap of productSnapshots) {
    const subcollectionSaleUnits = await readSubcollectionSaleUnits(productSnap);
    const plan = buildSaleUnitsCacheBackfill({
      product: productSnap.data(),
      subcollectionSaleUnits,
    });

    summary.invalidUnits += plan.invalidUnits.length;
    summary.duplicateIds.push(
      ...plan.duplicateIds.map((saleUnitId) => ({
        productId: productSnap.id,
        saleUnitId,
      })),
    );

    if (!plan.shouldUpdate) {
      summary.skipped[plan.reason] =
        (summary.skipped[plan.reason] ?? 0) + 1;
      continue;
    }

    summary.plannedUpdates += 1;
    if (plan.reason === 'sale_units_count_mismatch') {
      summary.countRepairs += 1;
    }

    summary.updatedProducts.push({
      productId: productSnap.id,
      reason: plan.reason,
      saleUnitsCount: plan.patch.saleUnitsCount ?? null,
      subcollectionCount: plan.subcollectionCount,
    });

    if (!dryRun) {
      plannedWrites.push({
        ref: productSnap.ref,
        patch: plan.patch,
      });
    }
  }

  if (!dryRun) {
    if (summary.invalidUnits > 0 || summary.duplicateIds.length > 0) {
      throw new Error(
        'Backfill detenido: revise invalidUnits/duplicateIds antes de ejecutar --write.',
      );
    }

    for (const plannedWrite of plannedWrites) {
      await plannedWrite.ref.update({
        ...plannedWrite.patch,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      summary.writtenUpdates += 1;
    }
  }

  return summary;
};

export const parseBackfillProductSaleUnitsCacheOptions = (args) => {
  const businessId = getFlag(args, '--businessId');
  const projectId = getFlag(args, '--projectId');
  const productId = getFlag(args, '--productId');
  const serviceAccountPath = getFlag(args, '--service-account');
  const rawLimit = getFlag(args, '--limit');
  const limit = rawLimit == null ? null : readPositiveInteger(rawLimit);
  const dryRun = !hasFlag(args, '--write') || hasFlag(args, '--dry-run');

  if (hasOption(args, '--limit') && limit == null) {
    throw new Error('--limit debe ser un entero positivo.');
  }

  return {
    businessId,
    projectId,
    productId,
    serviceAccountPath,
    limit,
    dryRun,
  };
};

const main = async () => {
  const args = process.argv.slice(2);
  if (hasFlag(args, '--help') || hasFlag(args, '-h')) {
    console.log(usage.trim());
    return;
  }

  const {
    businessId,
    projectId,
    productId,
    serviceAccountPath,
    limit,
    dryRun,
  } = parseBackfillProductSaleUnitsCacheOptions(args);

  if (!businessId) {
    throw new Error(
      'Debe indicar --businessId <id>. Dry-run por defecto; use --write para escribir.',
    );
  }

  const db = initializeFirestore({ projectId, serviceAccountPath });
  const summary = await backfillProductSaleUnitsCache(db, {
    businessId,
    productId,
    limit,
    dryRun,
  });

  console.log(JSON.stringify(summary, null, 2));
  if (dryRun) {
    console.log(`[${SCRIPT_NAME}] Dry-run only. Pass --write to persist.`);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(`[${SCRIPT_NAME}] ERROR`, error);
    process.exitCode = 1;
  });
}
