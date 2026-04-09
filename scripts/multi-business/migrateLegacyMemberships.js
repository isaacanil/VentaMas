#!/usr/bin/env node
/* eslint-env node */
/* global console */

import process from 'node:process';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldPath, FieldValue, getFirestore } from 'firebase-admin/firestore';

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;
const BATCH_WRITE_LIMIT = 400;

const ROLE_VALUES = new Set([
  'owner',
  'admin',
  'manager',
  'cashier',
  'buyer',
  'dev',
]);
const INACTIVE_STATUSES = new Set(['inactive', 'suspended', 'revoked']);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeRole = (value, fallback = 'cashier') => {
  const normalized = toCleanString(value)?.toLowerCase() || null;
  if (!normalized) return fallback;
  if (ROLE_VALUES.has(normalized)) return normalized;
  return fallback;
};

const normalizeStatus = (value, active = undefined) => {
  const normalized = toCleanString(value)?.toLowerCase() || null;
  if (normalized) return normalized;
  if (active === false) return 'inactive';
  return 'active';
};

const parseArgs = (argv) => {
  const args = {
    dryRun: false,
    writeUserCache: true,
    limit: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    startAfter: null,
  };

  for (const token of argv.slice(2)) {
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--no-write-user-cache') {
      args.writeUserCache = false;
      continue;
    }
    if (token.startsWith('--limit=')) {
      args.limit = Math.max(0, Number(token.split('=')[1]) || 0);
      continue;
    }
    if (token.startsWith('--page-size=')) {
      const pageSize = Math.max(1, Number(token.split('=')[1]) || DEFAULT_PAGE_SIZE);
      args.pageSize = Math.min(pageSize, MAX_PAGE_SIZE);
      continue;
    }
    if (token.startsWith('--start-after=')) {
      args.startAfter = toCleanString(token.split('=')[1]);
      continue;
    }
  }

  return args;
};

const toSortedMembershipEntries = (entries) => {
  return [...entries].sort((a, b) => {
    if (a.businessId === b.businessId) {
      if (a.status === b.status) return a.role.localeCompare(b.role);
      return a.status.localeCompare(b.status);
    }
    return a.businessId.localeCompare(b.businessId);
  });
};

const collectMembershipEntries = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  const byBusiness = new Map();

  const registerEntry = (rawEntry, fallbackRole) => {
    const entry = asRecord(rawEntry);
    const businessNode = asRecord(entry.business);
    const businessId =
      toCleanString(entry.businessId) ||
      toCleanString(entry.businessID) ||
      toCleanString(businessNode.id) ||
      null;

    if (!businessId) return;

    const role = normalizeRole(entry.role || fallbackRole, 'cashier');
    const status = normalizeStatus(entry.status, entry.active);
    const businessName =
      toCleanString(entry.businessName) ||
      toCleanString(entry.name) ||
      toCleanString(businessNode.name) ||
      null;

    const current = byBusiness.get(businessId) || null;
    const shouldPromoteStatus =
      current && INACTIVE_STATUSES.has(current.status) && !INACTIVE_STATUSES.has(status);

    if (!current || shouldPromoteStatus) {
      byBusiness.set(businessId, { businessId, role, status, businessName });
      return;
    }

    byBusiness.set(businessId, {
      businessId,
      role: current.role || role,
      status: current.status || status,
      businessName: current.businessName || businessName,
    });
  };

  const fallbackRole = normalizeRole(root.role || legacy.role, 'cashier');

  [
    ...toArray(root.accessControl),
    ...toArray(legacy.accessControl),
    ...toArray(root.memberships),
    ...toArray(legacy.memberships),
  ].forEach((entry) => registerEntry(entry, fallbackRole));

  const legacyBusinessId =
    toCleanString(root.businessID) ||
    toCleanString(root.businessId) ||
    toCleanString(legacy.businessID) ||
    toCleanString(legacy.businessId) ||
    null;

  if (legacyBusinessId && !byBusiness.has(legacyBusinessId)) {
    byBusiness.set(legacyBusinessId, {
      businessId: legacyBusinessId,
      role: fallbackRole,
      status: 'active',
      businessName: null,
    });
  }

  return toSortedMembershipEntries(Array.from(byBusiness.values()));
};

const collectPersistedMembershipEntries = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  const fallbackRole = normalizeRole(root.role || legacy.role, 'cashier');

  const entries = [
    ...toArray(root.accessControl),
    ...toArray(legacy.accessControl),
    ...toArray(root.memberships),
    ...toArray(legacy.memberships),
  ].map((entry) => {
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
      role: normalizeRole(item.role || fallbackRole, 'cashier'),
      status: normalizeStatus(item.status, item.active),
      businessName:
        toCleanString(item.businessName) ||
        toCleanString(item.name) ||
        toCleanString(businessNode.name) ||
        null,
    };
  });

  const byBusiness = new Map();
  entries.filter(Boolean).forEach((entry) => {
    if (!entry?.businessId) return;
    byBusiness.set(entry.businessId, entry);
  });
  return toSortedMembershipEntries(Array.from(byBusiness.values()));
};

const serializeEntries = (entries) =>
  JSON.stringify(
    toSortedMembershipEntries(entries).map((entry) => ({
      businessId: entry.businessId,
      role: entry.role,
      status: entry.status,
    })),
  );

