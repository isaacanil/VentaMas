/*
  Script: auditLegacyCleanupReadiness.js

  Purpose:
    Audit readiness for legacy user field cleanup:
      - businessID / businessId
      - role / activeRole
      - user.* mirror fields

    This script is read-only. It does not write any data.

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/auditLegacyCleanupReadiness.js --limit 5000

  Flags:
    --limit <n>         Optional. Max users to scan.
    --page-size <n>     Optional. Default 200 (max 500).
    --start-after <id>  Optional. Resume scan after user id.
    --sample-size <n>   Optional. Default 20.
*/

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;
const DEFAULT_SAMPLE_SIZE = 20;

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const getFlagValue = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const parseLimit = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
};

const parsePageSize = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(numeric));
};

const parseSampleSize = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_SAMPLE_SIZE;
  return Math.min(100, Math.floor(numeric));
};

const pushSample = (bucket, value, maxSize) => {
  if (bucket.length >= maxSize) return;
  bucket.push(value);
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
    .forEach((id) => ids.add(id));

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

  return ids;
};

const hasLegacyBusinessFields = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  return Boolean(
    toCleanString(root.businessID) ||
      toCleanString(root.businessId) ||
      toCleanString(legacy.businessID) ||
      toCleanString(legacy.businessId),
  );
};

const hasLegacyRoleFields = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  return Boolean(
    toCleanString(root.role) ||
      toCleanString(root.activeRole) ||
      toCleanString(legacy.role) ||
      toCleanString(legacy.activeRole),
  );
};

const hasUserMirror = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  return Object.keys(legacy).length > 0;
};

const hasMembershipCache = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  return Boolean(
    toArray(root.accessControl).length ||
      toArray(legacy.accessControl).length ||
      toArray(root.memberships).length ||
      toArray(legacy.memberships).length,
  );
};

const args = process.argv.slice(2);
const limit = parseLimit(getFlagValue(args, '--limit'));
const pageSize = parsePageSize(getFlagValue(args, '--page-size'));
const startAfterId = toCleanString(getFlagValue(args, '--start-after'));
const sampleSize = parseSampleSize(getFlagValue(args, '--sample-size'));

if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: node functions/scripts/auditLegacyCleanupReadiness.js [--limit <n>] [--page-size <n>] [--start-after <id>] [--sample-size <n>]',
  );
  process.exit(0);
}

const run = async () => {
  const stats = {
    scannedUsers: 0,
    usersWithoutBusinessReference: 0,
    usersWithBusinessReference: 0,
    usersWithLegacyBusinessFields: 0,
    usersWithLegacyRoleFields: 0,
    usersWithUserMirror: 0,
    usersWithMembershipCache: 0,
    usersWithAnyCanonicalMembership: 0,
    usersWithFullCanonicalCoverage: 0,
    usersWithDanglingBusinessReferences: 0,
    usersNotReadyByData: 0,
    usersReadyByData: 0,
    totalReferencedBusinesses: 0,
    totalExistingBusinesses: 0,
    totalMissingBusinesses: 0,
    totalCanonicalMembershipRefs: 0,
    totalCanonicalMembershipExisting: 0,
    lastCursor: null,
    samples: {
      readyByData: [],
      notReadyByData: [],
      danglingBusinessRefs: [],
      legacyBusinessFields: [],
      legacyRoleFields: [],
    },
  };

  let lastDoc = null;
  if (startAfterId) {
    const startAfterSnap = await db.doc(`users/${startAfterId}`).get();
    if (startAfterSnap.exists) {
      lastDoc = startAfterSnap;
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
      stats.lastCursor = userDoc.id;
      const userData = userDoc.data() || {};

      const referencedBusinesses = Array.from(
        collectReferencedBusinessIds(userData),
      );

      if (!referencedBusinesses.length) {
        stats.usersWithoutBusinessReference += 1;
        if (limit && stats.scannedUsers >= limit) break;
        continue;
      }

      stats.usersWithBusinessReference += 1;
      stats.totalReferencedBusinesses += referencedBusinesses.length;

      const legacyBusinessFields = hasLegacyBusinessFields(userData);
      const legacyRoleFields = hasLegacyRoleFields(userData);
      const userMirror = hasUserMirror(userData);
      const membershipCache = hasMembershipCache(userData);

      if (legacyBusinessFields) {
        stats.usersWithLegacyBusinessFields += 1;
        pushSample(stats.samples.legacyBusinessFields, userDoc.id, sampleSize);
      }
      if (legacyRoleFields) {
        stats.usersWithLegacyRoleFields += 1;
        pushSample(stats.samples.legacyRoleFields, userDoc.id, sampleSize);
      }
      if (userMirror) stats.usersWithUserMirror += 1;
      if (membershipCache) stats.usersWithMembershipCache += 1;

      const businessRefs = referencedBusinesses.map((businessId) =>
        db.doc(`businesses/${businessId}`),
      );
      const businessSnaps =
        businessRefs.length > 0 ? await db.getAll(...businessRefs) : [];

      const existingBusinessIds = [];
      const missingBusinessIds = [];
      for (let i = 0; i < referencedBusinesses.length; i += 1) {
        const businessId = referencedBusinesses[i];
        const snap = businessSnaps[i];
        if (snap?.exists) {
          existingBusinessIds.push(businessId);
        } else {
          missingBusinessIds.push(businessId);
        }
      }

      stats.totalExistingBusinesses += existingBusinessIds.length;
      stats.totalMissingBusinesses += missingBusinessIds.length;

      if (missingBusinessIds.length > 0) {
        stats.usersWithDanglingBusinessReferences += 1;
        pushSample(
          stats.samples.danglingBusinessRefs,
          { uid: userDoc.id, missingBusinessIds },
          sampleSize,
        );
      }

      const memberRefs = existingBusinessIds.map((businessId) =>
        db.doc(`businesses/${businessId}/members/${userDoc.id}`),
      );
      const memberSnaps = memberRefs.length > 0 ? await db.getAll(...memberRefs) : [];
      const canonicalExistingCount = memberSnaps.filter((snap) => snap.exists).length;

      stats.totalCanonicalMembershipRefs += existingBusinessIds.length;
      stats.totalCanonicalMembershipExisting += canonicalExistingCount;

      const hasAnyCanonicalMembership = canonicalExistingCount > 0;
      const hasFullCanonicalCoverage =
        existingBusinessIds.length > 0 &&
        canonicalExistingCount === existingBusinessIds.length;

      if (hasAnyCanonicalMembership) stats.usersWithAnyCanonicalMembership += 1;
      if (hasFullCanonicalCoverage) stats.usersWithFullCanonicalCoverage += 1;

      // Data-level readiness (not code-level readiness).
      const readyByData = hasFullCanonicalCoverage && missingBusinessIds.length === 0;
      if (readyByData) {
        stats.usersReadyByData += 1;
        pushSample(stats.samples.readyByData, userDoc.id, sampleSize);
      } else {
        stats.usersNotReadyByData += 1;
        pushSample(stats.samples.notReadyByData, userDoc.id, sampleSize);
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
        mode: 'read-only',
        scannedAt: new Date().toISOString(),
        options: {
          limit: limit || null,
          pageSize,
          startAfterId: startAfterId || null,
          sampleSize,
        },
        stats,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[auditLegacyCleanupReadiness] failed:', error);
  process.exitCode = 1;
});
