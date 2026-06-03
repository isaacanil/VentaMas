/*
  Script: suspendBusinessAccess.js

  Purpose:
    Bloquear o limitar el acceso de un negocio completo.

  Usage (PowerShell 7.5.4):
    node functions/scripts/suspendBusinessAccess.js --projectId ventamaxpos --businessId <id> --dry-run
    node functions/scripts/suspendBusinessAccess.js --projectId ventamaxpos --businessId <id> --status suspended --reason "Offboarding solicitado por WhatsApp" --write
    node functions/scripts/suspendBusinessAccess.js --projectId ventamaxpos --businessId <id> --status read_only --write
    node functions/scripts/suspendBusinessAccess.js --projectId ventamaxpos --businessId <id> --service-account C:\path\key.json --write
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

const SCRIPT_NAME = 'suspendBusinessAccess';
const BLOCKING_STATUSES = new Set([
  'inactive',
  'suspended',
  'offboarded',
  'closed',
  'disabled',
  'blocked',
]);
const ALLOWED_TARGET_STATUSES = new Set([
  'read_only',
  'suspended',
  'inactive',
  'offboarded',
  'closed',
]);
const ACTIVE_MEMBERSHIP_STATUSES = new Set(['active', 'read_only']);
const BATCH_LIMIT = 400;

const args = process.argv.slice(2);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const getFlagValue = (name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const hasFlag = (name) => args.includes(name);

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return admin.credential.cert(JSON.parse(raw));
};

const normalizeStatus = (value, fallback = 'active') =>
  (toCleanString(value) || fallback).toLowerCase();

const resolveBusinessIdFromEntry = (entry) => {
  const record = asRecord(entry);
  const businessNode = asRecord(record.business);
  return (
    toCleanString(record.businessId) ||
    toCleanString(record.businessID) ||
    toCleanString(businessNode.id) ||
    toCleanString(businessNode.businessId) ||
    toCleanString(businessNode.businessID) ||
    null
  );
};

const isPlatformDev = (userData) => {
  const root = asRecord(userData);
  const platformRoles = asRecord(root.platformRoles);
  return (
    platformRoles.dev === true || normalizeStatus(root.activeRole, '') === 'dev'
  );
};

const isActiveMembershipEntry = (entry) => {
  const status = normalizeStatus(asRecord(entry).status);
  return ACTIVE_MEMBERSHIP_STATUSES.has(status);
};

const buildNextAccessControl = ({
  entries,
  businessId,
  membershipStatus,
  memberActive,
}) => {
  const normalizedEntries = toArray(entries).filter(
    (entry) => entry && typeof entry === 'object' && !Array.isArray(entry),
  );
  let touched = false;

  const nextEntries = normalizedEntries.map((entry) => {
    const entryBusinessId = resolveBusinessIdFromEntry(entry);
    if (entryBusinessId !== businessId) return entry;
    touched = true;
    return {
      ...entry,
      status: membershipStatus,
      active: memberActive,
    };
  });

  return {
    touched,
    entries: nextEntries,
  };
};

const createBatchWriter = (db) => {
  let batch = db.batch();
  let count = 0;
  let commits = 0;

  const commit = async () => {
    if (!count) return;
    await batch.commit();
    commits += 1;
    batch = db.batch();
    count = 0;
  };

  return {
    set(ref, data, options) {
      batch.set(ref, data, options);
      count += 1;
    },
    update(ref, data) {
      batch.update(ref, data);
      count += 1;
    },
    delete(ref) {
      batch.delete(ref);
      count += 1;
    },
    async flushIfNeeded() {
      if (count >= BATCH_LIMIT) await commit();
    },
    async close() {
      await commit();
      return commits;
    },
  };
};

const projectId = toCleanString(getFlagValue('--projectId'));
const businessId = toCleanString(getFlagValue('--businessId'));
const status = normalizeStatus(getFlagValue('--status'), 'suspended');
const reason =
  toCleanString(getFlagValue('--reason')) || 'business-offboarding';
const serviceAccountPath =
  toCleanString(getFlagValue('--service-account')) ||
  toCleanString(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const shouldWrite = hasFlag('--write');

if (!projectId || !businessId) {
  console.error(
    'Usage: node functions/scripts/suspendBusinessAccess.js --projectId <id> --businessId <id> [--status suspended|read_only|inactive|offboarded|closed] [--reason "..."] [--write|--dry-run]',
  );
  process.exit(1);
}

if (!ALLOWED_TARGET_STATUSES.has(status)) {
  console.error(
    `[${SCRIPT_NAME}] Estado invalido: ${status}. Usa uno de: ${Array.from(
      ALLOWED_TARGET_STATUSES,
    ).join(', ')}`,
  );
  process.exit(1);
}

if (!admin.apps.length) {
  if (serviceAccountPath) {
    admin.initializeApp({
      credential: loadServiceAccountCredential(serviceAccountPath),
      projectId,
    });
  } else {
    admin.initializeApp({ projectId });
  }
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const blocksLogin = BLOCKING_STATUSES.has(status);
const membershipStatus = blocksLogin ? 'suspended' : 'active';
const memberActive = !blocksLogin;

const run = async () => {
  console.log(
    `[${SCRIPT_NAME}] ${shouldWrite ? 'WRITE' : 'DRY-RUN'} project=${projectId} businessId=${businessId} status=${status}`,
  );

  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) {
    throw new Error(`Negocio no encontrado: ${businessId}`);
  }

  const membersSnap = await businessRef.collection('members').get();
  const userIds = membersSnap.docs.map((doc) => doc.id);
  const stats = {
    membersFound: userIds.length,
    membersUpdated: 0,
    usersUpdated: 0,
    usersDeactivated: 0,
    sessionsRevoked: 0,
    batchesCommitted: 0,
  };

  const writer = createBatchWriter(db);
  const now = FieldValue.serverTimestamp();

  if (shouldWrite) {
    writer.set(
      businessRef,
      {
        status,
        accessStatus: status,
        accessPolicy: {
          readAllowed: !blocksLogin,
          writeAllowed: status === 'active',
          loginBlocked: blocksLogin,
          updatedAt: now,
          updatedBy: SCRIPT_NAME,
          reason,
        },
        updatedAt: now,
        ...(blocksLogin
          ? {
              suspendedAt: now,
              suspendedBy: SCRIPT_NAME,
              suspendedReason: reason,
            }
          : {
              readOnlyAt: now,
              readOnlyBy: SCRIPT_NAME,
              readOnlyReason: reason,
            }),
      },
      { merge: true },
    );
    await writer.flushIfNeeded();
  }

  for (const memberDoc of membersSnap.docs) {
    const uid = memberDoc.id;
    const memberRef = memberDoc.ref;
    const userRef = db.doc(`users/${uid}`);
    const [userSnap, sessionsSnap] = await Promise.all([
      userRef.get(),
      blocksLogin
        ? db.collection('sessionTokens').where('userId', '==', uid).get()
        : Promise.resolve({ docs: [] }),
    ]);

    stats.membersUpdated += 1;
    if (shouldWrite) {
      writer.set(
        memberRef,
        {
          active: memberActive,
          status: membershipStatus,
          updatedAt: now,
          ...(blocksLogin
            ? {
                suspendedAt: now,
                suspendedBy: SCRIPT_NAME,
                suspendedReason: reason,
              }
            : {
                readOnlyAt: now,
                readOnlyBy: SCRIPT_NAME,
                readOnlyReason: reason,
              }),
        },
        { merge: true },
      );
      await writer.flushIfNeeded();
    }

    if (userSnap.exists) {
      const userData = userSnap.data() || {};
      const accessControlResult = buildNextAccessControl({
        entries: userData.accessControl,
        businessId,
        membershipStatus,
        memberActive,
      });
      const remainingActiveEntries = accessControlResult.entries.filter(
        (entry) =>
          resolveBusinessIdFromEntry(entry) !== businessId &&
          isActiveMembershipEntry(entry),
      );
      const fallbackBusiness = remainingActiveEntries[0] || null;
      const userPatch = {
        updatedAt: now,
      };

      if (accessControlResult.touched) {
        userPatch.accessControl = accessControlResult.entries;
      }

      if (
        blocksLogin &&
        !isPlatformDev(userData) &&
        !remainingActiveEntries.length
      ) {
        userPatch.active = false;
        userPatch.activeBusinessId = null;
        userPatch.lastSelectedBusinessId = null;
        userPatch.activeRole = null;
        userPatch.deactivatedAt = now;
        userPatch.deactivatedBy = SCRIPT_NAME;
        userPatch.deactivatedReason = reason;
        stats.usersDeactivated += 1;
      } else if (
        blocksLogin &&
        toCleanString(userData.activeBusinessId) === businessId
      ) {
        userPatch.activeBusinessId =
          resolveBusinessIdFromEntry(fallbackBusiness) || null;
        userPatch.lastSelectedBusinessId = userPatch.activeBusinessId;
        userPatch.activeRole =
          toCleanString(asRecord(fallbackBusiness).role) || null;
      }

      if (Object.keys(userPatch).length > 1) {
        stats.usersUpdated += 1;
      }

      if (shouldWrite && Object.keys(userPatch).length > 1) {
        writer.set(userRef, userPatch, { merge: true });
        await writer.flushIfNeeded();
      }
    }

    if (blocksLogin) {
      stats.sessionsRevoked += sessionsSnap.docs.length;
      if (shouldWrite) {
        for (const sessionDoc of sessionsSnap.docs) {
          writer.delete(sessionDoc.ref);
          await writer.flushIfNeeded();
        }
      }
    }
  }

  if (shouldWrite) {
    stats.batchesCommitted = await writer.close();
  }

  console.log(`[${SCRIPT_NAME}] Summary:`);
  console.log(JSON.stringify(stats, null, 2));

  if (!shouldWrite) {
    console.log(`[${SCRIPT_NAME}] Dry-run only. Pass --write to persist.`);
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[${SCRIPT_NAME}] Failed:`, error);
    process.exit(1);
  });
