/*
  Script: migrateOwnershipAndPlatformDev.js
  Purpose:
    1) Backfill businesses/{businessId}.ownerUid
       - Prefer active member with role == owner
       - Fallback to legacy owners[] arrays
    2) Normalize memberships
       - businesses/{businessId}/members/{uid}: role owner -> admin
    3) Move global dev marker to users/{uid}.platformRoles.dev = true
       - When legacy role markers indicate dev

  Usage:
    node functions/scripts/migrateOwnershipAndPlatformDev.js --dry-run
    node functions/scripts/migrateOwnershipAndPlatformDev.js --write
    node functions/scripts/migrateOwnershipAndPlatformDev.js --write --limit 5000
    node functions/scripts/migrateOwnershipAndPlatformDev.js --dry-run --business <businessId>
    node functions/scripts/migrateOwnershipAndPlatformDev.js --dry-run --service-account C:/path/key.json
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

const isInactiveStatus = (value) => {
  const status = toCleanString(value);
  if (!status) return false;
  const normalized = status.toLowerCase();
  return ['inactive', 'suspended', 'revoked', 'disabled'].includes(normalized);
};

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return admin.credential.cert(JSON.parse(raw));
};

const writeMode = hasFlag('--write');
const dryRun = !writeMode || hasFlag('--dry-run');
const limitRaw = Number(getFlagValue('--limit') || '5000');
const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.trunc(limitRaw) : 5000;
const targetBusinessId = toCleanString(getFlagValue('--business'));
const serviceAccountPath = getFlagValue('--service-account');

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

const resolveLegacyOwners = (businessData) => {
  const root = asRecord(businessData);
  const nestedBusiness = asRecord(root.business);
  const rootOwners = Array.isArray(root.owners) ? root.owners : [];
  const nestedOwners = Array.isArray(nestedBusiness.owners)
    ? nestedBusiness.owners
    : [];

  return [...rootOwners, ...nestedOwners]
    .map((value) => toCleanString(value))
    .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);
};

const resolveOwnerCandidate = (businessData, ownerMemberDocs) => {
  const ownerUid = toCleanString(asRecord(businessData).ownerUid);
  if (ownerUid) {
    return { ownerUid, source: 'ownerUid' };
  }

  const activeOwnerMembers = ownerMemberDocs
    .filter((memberDoc) => !isInactiveStatus(memberDoc.get('status')))
    .map((memberDoc) => {
      const data = memberDoc.data() || {};
      return (
        toCleanString(data.uid) ||
        toCleanString(data.userId) ||
        toCleanString(memberDoc.id)
      );
    })
    .filter((uid, index, array) => Boolean(uid) && array.indexOf(uid) === index);

  if (activeOwnerMembers.length) {
    return { ownerUid: activeOwnerMembers[0], source: 'owner-membership' };
  }

  const legacyOwners = resolveLegacyOwners(businessData);
  if (legacyOwners.length) {
    return { ownerUid: legacyOwners[0], source: 'owners-array' };
  }

  return { ownerUid: null, source: null };
};

const shouldMarkPlatformDev = (userData) => {
  const root = asRecord(userData);
  const nested = asRecord(root.user);

  const legacyRoleSignals = [
    normalizeRole(root.role),
    normalizeRole(nested.role),
    normalizeRole(root.activeRole),
    normalizeRole(nested.activeRole),
  ];

  return legacyRoleSignals.includes('dev');
};

const hasPlatformDev = (userData) => {
  const root = asRecord(userData);
  const nested = asRecord(root.user);
  const rootPlatform = asRecord(root.platformRoles);
  const nestedPlatform = asRecord(nested.platformRoles);
  return rootPlatform.dev === true || nestedPlatform.dev === true;
};

const buildUserDevPatch = (userData) => {
  const root = asRecord(userData);
  const rootPlatform = asRecord(root.platformRoles);
  const rootRole = normalizeRole(root.role);

  const patch = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (shouldMarkPlatformDev(userData) && !hasPlatformDev(userData)) {
    patch.platformRoles = {
      ...rootPlatform,
      dev: true,
    };
  }

  if (rootRole === 'dev') {
    patch.role = FieldValue.delete();
  }
  const changedKeys = Object.keys(patch).filter(
    (key) => !['updatedAt'].includes(key),
  );

  if (!changedKeys.length) {
    return null;
  }

  return patch;
};

const run = async () => {
  const stats = {
    mode: dryRun ? 'dry-run' : 'write',
    businessesScanned: 0,
    businessesPatchedOwnerUid: 0,
    businessesWithNoResolvableOwner: 0,
    ownerUidSource: {
      ownerUid: 0,
      ownerMembership: 0,
      ownersArray: 0,
      none: 0,
    },
    ownerMembersFound: 0,
    ownerMembersNormalized: 0,
    usersScanned: 0,
    usersPatchedPlatformDev: 0,
    usersMarkedPlatformDev: 0,
    usersRemovedLegacyDevRole: 0,
    errors: 0,
    samples: {
      ownerUidPatches: [],
      normalizedMembers: [],
      usersPlatformDev: [],
    },
  };

  let businessQuery = db
    .collection('businesses')
    .orderBy(admin.firestore.FieldPath.documentId());

  if (targetBusinessId) {
    businessQuery = db
      .collection('businesses')
      .where(admin.firestore.FieldPath.documentId(), '==', targetBusinessId);
  } else {
    businessQuery = businessQuery.limit(limit);
  }

  const businessSnapshot = await businessQuery.get();

  let batch = db.batch();
  let batchOps = 0;
  const BATCH_LIMIT = 400;

  const enqueueSet = (ref, payload, options = { merge: true }) => {
    batch.set(ref, payload, options);
    batchOps += 1;
  };

  const enqueueUpdate = (ref, payload) => {
    batch.update(ref, payload);
    batchOps += 1;
  };

  const flushBatch = async () => {
    if (!batchOps || dryRun) {
      batch = db.batch();
      batchOps = 0;
      return;
    }
    await batch.commit();
    batch = db.batch();
    batchOps = 0;
  };

  for (const businessDoc of businessSnapshot.docs) {
    stats.businessesScanned += 1;
    const businessData = businessDoc.data() || {};
    const existingOwnerUid = toCleanString(asRecord(businessData).ownerUid);

    const membersSnapshot = await businessDoc.ref.collection('members').get();
    const ownerMemberDocs = membersSnapshot.docs.filter((memberDoc) => {
      const role = normalizeRole(memberDoc.get('role'));
      return role === 'owner';
    });

    stats.ownerMembersFound += ownerMemberDocs.length;

    const ownerCandidate = resolveOwnerCandidate(businessData, ownerMemberDocs);
    if (ownerCandidate.source === 'ownerUid') {
      stats.ownerUidSource.ownerUid += 1;
    } else if (ownerCandidate.source === 'owner-membership') {
      stats.ownerUidSource.ownerMembership += 1;
    } else if (ownerCandidate.source === 'owners-array') {
      stats.ownerUidSource.ownersArray += 1;
    } else {
      stats.ownerUidSource.none += 1;
    }

    if (!existingOwnerUid && ownerCandidate.ownerUid) {
      const businessPatch = {
        ownerUid: ownerCandidate.ownerUid,
        updatedAt: FieldValue.serverTimestamp(),
        business: {
          ...asRecord(asRecord(businessData).business),
          ownerUid: ownerCandidate.ownerUid,
          updatedAt: FieldValue.serverTimestamp(),
        },
      };

      stats.businessesPatchedOwnerUid += 1;
      if (stats.samples.ownerUidPatches.length < 20) {
        stats.samples.ownerUidPatches.push({
          businessId: businessDoc.id,
          ownerUid: ownerCandidate.ownerUid,
          source: ownerCandidate.source,
        });
      }
      enqueueSet(businessDoc.ref, businessPatch, { merge: true });
    }

    if (!existingOwnerUid && !ownerCandidate.ownerUid) {
      stats.businessesWithNoResolvableOwner += 1;
    }

    for (const ownerMemberDoc of ownerMemberDocs) {
      stats.ownerMembersNormalized += 1;
      if (stats.samples.normalizedMembers.length < 20) {
        stats.samples.normalizedMembers.push({
          businessId: businessDoc.id,
          memberUid: ownerMemberDoc.id,
          from: 'owner',
          to: 'admin',
        });
      }

      enqueueUpdate(ownerMemberDoc.ref, {
        role: 'admin',
        ownerRoleNormalizedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (batchOps >= BATCH_LIMIT) {
      await flushBatch();
    }
  }

  let usersQuery = db
    .collection('users')
    .orderBy(admin.firestore.FieldPath.documentId())
    .limit(limit);
  let lastUserDoc = null;
  let processedUsers = 0;
  const USER_PAGE_SIZE = 400;

  while (processedUsers < limit) {
    const remaining = limit - processedUsers;
    const pageSize = Math.min(USER_PAGE_SIZE, remaining);
    let pageQuery = usersQuery.limit(pageSize);
    if (lastUserDoc) {
      pageQuery = pageQuery.startAfter(lastUserDoc);
    }

    const usersSnapshot = await pageQuery.get();
    if (usersSnapshot.empty) break;

    for (const userDoc of usersSnapshot.docs) {
      if (processedUsers >= limit) break;
      processedUsers += 1;
      stats.usersScanned += 1;

      const userData = userDoc.data() || {};
      const patch = buildUserDevPatch(userData);
      if (!patch) continue;

      const shouldMarkDev = shouldMarkPlatformDev(userData);
      const hadPlatformDev = hasPlatformDev(userData);
      const rootRole = normalizeRole(asRecord(userData).role);
      const nestedRole = normalizeRole(asRecord(asRecord(userData).user).role);

      stats.usersPatchedPlatformDev += 1;
      if (shouldMarkDev && !hadPlatformDev) {
        stats.usersMarkedPlatformDev += 1;
      }
      if (rootRole === 'dev' || nestedRole === 'dev') {
        stats.usersRemovedLegacyDevRole += 1;
      }

      if (stats.samples.usersPlatformDev.length < 20) {
        stats.samples.usersPlatformDev.push({
          uid: userDoc.id,
          markedPlatformDev: shouldMarkDev && !hadPlatformDev,
          removedLegacyRole: rootRole === 'dev' || nestedRole === 'dev',
        });
      }

      enqueueSet(userDoc.ref, patch, { merge: true });
      if (batchOps >= BATCH_LIMIT) {
        await flushBatch();
      }
    }

    lastUserDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
    if (usersSnapshot.docs.length < pageSize) break;
  }

  await flushBatch();

  console.log(JSON.stringify(stats, null, 2));
};

run().catch((error) => {
  console.error('migrateOwnershipAndPlatformDev failed:', error);
  process.exitCode = 1;
});
