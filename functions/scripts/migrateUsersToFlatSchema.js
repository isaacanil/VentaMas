/*
  Script: migrateUsersToFlatSchema.js
  Usage:
    1) Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON
    2) Run: node scripts/migrateUsersToFlatSchema.js
*/

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const LEGACY_FIELDS = [
  'id',
  'name',
  'displayName',
  'realName',
  'businessID',
  'role',
  'number',
  'active',
  'password',
  'loginAttempts',
  'lockUntil',
  'passwordChangedAt',
  'email',

  'emailVerified',
  'phoneNumber',
  'phoneNumberE164',
  'phoneVerified',
  'providers',
];

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const isMissing = (value) => value === undefined;
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const normalizeEmail = (value) => (isNonEmptyString(value) ? value.trim().toLowerCase() : null);

const buildUpdates = (docId, data) => {
  const legacy = data.user || {};
  const updates = {};
  let needsUpdate = false;
  const deletes = {};
  let needsDelete = false;

  if (isMissing(data.id)) {
    updates.id = docId;
    needsUpdate = true;
  }

  for (const field of LEGACY_FIELDS) {
    if (isMissing(data[field]) && !isMissing(legacy[field])) {
      updates[field] = legacy[field];
      needsUpdate = true;
    }
  }

  // Normalize email and remove legacy emailLower fields (we are standardizing on `email`).
  // Resolution order favors existing `email`, then legacy mirrors, then old `emailLower` fields.
  const resolvedEmail =
    normalizeEmail(data.email) ||
    normalizeEmail(legacy.email) ||
    normalizeEmail(data.emailLower) ||
    normalizeEmail(legacy.emailLower);

  if (resolvedEmail !== null) {
    if (data.email !== resolvedEmail) {
      updates.email = resolvedEmail;
      needsUpdate = true;
    }
  } else if (isMissing(data.email)) {
    // Keep schema consistent: ensure the field exists even if null.
    updates.email = null;
    needsUpdate = true;
  }

  if (!isMissing(data.emailLower)) {
    deletes.emailLower = admin.firestore.FieldValue.delete();
    needsDelete = true;
  }
  if (!isMissing(legacy.emailLower)) {
    deletes['user.emailLower'] = admin.firestore.FieldValue.delete();
    needsDelete = true;
  }

  if (!Array.isArray(data.providers) || data.providers.length === 0) {
    updates.providers = normalizeArray(legacy.providers);
    if (updates.providers.length === 0) {
      updates.providers = ['username_password_legacy'];
    }
    needsUpdate = true;
  }

  if (isMissing(data.emailVerified)) {
    updates.emailVerified = false;
    needsUpdate = true;
  }
  if (isMissing(data.phoneNumber)) {
    updates.phoneNumber = null;
    needsUpdate = true;
  }
  if (isMissing(data.phoneNumberE164)) {
    updates.phoneNumberE164 = null;
    needsUpdate = true;
  }
  if (isMissing(data.phoneVerified)) {
    updates.phoneVerified = false;
    needsUpdate = true;
  }

  const resolvedCreatedAt =
    data.createdAt ??
    legacy.createdAt ??
    data.createAt ??
    legacy.createAt ??
    undefined;
  if (isMissing(data.createdAt) && resolvedCreatedAt !== undefined) {
    updates.createdAt = resolvedCreatedAt;
    needsUpdate = true;
  }

  if (!isMissing(data.createAt)) {
    deletes.createAt = admin.firestore.FieldValue.delete();
    needsDelete = true;
  }
  if (!isMissing(legacy.createAt)) {
    deletes['user.createAt'] = admin.firestore.FieldValue.delete();
    needsDelete = true;
  }

  return { updates, needsUpdate, deletes, needsDelete };
};

const migrate = async () => {
  let migrated = 0;
  let scanned = 0;
  let batch = db.batch();
  let batchOps = 0;

  const pageSize = 400;
  let lastDoc = null;

  try {
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

      for (const doc of snapshot.docs) {
        scanned += 1;
        const data = doc.data() || {};
        const { updates, needsUpdate, deletes, needsDelete } = buildUpdates(
          doc.id,
          data,
        );

        if (needsUpdate) {
          batch.set(doc.ref, updates, { merge: true });
          batchOps += 1;
          migrated += 1;
        }
        if (needsDelete) {
          batch.update(doc.ref, deletes);
          batchOps += 1;
        }

        if (batchOps >= pageSize) {
          await batch.commit();
          batch = db.batch();
          batchOps = 0;
        }
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    if (batchOps > 0) {
      await batch.commit();
    }

    console.log(
      `[migrateUsersToFlatSchema] scanned=${scanned}, migrated=${migrated}`,
    );
  } catch (error) {
    console.error('[migrateUsersToFlatSchema] error:', error);
    process.exitCode = 1;
  }
};

migrate();
