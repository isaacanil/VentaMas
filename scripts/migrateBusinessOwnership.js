import fs from 'fs';
import path from 'path';
import process from 'process';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

import {
  ROLE,
  normalizeRole,
} from '../functions/src/app/core/constants/roles.constants.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const map = new Map();
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    if (!key?.startsWith('--')) continue;
    const value = args[i + 1];
    if (value?.startsWith('--') || value === undefined) {
      map.set(key.slice(2), true);
      i -= 1;
    } else {
      map.set(key.slice(2), value);
    }
  }
  return map;
};

const args = parseArgs();
const serviceAccountPath = args.get('serviceAccount');
const projectId = args.get('projectId');
const dryRun = args.get('dryRun') === true || args.get('dryRun') === 'true';

const initApp = () => {
  const options = {};

  if (serviceAccountPath) {
    const resolved = path.resolve(serviceAccountPath);
    if (!fs.existsSync(resolved)) {
      console.error(`[Ownership] Service account not found: ${resolved}`);
      process.exit(1);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    options.credential = admin.credential.cert(serviceAccount);
    if (!projectId && serviceAccount.project_id) {
      options.projectId = serviceAccount.project_id;
    }
  }

  if (projectId) {
    options.projectId = projectId;
  }

  return admin.initializeApp(options);
};

const app = initApp();
const db = getFirestore(app);

const collectUsersForBusiness = async (businessId) => {
  const users = new Map();
  const queries = [
    db.collection('users').where('businessID', '==', businessId),
    db.collection('users').where('user.businessID', '==', businessId),
  ];

  for (const queryRef of queries) {
    try {
      const snapshot = await queryRef.get();
      snapshot.forEach((docSnap) => {
        users.set(docSnap.id, docSnap.data() || {});
      });
    } catch (error) {
      console.error(
        `[Ownership] Query failed for business ${businessId}:`,
        error?.message || error,
      );
    }
  }

  return Array.from(users.entries()).map(([id, data]) => ({ id, data }));
};

const filterUsersByRole = (users, role) =>
  users.filter((user) => {
    const rawRole = user?.data?.role ?? user?.data?.user?.role ?? '';
    return normalizeRole(rawRole) === role;
  });

const run = async () => {
  const businessesSnap = await db.collection('businesses').get();
  console.log(`[Ownership] Businesses scanned: ${businessesSnap.size}`);
  if (dryRun) {
    console.log('[Ownership] Running in dry-run mode (no writes).');
  }

  let batch = db.batch();
  let batchCount = 0;
  let updated = 0;
  let skipped = 0;
  let missingOwners = 0;
  let fallbackAdmins = 0;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  };

  for (const businessDoc of businessesSnap.docs) {
    const businessId = businessDoc.id;
    const businessData = businessDoc.data() || {};
    const existingOwners = businessData.owners;

    if (Array.isArray(existingOwners) && existingOwners.length > 0) {
      skipped += 1;
      console.log(`[Ownership] Skip ${businessId}: owners already set.`);
      continue;
    }

    const users = await collectUsersForBusiness(businessId);
    let owners = filterUsersByRole(users, ROLE.OWNER);
    let usedFallback = false;

    if (owners.length === 0) {
      owners = filterUsersByRole(users, ROLE.ADMIN);
      usedFallback = owners.length > 0;
    }

    if (owners.length === 0) {
      missingOwners += 1;
      console.warn(
        `[Ownership] No owners/admins found for business ${businessId}.`,
      );
      continue;
    }

    const ownerIds = owners.map((user) => user.id);
    const updates = { owners: ownerIds };

    if (!businessData.billingContact && ownerIds[0]) {
      updates.billingContact = ownerIds[0];
    }

    if (usedFallback) {
      fallbackAdmins += 1;
    }

    if (!dryRun) {
      batch.set(businessDoc.ref, updates, { merge: true });
      batchCount += 1;
    }

    updated += 1;
    console.log(
      `[Ownership] Update ${businessId}: owners=${ownerIds.join(', ')}${
        usedFallback ? ' (fallback admin)' : ''
      }${updates.billingContact ? ` billingContact=${updates.billingContact}` : ''}`,
    );

    if (batchCount >= 400) {
      await commitBatch();
    }
  }

  if (!dryRun) {
    await commitBatch();
  }

  console.log('[Ownership] Migration summary:');
  console.log(`- Updated: ${updated}`);
  console.log(`- Skipped (already set): ${skipped}`);
  console.log(`- Missing owners/admins: ${missingOwners}`);
  console.log(`- Used admin fallback: ${fallbackAdmins}`);
};

run().catch((error) => {
  console.error('[Ownership] Migration failed:', error);
  process.exit(1);
});
