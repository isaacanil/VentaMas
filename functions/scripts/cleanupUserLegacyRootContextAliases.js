/*
  Script: cleanupUserLegacyRootContextAliases.js

  Purpose:
    Remove deprecated root aliases from `users/{uid}`:
      - role        (duplicate of activeRole)
      - businessID  (duplicate of activeBusinessId)
      - businessId  (duplicate of activeBusinessId)

    Canonical fields kept:
      - activeRole
      - activeBusinessId
      - lastSelectedBusinessId

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/cleanupUserLegacyRootContextAliases.js --dry-run
    node functions/scripts/cleanupUserLegacyRootContextAliases.js --write
*/

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { FieldValue, FieldPath } = admin.firestore;

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;
const SAMPLE_SIZE = 20;

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeRole = (value) => {
  const role = toCleanString(value);
  return role ? role.toLowerCase() : null;
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
    '[cleanupUserLegacyRootContextAliases] Running in DRY-RUN mode (pass --write to apply changes).',
  );
}

const hasOwn = (obj, key) =>
  !!obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key);

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    uidFilter: uidFilter || null,
    scannedUsers: 0,
    usersWithLegacyAliases: 0,
    usersPatched: 0,
    usersSkippedByFilter: 0,
    usersSkippedMissingCanonical: 0,
    aliasCounts: {
      role: 0,
      businessID: 0,
      businessId: 0,
    },
    mismatches: {
      roleVsActiveRole: 0,
      businessIDVsActiveBusinessId: 0,
      businessIdVsActiveBusinessId: 0,
    },
    samples: {
      patched: [],
      skippedMissingCanonical: [],
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
      const hasRoleAlias = hasOwn(data, 'role');
      const hasBusinessIDAlias = hasOwn(data, 'businessID');
      const hasBusinessIdAlias = hasOwn(data, 'businessId');

      if (!hasRoleAlias && !hasBusinessIDAlias && !hasBusinessIdAlias) {
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      stats.usersWithLegacyAliases += 1;
      if (hasRoleAlias) stats.aliasCounts.role += 1;
      if (hasBusinessIDAlias) stats.aliasCounts.businessID += 1;
      if (hasBusinessIdAlias) stats.aliasCounts.businessId += 1;

      const activeRole = normalizeRole(data.activeRole);
      const aliasRole = normalizeRole(data.role);
      const activeBusinessId = toCleanString(data.activeBusinessId);
      const aliasBusinessID = toCleanString(data.businessID);
      const aliasBusinessId = toCleanString(data.businessId);

      if (hasRoleAlias && aliasRole !== activeRole) {
        stats.mismatches.roleVsActiveRole += 1;
      }
      if (hasBusinessIDAlias && aliasBusinessID !== activeBusinessId) {
        stats.mismatches.businessIDVsActiveBusinessId += 1;
      }
      if (hasBusinessIdAlias && aliasBusinessId !== activeBusinessId) {
        stats.mismatches.businessIdVsActiveBusinessId += 1;
      }

      const canDeleteRole = !hasRoleAlias || hasOwn(data, 'activeRole');
      const canDeleteBusinessAliases =
        (!hasBusinessIDAlias && !hasBusinessIdAlias) || hasOwn(data, 'activeBusinessId');

      if (!canDeleteRole || !canDeleteBusinessAliases) {
        stats.usersSkippedMissingCanonical += 1;
        pushSample(stats.samples.skippedMissingCanonical, {
          uid,
          hasRoleAlias,
          hasBusinessIDAlias,
          hasBusinessIdAlias,
          hasActiveRole: hasOwn(data, 'activeRole'),
          hasActiveBusinessId: hasOwn(data, 'activeBusinessId'),
        });

        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      const patch = {};
      if (hasRoleAlias) patch.role = FieldValue.delete();
      if (hasBusinessIDAlias) patch.businessID = FieldValue.delete();
      if (hasBusinessIdAlias) patch.businessId = FieldValue.delete();

      pushSample(stats.samples.patched, {
        uid,
        removed: Object.keys(patch),
        aliasRole,
        activeRole,
        aliasBusinessID,
        aliasBusinessId,
        activeBusinessId,
      });

      if (!dryRun) {
        await userDoc.ref.set(patch, { merge: true });
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
  console.error('[cleanupUserLegacyRootContextAliases] failed:', error);
  process.exitCode = 1;
});

