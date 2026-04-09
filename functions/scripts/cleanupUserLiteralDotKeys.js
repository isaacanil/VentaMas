/*
  Script: cleanupUserLiteralDotKeys.js

  Purpose:
    Remove top-level literal keys like "user.accessControl" from users/{uid}
    documents. These keys are accidental artifacts produced by set(..., {merge:true})
    with dotted property names.

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/cleanupUserLiteralDotKeys.js --dry-run
    node functions/scripts/cleanupUserLiteralDotKeys.js --write

  Flags:
    --dry-run            Default mode (no writes).
    --write              Apply deletes.
    --uid <id>           Optional. Process only one user.
    --limit <n>          Optional. Max users to scan.
    --page-size <n>      Optional. Default 200 (max 500).
    --start-after <id>   Optional. Resume pagination after user id.
*/

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { FieldPath, FieldValue } = admin.firestore;

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;
const SAMPLE_SIZE = 20;

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const getFlagValue = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const parsePositiveInt = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : fallback;
};

const pushSample = (bucket, value) => {
  if (bucket.length >= SAMPLE_SIZE) return;
  bucket.push(value);
};

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const dryRun = !shouldWrite || args.includes('--dry-run');
const uidFilter = toCleanString(getFlagValue(args, '--uid'));
const limit = parsePositiveInt(getFlagValue(args, '--limit'), 0);
const pageSize = Math.min(
  MAX_PAGE_SIZE,
  parsePositiveInt(getFlagValue(args, '--page-size'), DEFAULT_PAGE_SIZE),
);
const startAfterId = toCleanString(getFlagValue(args, '--start-after'));

if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: node functions/scripts/cleanupUserLiteralDotKeys.js [--dry-run|--write] [--uid <id>] [--limit <n>] [--page-size <n>] [--start-after <id>]',
  );
  process.exit(0);
}

if (dryRun) {
  console.log(
    '[cleanupUserLiteralDotKeys] Running in DRY-RUN mode (pass --write to apply changes).',
  );
}

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    uidFilter: uidFilter || null,
    scannedUsers: 0,
    usersWithLiteralDotKeys: 0,
    usersPatched: 0,
    usersSkippedByFilter: 0,
    literalKeyCount: 0,
    uniqueKeys: {},
    samples: {
      patched: [],
    },
  };

  let lastDoc = null;
  if (startAfterId) {
    const snap = await db.doc(`users/${startAfterId}`).get();
    if (snap.exists) lastDoc = snap;
  }

  while (true) {
    let query = db
      .collection('users')
      .orderBy(FieldPath.documentId())
      .limit(pageSize);

    if (lastDoc) query = query.startAfter(lastDoc);
    const pageSnap = await query.get();
    if (pageSnap.empty) break;

    for (const userDoc of pageSnap.docs) {
      stats.scannedUsers += 1;
      const uid = userDoc.id;

      if (uidFilter && uid !== uidFilter) {
        stats.usersSkippedByFilter += 1;
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      const data = userDoc.data() || {};
      const literalKeys = Object.keys(data).filter((key) => key.startsWith('user.'));
      if (!literalKeys.length) {
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      stats.usersWithLiteralDotKeys += 1;
      stats.literalKeyCount += literalKeys.length;
      for (const key of literalKeys) {
        stats.uniqueKeys[key] = (stats.uniqueKeys[key] || 0) + 1;
      }

      if (!dryRun) {
        const updateArgs = [];
        for (const key of literalKeys) {
          updateArgs.push(new FieldPath(key), FieldValue.delete());
        }
        if (updateArgs.length) {
          await userDoc.ref.update(...updateArgs);
        }
      }

      stats.usersPatched += 1;
      pushSample(stats.samples.patched, { uid, keys: literalKeys });

      if (limit && stats.scannedUsers >= limit) break;
    }

    if (limit && stats.scannedUsers >= limit) break;
    lastDoc = pageSnap.docs[pageSnap.docs.length - 1];
  }

  const uniqueKeysSorted = Object.fromEntries(
    Object.entries(stats.uniqueKeys).sort((a, b) => a[0].localeCompare(b[0])),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        scannedAt: new Date().toISOString(),
        stats: {
          ...stats,
          uniqueKeys: uniqueKeysSorted,
        },
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[cleanupUserLiteralDotKeys] failed:', error);
  process.exitCode = 1;
});

