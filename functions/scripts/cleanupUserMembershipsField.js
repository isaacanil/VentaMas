/*
  Script: cleanupUserMembershipsField.js

  Purpose:
    Remove deprecated `users/{uid}.memberships` cache after migrating runtime
    readers/writers to use `accessControl` as the single user-level membership
    cache (canonical source remains `businesses/{businessId}/members/{uid}`).

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/cleanupUserMembershipsField.js --dry-run
    node functions/scripts/cleanupUserMembershipsField.js --write
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

if (dryRun) {
  console.log(
    '[cleanupUserMembershipsField] Running in DRY-RUN mode (pass --write to apply changes).',
  );
}

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    uidFilter: uidFilter || null,
    scannedUsers: 0,
    usersWithMembershipsField: 0,
    usersPatched: 0,
    usersSkippedByFilter: 0,
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

      const data = userDoc.data() || {};
      if (!Object.prototype.hasOwnProperty.call(data, 'memberships')) {
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      stats.usersWithMembershipsField += 1;
      pushSample(stats.samples.patched, {
        uid,
        type: Array.isArray(data.memberships) ? 'array' : typeof data.memberships,
        length: Array.isArray(data.memberships) ? data.memberships.length : null,
      });

      if (!dryRun) {
        await userDoc.ref.set(
          {
            memberships: admin.firestore.FieldValue.delete(),
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
  console.error('[cleanupUserMembershipsField] failed:', error);
  process.exitCode = 1;
});

