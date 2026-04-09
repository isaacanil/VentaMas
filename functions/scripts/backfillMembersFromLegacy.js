/*
  Script: backfillMembersFromLegacy.js

  Purpose:
    Backfill canonical membership docs:
      businesses/{businessId}/members/{uid}
    based on legacy user fields (users/{uid}.businessID + users/{uid}.role).

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/backfillMembersFromLegacy.js --businessId X63aIFwHzk3r0gmT8w6P --dry-run
    node functions/scripts/backfillMembersFromLegacy.js --businessId X63aIFwHzk3r0gmT8w6P --write

  Flags:
    --businessId <id>   Optional. If omitted, processes all users.
    --dry-run           Default. Prints what would be created.
    --write             Actually writes missing member docs.
    --limit <n>         Optional. Stop after scanning n users.
*/

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const ROLE_ALIASES = new Map([
  ['specialcashier1', 'cashier'],
  ['specialcashier2', 'cashier'],
  ['superadmin', 'admin'],
  ['super-admin', 'admin'],
  ['super_admin', 'admin'],
]);

const normalizeRole = (roleString) => {
  if (typeof roleString !== 'string') return null;
  const trimmed = roleString.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase();
  const compact = normalized.replace(/[\s_-]+/g, '');
  if (ROLE_ALIASES.has(compact)) return ROLE_ALIASES.get(compact);
  if (ROLE_ALIASES.has(normalized)) return ROLE_ALIASES.get(normalized);
  return normalized;
};

const resolveUserBusinessId = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  return (
    toCleanString(root.activeBusinessId) ||
    toCleanString(root.businessID) ||
    toCleanString(root.businessId) ||
    toCleanString(legacy.activeBusinessId) ||
    toCleanString(legacy.businessID) ||
    toCleanString(legacy.businessId) ||
    null
  );
};

const resolveUserRole = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  return (
    normalizeRole(root.activeRole) ||
    normalizeRole(root.role) ||
    normalizeRole(legacy.activeRole) ||
    normalizeRole(legacy.role) ||
    null
  );
};

const getFlagValue = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const parseLimit = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : null;
};

const args = process.argv.slice(2);
const businessIdFilter = toCleanString(getFlagValue(args, '--businessId'));
const shouldWrite = args.includes('--write');
const limit = parseLimit(getFlagValue(args, '--limit'));

if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: node functions/scripts/backfillMembersFromLegacy.js [--businessId <id>] [--dry-run|--write] [--limit <n>]',
  );
  process.exit(0);
}

if (!shouldWrite) {
  console.log('[backfillMembersFromLegacy] Running in DRY-RUN mode (pass --write to apply changes).');
}

const businessExistsCache = new Map();

const ensureBusinessExists = async (businessId) => {
  if (businessExistsCache.has(businessId)) {
    return businessExistsCache.get(businessId);
  }
  const snap = await db.doc(`businesses/${businessId}`).get();
  const exists = snap.exists;
  businessExistsCache.set(businessId, exists);
  return exists;
};

const run = async () => {
  let scanned = 0;
  let matched = 0;
  let created = 0;
  let existing = 0;
  let skippedNoBusiness = 0;
  let skippedBusinessNotFound = 0;

  const samples = [];

  const pageSize = 400;
  let lastDoc = null;

  while (true) {
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
      scanned += 1;
      if (limit && scanned > limit) break;

      const data = userDoc.data() || {};
      const businessId = resolveUserBusinessId(data);
      if (!businessId) {
        skippedNoBusiness += 1;
        continue;
      }
      if (businessIdFilter && businessId !== businessIdFilter) {
        continue;
      }

      matched += 1;

      const businessExists = await ensureBusinessExists(businessId);
      if (!businessExists) {
        skippedBusinessNotFound += 1;
        continue;
      }

      const role = resolveUserRole(data) || 'cashier';
      const memberRef = db.doc(`businesses/${businessId}/members/${userDoc.id}`);
      const memberSnap = await memberRef.get();

      if (memberSnap.exists) {
        existing += 1;
        continue;
      }

      const payload = {
        uid: userDoc.id,
        userId: userDoc.id,
        businessId,
        role,
        status: 'active',
        source: 'legacy_backfill',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (samples.length < 10) {
        samples.push({ uid: userDoc.id, businessId, role });
      }

      if (shouldWrite) {
        await memberRef.set(payload, { merge: true });
      }

      created += 1;
    }

    if (limit && scanned >= limit) break;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: shouldWrite ? 'write' : 'dry-run',
        businessIdFilter: businessIdFilter || null,
        scanned,
        matched,
        created,
        existing,
        skippedNoBusiness,
        skippedBusinessNotFound,
        samples,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[backfillMembersFromLegacy] failed:', error);
  process.exitCode = 1;
});
