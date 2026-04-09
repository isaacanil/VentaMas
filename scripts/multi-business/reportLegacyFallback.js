#!/usr/bin/env node
/* eslint-env node */
/* global console */

import process from 'node:process';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;
const SAMPLE_SIZE = 30;

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeRole = (value) => toCleanString(value)?.toLowerCase() || 'cashier';
const normalizeStatus = (value, active = undefined) => {
  const normalized = toCleanString(value)?.toLowerCase();
  if (normalized) return normalized;
  if (active === false) return 'inactive';
  return 'active';
};

const parseArgs = (argv) => {
  const args = {
    limit: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    startAfter: null,
  };

  for (const token of argv.slice(2)) {
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

const collectMembershipCandidates = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  const byBusiness = new Map();
  const fallbackRole = normalizeRole(root.role || legacy.role);

  const register = (rawEntry) => {
    const entry = asRecord(rawEntry);
    const businessNode = asRecord(entry.business);
    const businessId =
      toCleanString(entry.businessId) ||
      toCleanString(entry.businessID) ||
      toCleanString(businessNode.id) ||
      null;
    if (!businessId) return;

    if (byBusiness.has(businessId)) return;
    byBusiness.set(businessId, {
      businessId,
      role: normalizeRole(entry.role || fallbackRole),
      status: normalizeStatus(entry.status, entry.active),
    });
  };

  [
    ...toArray(root.accessControl),
    ...toArray(legacy.accessControl),
    ...toArray(root.memberships),
    ...toArray(legacy.memberships),
  ].forEach(register);

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
    });
  }

  return Array.from(byBusiness.values());
};

const hasLegacyFlatFields = (userData) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);
  return Boolean(
    toCleanString(root.businessID) ||
      toCleanString(root.businessId) ||
      toCleanString(legacy.businessID) ||
      toCleanString(legacy.businessId),
  );
};

const pushSample = (list, value) => {
  if (list.length >= SAMPLE_SIZE) return;
  list.push(value);
};

const app = initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore(app);

const run = async () => {
  const options = parseArgs(process.argv);
  const usersRef = db.collection('users');

  const stats = {
    processedUsers: 0,
    usersWithoutMembershipData: 0,
    usersCanonicalOnly: 0,
    usersHybrid: 0,
    usersLegacyOnly: 0,
    usersNeedingFallbackRead: 0,
    usersNeedingLegacyScopeFallback: 0,
    usersNeedingUserCacheFallback: 0,
    samples: {
      legacyOnly: [],
      fallbackRead: [],
      legacyScopeFallback: [],
      userCacheFallback: [],
    },
    lastCursor: null,
  };

  let cursor = options.startAfter;
  let page = 0;

  const shouldStop = () => options.limit > 0 && stats.processedUsers >= options.limit;

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

      stats.processedUsers += 1;
      cursor = userDoc.id;
      stats.lastCursor = cursor;
      const userData = userDoc.data() || {};
      const candidates = collectMembershipCandidates(userData);
      const legacyFlat = hasLegacyFlatFields(userData);

      if (!candidates.length) {
        stats.usersWithoutMembershipData += 1;
        continue;
      }

      let canonicalFound = 0;
      for (const membership of candidates) {
        const snap = await db
          .doc(`businesses/${membership.businessId}/members/${userDoc.id}`)
          .get();
        if (snap.exists) canonicalFound += 1;
      }

      const hasCanonical = canonicalFound > 0;

      if (!legacyFlat && hasCanonical) {
        stats.usersCanonicalOnly += 1;
      } else if (legacyFlat && hasCanonical) {
        stats.usersHybrid += 1;
      } else if (legacyFlat && !hasCanonical) {
        stats.usersLegacyOnly += 1;
        pushSample(stats.samples.legacyOnly, userDoc.id);
      }

      const canonicalMissing = canonicalFound < candidates.length;
      if (!canonicalMissing) continue;

      stats.usersNeedingFallbackRead += 1;
      pushSample(stats.samples.fallbackRead, userDoc.id);

      const root = asRecord(userData);
      const legacyNode = asRecord(root.user);
      const hasPersistedAccessEntries =
        toArray(root.accessControl).length > 0 ||
        toArray(legacyNode.accessControl).length > 0 ||
        toArray(root.memberships).length > 0 ||
        toArray(legacyNode.memberships).length > 0;

      if (hasPersistedAccessEntries) {
        stats.usersNeedingUserCacheFallback += 1;
        pushSample(stats.samples.userCacheFallback, userDoc.id);
      } else {
        stats.usersNeedingLegacyScopeFallback += 1;
        pushSample(stats.samples.legacyScopeFallback, userDoc.id);
      }
    }

    if (shouldStop()) break;
    console.log(`Processed page ${page} (cursor: ${cursor || 'none'})`);
  }

  console.log('\nLegacy fallback metrics');
  console.log(JSON.stringify(stats, null, 2));
};

run().catch((error) => {
  console.error('Metrics script failed');
  console.error(error);
  process.exitCode = 1;
});
