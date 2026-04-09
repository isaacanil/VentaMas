/*
  Script: syncRootCredentialsFromLegacyUser.js

  Purpose:
    Normalize auth credentials to root fields in users/{uid} using legacy
    nested user mirror (`user.password`, `user.passwordChangedAt`) when needed.

    This helps prepare removal of the legacy nested `user` object by ensuring
    password validation can rely on root fields.

  Rules:
    - If root.password is missing and legacy.password exists => copy legacy -> root
    - If root.password differs from legacy.password:
        * If legacy.passwordChangedAt is newer than root.passwordChangedAt => copy legacy -> root
        * If root.passwordChangedAt is newer/equal => keep root
        * If neither side has a usable timestamp => mark conflict, no write
    - If passwords are equal and root.passwordChangedAt missing but legacy has it => copy timestamp

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/syncRootCredentialsFromLegacyUser.js --dry-run
    node functions/scripts/syncRootCredentialsFromLegacyUser.js --write

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

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object') {
    const seconds = Number(value.seconds ?? value._seconds);
    const nanos = Number(value.nanoseconds ?? value._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) {
      return seconds * 1000 + Math.floor((Number.isFinite(nanos) ? nanos : 0) / 1e6);
    }
  }
  return null;
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
    'Usage: node functions/scripts/syncRootCredentialsFromLegacyUser.js [--dry-run|--write] [--uid <id>] [--limit <n>] [--page-size <n>] [--start-after <id>]',
  );
  process.exit(0);
}

if (dryRun) {
  console.log(
    '[syncRootCredentialsFromLegacyUser] Running in DRY-RUN mode (pass --write to apply changes).',
  );
}

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    uidFilter: uidFilter || null,
    scannedUsers: 0,
    usersWithLegacyUser: 0,
    usersWithLegacyPassword: 0,
    usersPatched: 0,
    patchedPassword: 0,
    patchedPasswordChangedAt: 0,
    skippedConflictsNoTimestamps: 0,
    skippedRootPreferred: 0,
    usersSkippedByFilter: 0,
    samples: {
      patched: [],
      conflicts: [],
      rootPreferred: [],
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
      const legacy = asRecord(root.user);
      if (!Object.keys(legacy).length) {
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }
      stats.usersWithLegacyUser += 1;

      const rootPassword = toCleanString(root.password);
      const legacyPassword = toCleanString(legacy.password);
      if (!legacyPassword) {
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }
      stats.usersWithLegacyPassword += 1;

      const rootChangedAtRaw = root.passwordChangedAt || null;
      const legacyChangedAtRaw = legacy.passwordChangedAt || null;
      const rootChangedAtMs = toMillis(rootChangedAtRaw);
      const legacyChangedAtMs = toMillis(legacyChangedAtRaw);

      let patch = null;
      let reason = null;

      const shouldPatchTimestampOnly =
        rootPassword &&
        legacyPassword &&
        rootPassword === legacyPassword &&
        !rootChangedAtRaw &&
        !!legacyChangedAtRaw;

      if (!rootPassword && legacyPassword) {
        patch = {
          password: legacyPassword,
          ...(legacyChangedAtRaw ? { passwordChangedAt: legacyChangedAtRaw } : {}),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        reason = 'missing-root-password';
      } else if (rootPassword && legacyPassword && rootPassword !== legacyPassword) {
        if (
          legacyChangedAtMs &&
          (!rootChangedAtMs || legacyChangedAtMs > rootChangedAtMs)
        ) {
          patch = {
            password: legacyPassword,
            ...(legacyChangedAtRaw ? { passwordChangedAt: legacyChangedAtRaw } : {}),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          reason = 'legacy-password-newer';
        } else if (
          rootChangedAtMs &&
          (!legacyChangedAtMs || rootChangedAtMs >= legacyChangedAtMs)
        ) {
          stats.skippedRootPreferred += 1;
          pushSample(stats.samples.rootPreferred, {
            uid,
            rootPasswordChangedAtMs: rootChangedAtMs,
            legacyPasswordChangedAtMs: legacyChangedAtMs,
          });
        } else {
          stats.skippedConflictsNoTimestamps += 1;
          pushSample(stats.samples.conflicts, {
            uid,
            rootPasswordChangedAtMs: rootChangedAtMs,
            legacyPasswordChangedAtMs: legacyChangedAtMs,
          });
        }
      } else if (shouldPatchTimestampOnly) {
        patch = {
          passwordChangedAt: legacyChangedAtRaw,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        reason = 'missing-root-passwordChangedAt';
      }

      if (patch) {
        if (!dryRun) {
          await userDoc.ref.set(patch, { merge: true });
        }
        stats.usersPatched += 1;
        if (Object.prototype.hasOwnProperty.call(patch, 'password')) {
          stats.patchedPassword += 1;
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'passwordChangedAt')) {
          stats.patchedPasswordChangedAt += 1;
        }
        pushSample(stats.samples.patched, {
          uid,
          reason,
          rootPasswordChangedAtMs: rootChangedAtMs,
          legacyPasswordChangedAtMs: legacyChangedAtMs,
        });
      }

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
  console.error('[syncRootCredentialsFromLegacyUser] failed:', error);
  process.exitCode = 1;
});
