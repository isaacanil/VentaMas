/*
  Script: backfillUserMembershipCacheFromCanonical.js

  Purpose:
    Backfill users/{uid}.accessControl + memberships from canonical docs:
      businesses/{businessId}/members/{uid}

    This is a preparation step for legacy cleanup. It keeps legacy fields
    (businessID/role) intact and only fills normalized cache + active context.

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/backfillUserMembershipCacheFromCanonical.js --dry-run
    node functions/scripts/backfillUserMembershipCacheFromCanonical.js --write

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
const INACTIVE_STATUSES = new Set(['inactive', 'suspended', 'revoked']);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeStatus = (value, active = undefined) => {
  const normalized = toCleanString(value)?.toLowerCase();
  if (normalized) return normalized;
  if (active === false) return 'inactive';
  return 'active';
};

const normalizeRole = (value) => {
  const normalized = toCleanString(value)?.toLowerCase();
  if (!normalized) return 'cashier';
  if (normalized === 'specialcashier1' || normalized === 'specialcashier2') {
    return 'cashier';
  }
  if (
    normalized === 'superadmin' ||
    normalized === 'super-admin' ||
    normalized === 'super_admin'
  ) {
    return 'admin';
  }
  return normalized;
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

const toNormalizedEntry = (entry) => {
  const item = asRecord(entry);
  const businessNode = asRecord(item.business);
  const businessId =
    toCleanString(item.businessId) ||
    toCleanString(item.businessID) ||
    toCleanString(businessNode.id) ||
    null;
  if (!businessId) return null;
  return {
    businessId,
    role: normalizeRole(item.role),
    status: normalizeStatus(item.status, item.active),
  };
};

const collectReferencedBusinessIds = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  const ids = new Set();

  [
    root.activeBusinessId,
    root.defaultBusinessId,
    root.lastSelectedBusinessId,
    root.businessID,
    root.businessId,
    legacy.activeBusinessId,
    legacy.defaultBusinessId,
    legacy.lastSelectedBusinessId,
    legacy.businessID,
    legacy.businessId,
  ]
    .map(toCleanString)
    .filter(Boolean)
    .forEach((businessId) => ids.add(businessId));

  const collectFromEntries = (entries) => {
    for (const rawEntry of toArray(entries)) {
      const entry = asRecord(rawEntry);
      const businessNode = asRecord(entry.business);
      const businessId =
        toCleanString(entry.businessId) ||
        toCleanString(entry.businessID) ||
        toCleanString(businessNode.id) ||
        null;
      if (businessId) ids.add(businessId);
    }
  };

  collectFromEntries(root.accessControl);
  collectFromEntries(legacy.accessControl);
  collectFromEntries(root.memberships);
  collectFromEntries(legacy.memberships);

  return Array.from(ids);
};

const serializeEntries = (entries) =>
  JSON.stringify(
    [...entries]
      .map((entry) => ({
        businessId: entry.businessId,
        role: normalizeRole(entry.role),
        status: normalizeStatus(entry.status),
      }))
      .sort((a, b) => a.businessId.localeCompare(b.businessId)),
  );

const pushSample = (bucket, value) => {
  if (bucket.length >= SAMPLE_SIZE) return;
  bucket.push(value);
};

const collectExistingCacheEntries = (userData) => {
  const root = asRecord(userData);
  const rootAccessControl = toArray(root.accessControl);
  const membershipsFallback = rootAccessControl.length ? [] : toArray(root.memberships);
  const entries = [
    ...rootAccessControl,
    ...membershipsFallback,
  ]
    .map(toNormalizedEntry)
    .filter(Boolean);

  const byBusiness = new Map();
  for (const entry of entries) {
    byBusiness.set(entry.businessId, entry);
  }
  return Array.from(byBusiness.values());
};

const isActiveEntry = (entry) => !INACTIVE_STATUSES.has(normalizeStatus(entry?.status));

const resolvePreferredBusinessId = (userData) => {
  const root = asRecord(userData);
  return (
    toCleanString(root.activeBusinessId) ||
    toCleanString(root.lastSelectedBusinessId) ||
    toCleanString(root.defaultBusinessId) ||
    null
  );
};

const chooseActiveContext = (entries, preferredBusinessId) => {
  if (!entries.length) return { businessId: null, role: null };
  const activeEntries = entries.filter(isActiveEntry);
  const source = activeEntries.length ? activeEntries : entries;

  if (preferredBusinessId) {
    const preferred = source.find((entry) => entry.businessId === preferredBusinessId);
    if (preferred) {
      return { businessId: preferred.businessId, role: normalizeRole(preferred.role) };
    }
  }

  const first = source[0];
  return {
    businessId: first.businessId,
    role: normalizeRole(first.role),
  };
};

const getCanonicalMembershipEntries = async (uid, userData) => {
  const byBusiness = new Map();
  const candidateBusinessIds = collectReferencedBusinessIds(userData);
  if (!candidateBusinessIds.length) {
    return [];
  }

  const memberRefs = candidateBusinessIds.map((businessId) =>
    db.doc(`businesses/${businessId}/members/${uid}`),
  );
  const memberSnaps = await db.getAll(...memberRefs);

  for (let index = 0; index < candidateBusinessIds.length; index += 1) {
    const businessId = candidateBusinessIds[index];
    const snap = memberSnaps[index];
    if (!snap?.exists) continue;

    const data = snap.data() || {};
    const incoming = {
      businessId,
      role: normalizeRole(data.role),
      status: normalizeStatus(data.status, data.active),
    };
    byBusiness.set(businessId, incoming);
  }

  return Array.from(byBusiness.values()).sort((a, b) =>
    a.businessId.localeCompare(b.businessId),
  );
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
    'Usage: node functions/scripts/backfillUserMembershipCacheFromCanonical.js [--dry-run|--write] [--uid <id>] [--limit <n>] [--page-size <n>] [--start-after <id>]',
  );
  process.exit(0);
}

if (dryRun) {
  console.log(
    '[backfillUserMembershipCacheFromCanonical] Running in DRY-RUN mode (pass --write to apply changes).',
  );
}

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    uidFilter: uidFilter || null,
    scannedUsers: 0,
    usersWithCanonicalMemberships: 0,
    usersWithoutCanonicalMemberships: 0,
    usersCacheUpToDate: 0,
    usersPatched: 0,
    usersPatchedActiveContext: 0,
    usersSkippedByFilter: 0,
    samples: {
      patched: [],
      withoutCanonicalMemberships: [],
    },
  };

  const emitPatch = async (userRef, payload) => {
    if (dryRun) return;
    await userRef.set(payload, { merge: true });
  };

  let lastDoc = null;
  if (startAfterId) {
    const snap = await db.doc(`users/${startAfterId}`).get();
    if (snap.exists) {
      lastDoc = snap;
    }
  }

  while (true) {
    let query = db
      .collection('users')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

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

      const userData = userDoc.data() || {};
      const canonicalEntries = await getCanonicalMembershipEntries(uid, userData);

      if (!canonicalEntries.length) {
        stats.usersWithoutCanonicalMemberships += 1;
        pushSample(stats.samples.withoutCanonicalMemberships, uid);
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      stats.usersWithCanonicalMemberships += 1;

      const existingEntries = collectExistingCacheEntries(userData);
      const desiredSerialized = serializeEntries(canonicalEntries);
      const existingSerialized = serializeEntries(existingEntries);
      const needsCachePatch = desiredSerialized !== existingSerialized;

      const preferredBusinessId = resolvePreferredBusinessId(userData);
      const desiredActive = chooseActiveContext(canonicalEntries, preferredBusinessId);
      const currentActiveBusinessId =
        toCleanString(userData.activeBusinessId) || null;
      const currentActiveRole =
        toCleanString(userData.activeRole) || null;

      const needsActivePatch =
        desiredActive.businessId &&
        (currentActiveBusinessId !== desiredActive.businessId ||
          normalizeRole(currentActiveRole) !== normalizeRole(desiredActive.role));

      if (!needsCachePatch && !needsActivePatch) {
        stats.usersCacheUpToDate += 1;
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      const accessControlPayload = canonicalEntries.map((entry) => ({
        businessId: entry.businessId,
        role: normalizeRole(entry.role),
        status: normalizeStatus(entry.status),
      }));

      const patch = {
        ...(needsCachePatch
          ? {
            accessControl: accessControlPayload,
          }
          : {}),
        ...(needsActivePatch && desiredActive.businessId
          ? {
            activeBusinessId: desiredActive.businessId,
            lastSelectedBusinessId:
                toCleanString(userData.lastSelectedBusinessId) ||
                desiredActive.businessId,
            activeRole: normalizeRole(desiredActive.role),
          }
          : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await emitPatch(userDoc.ref, patch);
      stats.usersPatched += 1;
      if (needsActivePatch) stats.usersPatchedActiveContext += 1;
      pushSample(stats.samples.patched, uid);

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
  console.error('[backfillUserMembershipCacheFromCanonical] failed:', error);
  process.exitCode = 1;
});
