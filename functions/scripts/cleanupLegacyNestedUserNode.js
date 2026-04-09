/*
  Script: cleanupLegacyNestedUserNode.js

  Purpose:
    Remove the legacy nested `user` field from `users/{uid}` documents after
    root fields have been normalized.

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/cleanupLegacyNestedUserNode.js --dry-run
    node functions/scripts/cleanupLegacyNestedUserNode.js --write

  Flags:
    --dry-run            Default mode (no writes).
    --write              Apply writes.
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

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;
const SAMPLE_SIZE = 20;

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

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
    'Usage: node functions/scripts/cleanupLegacyNestedUserNode.js [--dry-run|--write] [--uid <id>] [--limit <n>] [--page-size <n>] [--start-after <id>]',
  );
  process.exit(0);
}

if (dryRun) {
  console.log(
    '[cleanupLegacyNestedUserNode] Running in DRY-RUN mode (pass --write to apply changes).',
  );
}

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    uidFilter: uidFilter || null,
    scannedUsers: 0,
    usersWithNestedUserField: 0,
    usersPatched: 0,
    nestedObjects: 0,
    nestedNonObjects: 0,
    nestedEmptyObjects: 0,
    usersSkippedByFilter: 0,
    samples: {
      toDelete: [],
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
      .orderBy(admin.firestore.FieldPath.documentId())
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

      const root = userDoc.data() || {};
      if (!Object.prototype.hasOwnProperty.call(root, 'user')) {
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      stats.usersWithNestedUserField += 1;

      const nestedUser = root.user;
      const nestedRecord = asRecord(nestedUser);
      if (Object.keys(nestedRecord).length > 0) {
        stats.nestedObjects += 1;
      } else if (
        nestedUser &&
        typeof nestedUser === 'object' &&
        !Array.isArray(nestedUser)
      ) {
        stats.nestedEmptyObjects += 1;
      } else {
        stats.nestedNonObjects += 1;
      }

      pushSample(stats.samples.toDelete, {
        uid,
        nestedType: Array.isArray(nestedUser) ? 'array' : typeof nestedUser,
        nestedKeys:
          nestedRecord && Object.keys(nestedRecord).length
            ? Object.keys(nestedRecord).slice(0, 12)
            : [],
      });

      if (!dryRun) {
        await userDoc.ref.set(
          {
            user: admin.firestore.FieldValue.delete(),
          },
          { merge: true },
        );
      }

      stats.usersPatched += 1;

      if (limit && stats.scannedUsers >= limit) break;
    }

    if (limit && stats.scannedUsers >= limit) break;
    lastDoc = pageSnap.docs[pageSnap.docs.length - 1];
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        scannedAt: new Date().toISOString(),
        stats,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[cleanupLegacyNestedUserNode] failed:', error);
  process.exitCode = 1;
});