const toAccessControlPayload = (entries) =>
  entries.map((entry) => ({
    businessId: entry.businessId,
    role: entry.role,
    status: entry.status,
    ...(entry.businessName ? { businessName: entry.businessName } : {}),
  }));

const toMembershipPayload = (uid, entries) =>
  entries.map((entry) => ({
    uid,
    userId: uid,
    businessId: entry.businessId,
    role: entry.role,
    status: entry.status,
    ...(entry.businessName ? { businessName: entry.businessName } : {}),
    source: 'legacy_migration',
  }));

const printSummary = (summary) => {
  console.log('\nMigration summary');
  console.log(JSON.stringify(summary, null, 2));
};

const app = initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore(app);

const run = async () => {
  const options = parseArgs(process.argv);
  const usersRef = db.collection('users');

  let processedUsers = 0;
  let usersWithLegacyData = 0;
  let canonicalMembershipWrites = 0;
  let canonicalMembershipNoop = 0;
  let userCacheWrites = 0;
  let skippedUsers = 0;
  let page = 0;
  let cursor = options.startAfter;

  let batch = db.batch();
  let pendingWrites = 0;

  const flushBatch = async () => {
    if (options.dryRun || pendingWrites === 0) return;
    await batch.commit();
    batch = db.batch();
    pendingWrites = 0;
  };

  const queueSet = (ref, payload, merge = true) => {
    batch.set(ref, payload, { merge });
    pendingWrites += 1;
  };

  const shouldStop = () => {
    if (!options.limit) return false;
    return processedUsers >= options.limit;
  };

  while (true) {
    let query = usersRef.orderBy(FieldPath.documentId()).limit(options.pageSize);
    if (cursor) {
      query = query.startAfter(cursor);
    }

    const pageSnap = await query.get();
    if (pageSnap.empty) break;
    page += 1;

    for (const userDoc of pageSnap.docs) {
      if (shouldStop()) break;

      processedUsers += 1;
      cursor = userDoc.id;
      const userData = userDoc.data() || {};
      const memberships = collectMembershipEntries(userData);

      if (!memberships.length) {
        skippedUsers += 1;
        continue;
      }

      usersWithLegacyData += 1;

      for (const membership of memberships) {
        const memberRef = db.doc(
          `businesses/${membership.businessId}/members/${userDoc.id}`,
        );
        const memberSnap = await memberRef.get();
        const existingData = memberSnap.exists ? memberSnap.data() || {} : {};
        const existingRole = normalizeRole(existingData.role, 'cashier');
        const existingStatus = normalizeStatus(existingData.status);
        const existingUserId =
          toCleanString(existingData.userId) || toCleanString(existingData.uid);

        const needsWrite =
          !memberSnap.exists ||
          existingRole !== membership.role ||
          existingStatus !== membership.status ||
          existingUserId !== userDoc.id;

        if (!needsWrite) {
          canonicalMembershipNoop += 1;
          continue;
        }

        canonicalMembershipWrites += 1;

        if (!options.dryRun) {
          const payload = {
            uid: userDoc.id,
            userId: userDoc.id,
            businessId: membership.businessId,
            role: membership.role,
            status: membership.status,
            source: 'legacy_migration',
            migratedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (!memberSnap.exists) {
            payload.createdAt = FieldValue.serverTimestamp();
          }
          queueSet(memberRef, payload, true);
          if (pendingWrites >= BATCH_WRITE_LIMIT) {
            await flushBatch();
          }
        }
      }

      if (!options.writeUserCache) {
        continue;
      }

      const desiredSerialized = serializeEntries(memberships);
      const persistedEntries = collectPersistedMembershipEntries(userData);
      const persistedSerialized = serializeEntries(persistedEntries);
      const needsUserCachePatch = desiredSerialized !== persistedSerialized;

      if (!needsUserCachePatch) {
        continue;
      }

      userCacheWrites += 1;

      if (!options.dryRun) {
        const accessControlPayload = toAccessControlPayload(memberships);
        const membershipsPayload = toMembershipPayload(userDoc.id, memberships);

        queueSet(
          userDoc.ref,
          {
            accessControl: accessControlPayload,
            memberships: membershipsPayload,
            'user.accessControl': accessControlPayload,
            'user.memberships': membershipsPayload,
            updatedAt: FieldValue.serverTimestamp(),
            'user.updatedAt': FieldValue.serverTimestamp(),
          },
          true,
        );
        if (pendingWrites >= BATCH_WRITE_LIMIT) {
          await flushBatch();
        }
      }
    }

    if (shouldStop()) break;
    console.log(
      `Processed page ${page} (cursor: ${cursor || 'none'}, users: ${processedUsers})`,
    );
  }

  await flushBatch();

  printSummary({
    dryRun: options.dryRun,
    writeUserCache: options.writeUserCache,
    processedUsers,
    usersWithLegacyData,
    skippedUsers,
    canonicalMembershipWrites,
    canonicalMembershipNoop,
    userCacheWrites,
    lastCursor: cursor,
  });
};

run().catch((error) => {
  console.error('Migration failed');
  console.error(error);
  process.exitCode = 1;
});
