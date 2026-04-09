/*
  Script: cleanupLegacyBusinessRoleFields.js
  Purpose:
    Remove legacy business/role fields from users/{uid} while preserving
    active context fields required by current auth/session flows.

  Legacy fields removed:
    - businessID
    - businessId
    - role
    - user.businessID
    - user.businessId
    - user.role

  Safety behavior:
    - If activeBusinessId/activeRole are missing, they are backfilled from
      available legacy values before deleting legacy fields.
    - Users with unresolved context are skipped.

  Usage:
    node functions/scripts/cleanupLegacyBusinessRoleFields.js --dry-run
    node functions/scripts/cleanupLegacyBusinessRoleFields.js --write
    node functions/scripts/cleanupLegacyBusinessRoleFields.js --dry-run --limit 5000
    node functions/scripts/cleanupLegacyBusinessRoleFields.js --write --uid <uid>
    node functions/scripts/cleanupLegacyBusinessRoleFields.js --dry-run --service-account C:/path/key.json
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

const args = process.argv.slice(2);

const hasFlag = (flag) => args.includes(flag);
const getFlagValue = (flag) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeRole = (value) => {
  const role = toCleanString(value);
  return role ? role.toLowerCase() : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const writeMode = hasFlag('--write');
const dryRun = !writeMode || hasFlag('--dry-run');
const limitRaw = Number(getFlagValue('--limit') || '5000');
const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.trunc(limitRaw) : 5000;
const uidFilter = toCleanString(getFlagValue('--uid'));
const serviceAccountPath = getFlagValue('--service-account');

if (!dryRun && !writeMode) {
  console.error('Invalid mode. Use --dry-run or --write.');
  process.exit(1);
}

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const json = JSON.parse(raw);
  return admin.credential.cert(json);
};

if (!admin.apps.length) {
  if (serviceAccountPath) {
    admin.initializeApp({
      credential: loadServiceAccountCredential(serviceAccountPath),
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const resolveActiveBusinessId = (root, legacy) =>
  toCleanString(root.activeBusinessId) ||
  toCleanString(legacy.activeBusinessId) ||
  toCleanString(root.lastSelectedBusinessId) ||
  toCleanString(legacy.lastSelectedBusinessId) ||
  toCleanString(root.businessID) ||
  toCleanString(root.businessId) ||
  toCleanString(legacy.businessID) ||
  toCleanString(legacy.businessId) ||
  null;

const resolveActiveRole = (root, legacy) =>
  normalizeRole(root.activeRole) ||
  normalizeRole(legacy.activeRole) ||
  normalizeRole(root.role) ||
  normalizeRole(legacy.role) ||
  null;

const buildPatch = (data) => {
  const root = asRecord(data);
  const legacy = asRecord(root.user);

  const legacyBusinessRoot =
    toCleanString(root.businessID) || toCleanString(root.businessId);
  const legacyBusinessNested =
    toCleanString(legacy.businessID) || toCleanString(legacy.businessId);
  const legacyRoleRoot = normalizeRole(root.role);
  const legacyRoleNested = normalizeRole(legacy.role);

  const hasLegacyBusiness = Boolean(legacyBusinessRoot || legacyBusinessNested);
  const hasLegacyRole = Boolean(legacyRoleRoot || legacyRoleNested);
  const hasLegacyAny = hasLegacyBusiness || hasLegacyRole;

  if (!hasLegacyAny) {
    return { patch: null, reason: 'no-legacy-fields' };
  }

  const resolvedActiveBusinessId = resolveActiveBusinessId(root, legacy);
  const resolvedActiveRole = resolveActiveRole(root, legacy);

  if (hasLegacyBusiness && !resolvedActiveBusinessId) {
    return { patch: null, reason: 'missing-active-business-context' };
  }
  if (hasLegacyRole && !resolvedActiveRole) {
    return { patch: null, reason: 'missing-active-role-context' };
  }

  const patch = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (resolvedActiveBusinessId) {
    if (!toCleanString(root.activeBusinessId)) {
      patch.activeBusinessId = resolvedActiveBusinessId;
    }
  }

  if (resolvedActiveRole) {
    if (!normalizeRole(root.activeRole)) {
      patch.activeRole = resolvedActiveRole;
    }
  }

  if (legacyBusinessRoot) {
    patch.businessID = FieldValue.delete();
    patch.businessId = FieldValue.delete();
  }
  if (legacyRoleRoot) {
    patch.role = FieldValue.delete();
  }

  return {
    patch,
    reason: null,
    preview: {
      activeBusinessId: resolvedActiveBusinessId,
      activeRole: resolvedActiveRole,
      hasLegacyBusiness,
      hasLegacyRole,
    },
  };
};

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    scanned: 0,
    matched: 0,
    patched: 0,
    skipped: 0,
    skipReasons: {},
    samples: [],
  };

  let processed = 0;
  let lastDoc = null;
  let batch = db.batch();
  let batchOps = 0;
  const PAGE_SIZE = 400;

  while (processed < limit) {
    const remaining = limit - processed;
    const pageSize = Math.min(PAGE_SIZE, remaining);

    let query = db
      .collection('users')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const userDoc of snapshot.docs) {
      if (processed >= limit) break;
      processed += 1;
      stats.scanned += 1;

      if (uidFilter && userDoc.id !== uidFilter) {
        continue;
      }

      const data = userDoc.data() || {};
      const { patch, reason, preview } = buildPatch(data);
      if (!patch) {
        stats.skipped += 1;
        stats.skipReasons[reason] = (stats.skipReasons[reason] || 0) + 1;
        continue;
      }

      stats.matched += 1;
      if (stats.samples.length < 25) {
        stats.samples.push({
          uid: userDoc.id,
          activeBusinessId: preview?.activeBusinessId || null,
          activeRole: preview?.activeRole || null,
        });
      }

      if (dryRun) {
        continue;
      }

      batch.set(userDoc.ref, patch, { merge: true });
      batchOps += 1;
      stats.patched += 1;

      if (batchOps >= PAGE_SIZE) {
        await batch.commit();
        batch = db.batch();
        batchOps = 0;
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < pageSize) break;
  }

  if (!dryRun && batchOps > 0) {
    await batch.commit();
  }

  console.log(
    JSON.stringify(
      {
        ...stats,
        patched: dryRun ? 0 : stats.patched,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[cleanupLegacyBusinessRoleFields] failed:', error);
  process.exit(1);
});
