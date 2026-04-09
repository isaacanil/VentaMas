/*
  Script: fixAiBusinessSeededBusiness.js

  Purpose:
    Repair businesses/users created by legacy AI seeding flows that wrote only:
      - businesses/{businessId} { business: {...} }
      - users/{uid} { user: {...} }   (missing flat/root fields)
    and failed to create canonical membership docs:
      - businesses/{businessId}/members/{uid}

  What it does (for one businessId):
    - Finds users referencing the business (legacy + new fields)
    - Ensures canonical member docs exist (members subcollection)
    - Writes user flat/root fields (id/name/password/etc) from legacy mirror if missing
    - Writes user membership cache (accessControl + memberships) and active context
    - Sets business owner fields (ownerUid/owners/billingContact*) if missing and owner found

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/fixAiBusinessSeededBusiness.js --businessId <id> --dry-run
    node functions/scripts/fixAiBusinessSeededBusiness.js --businessId <id> --write

  Flags:
    --businessId <id>   Required.
    --dry-run           Default. Prints the planned writes.
    --write             Apply changes.
*/

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizeRole = (value) => {
  const role = toCleanString(value);
  if (!role) return null;
  const normalized = role.toLowerCase();
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

const toBoolean = (value, fallbackValue) => {
  if (typeof value === 'boolean') return value;
  return fallbackValue;
};

const normalizeEmail = (value) => {
  const email = toCleanString(value);
  return email ? email.toLowerCase() : null;
};

const uniq = (items) => Array.from(new Set(items.filter(Boolean)));

const getFlagValue = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const upsertAccessControlEntry = (items, entry) => {
  const list = Array.isArray(items) ? items : [];
  const byBusinessId = new Map();
  for (const raw of list) {
    const item = asRecord(raw);
    const businessId = toCleanString(item.businessId) || toCleanString(item.businessID);
    if (!businessId) continue;
    byBusinessId.set(businessId, item);
  }

  const businessId = toCleanString(entry.businessId);
  if (!businessId) return list;
  byBusinessId.set(businessId, { ...asRecord(byBusinessId.get(businessId)), ...entry });
  return Array.from(byBusinessId.values());
};

const upsertMembershipEntry = (items, entry) => {
  const list = Array.isArray(items) ? items : [];
  const byBusinessId = new Map();
  for (const raw of list) {
    const item = asRecord(raw);
    const businessId = toCleanString(item.businessId) || toCleanString(item.businessID);
    if (!businessId) continue;
    byBusinessId.set(businessId, item);
  }

  const businessId = toCleanString(entry.businessId);
  if (!businessId) return list;
  byBusinessId.set(businessId, { ...asRecord(byBusinessId.get(businessId)), ...entry });
  return Array.from(byBusinessId.values());
};

const fetchUsersForBusiness = async (businessId) => {
  const queries = [
    ['user.businessID', businessId],
    ['user.businessId', businessId],
    ['businessID', businessId],
    ['businessId', businessId],
    ['activeBusinessId', businessId],
    ['user.activeBusinessId', businessId],
  ];

  const byUid = new Map();

  for (const [field, value] of queries) {
    const snap = await db.collection('users').where(field, '==', value).get();
    for (const doc of snap.docs) {
      byUid.set(doc.id, doc);
    }
  }

  return Array.from(byUid.values());
};

const buildUserPatch = ({ uid, userData, businessId, businessName, role }) => {
  const root = asRecord(userData);
  const legacy = asRecord(root.user);

  const patch = {};

  // Flat/root schema: copy from legacy mirror when missing.
  patch.id = root.id ?? legacy.id ?? uid;
  if (root.name === undefined && legacy.name !== undefined) patch.name = legacy.name;
  if (root.displayName === undefined && legacy.displayName !== undefined) {
    patch.displayName = legacy.displayName;
  }
  if (root.realName === undefined && legacy.realName !== undefined) patch.realName = legacy.realName;
  if (root.number === undefined && legacy.number !== undefined) patch.number = legacy.number;
  if (root.password === undefined && legacy.password !== undefined) patch.password = legacy.password;
  if (root.loginAttempts === undefined && legacy.loginAttempts !== undefined) {
    patch.loginAttempts = legacy.loginAttempts;
  }
  if (root.lockUntil === undefined && legacy.lockUntil !== undefined) patch.lockUntil = legacy.lockUntil;
  if (root.passwordChangedAt === undefined && legacy.passwordChangedAt !== undefined) {
    patch.passwordChangedAt = legacy.passwordChangedAt;
  }
  if (root.createdAt === undefined && legacy.createdAt !== undefined) patch.createdAt = legacy.createdAt;

  if (root.active === undefined && legacy.active !== undefined) {
    patch.active = toBoolean(legacy.active, true);
  } else if (root.active === undefined) {
    patch.active = true;
  }

  const resolvedEmail =
    normalizeEmail(root.email) || normalizeEmail(legacy.email) || null;
  if (root.email !== resolvedEmail) patch.email = resolvedEmail;

  if (root.emailVerified === undefined && legacy.emailVerified !== undefined) {
    patch.emailVerified = Boolean(legacy.emailVerified);
  } else if (root.emailVerified === undefined) {
    patch.emailVerified = false;
  }

  if (root.phoneNumber === undefined && legacy.phoneNumber !== undefined) patch.phoneNumber = legacy.phoneNumber;
  if (root.phoneNumberE164 === undefined && legacy.phoneNumberE164 !== undefined) {
    patch.phoneNumberE164 = legacy.phoneNumberE164;
  }
  if (root.phoneVerified === undefined && legacy.phoneVerified !== undefined) {
    patch.phoneVerified = Boolean(legacy.phoneVerified);
  } else if (root.phoneVerified === undefined) {
    patch.phoneVerified = false;
  }

  const rootProviders = Array.isArray(root.providers) ? root.providers : [];
  const legacyProviders = Array.isArray(legacy.providers) ? legacy.providers : [];
  const providers = rootProviders.length ? rootProviders : legacyProviders;
  patch.providers = providers.length ? providers : ['username_password_legacy'];

  // Membership cache + active context (frontend reads from users/{uid}).
  const accessControlEntry = {
    businessId,
    role,
    status: 'active',
    ...(businessName ? { businessName } : {}),
  };

  const membershipEntry = {
    uid,
    userId: uid,
    businessId,
    role,
    activeRole: role,
    status: 'active',
    source: 'seed_fix',
    ...(businessName ? { businessName } : {}),
  };

  patch.accessControl = upsertAccessControlEntry(root.accessControl, accessControlEntry);
  patch.memberships = upsertMembershipEntry(root.memberships, membershipEntry);
  patch.activeBusinessId = toCleanString(root.activeBusinessId) || businessId;
  patch.lastSelectedBusinessId = toCleanString(root.lastSelectedBusinessId) || businessId;
  patch.activeRole = normalizeRole(root.activeRole) || role;
  patch.updatedAt = FieldValue.serverTimestamp();

  return patch;
};

const buildMemberPayload = ({ uid, businessId, role }) => ({
  uid,
  userId: uid,
  businessId,
  role,
  status: 'active',
  source: 'seed_fix',
  updatedAt: FieldValue.serverTimestamp(),
  createdAt: FieldValue.serverTimestamp(),
});

const run = async () => {
  const args = process.argv.slice(2);
  const businessId = toCleanString(getFlagValue(args, '--businessId'));
  const shouldWrite = args.includes('--write');
  const dryRun = !shouldWrite || args.includes('--dry-run');

  if (!businessId) {
    console.error('Missing required flag: --businessId <id>');
    process.exit(1);
  }

  if (dryRun) {
    console.log(
      '[fixAiBusinessSeededBusiness] Running in DRY-RUN mode (pass --write to apply changes).',
    );
  }

  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) {
    console.error(`Business not found: businesses/${businessId}`);
    process.exit(1);
  }

  const businessData = businessSnap.data() || {};
  const businessNode = asRecord(businessData.business);
  const businessName = toCleanString(businessData.name) || toCleanString(businessNode.name) || null;

  const userDocs = await fetchUsersForBusiness(businessId);

  const stats = {
    ok: true,
    mode: dryRun ? 'dry-run' : 'write',
    businessId,
    usersMatched: userDocs.length,
    membersCreated: 0,
    membersUpdated: 0,
    usersPatched: 0,
    businessOwnerPatched: 0,
    samples: {
      users: [],
      members: [],
    },
  };

  let ownerUidCandidate = null;

  for (const userDoc of userDocs) {
    const uid = userDoc.id;
    const data = userDoc.data() || {};
    const legacy = asRecord(asRecord(data).user);
    const role =
      normalizeRole(data.activeRole) ||
      normalizeRole(data.role) ||
      normalizeRole(legacy.activeRole) ||
      normalizeRole(legacy.role) ||
      'cashier';

    if (role === 'owner' && !ownerUidCandidate) ownerUidCandidate = uid;

    const memberRef = db.doc(`businesses/${businessId}/members/${uid}`);
    const memberSnap = await memberRef.get();
    const memberPayload = buildMemberPayload({ uid, businessId, role });

    if (!memberSnap.exists) {
      stats.membersCreated += 1;
      if (stats.samples.members.length < 10) stats.samples.members.push({ uid, role, action: 'create' });
      if (!dryRun) await memberRef.set(memberPayload, { merge: true });
    } else {
      const currentRole = normalizeRole(memberSnap.get('role'));
      if (currentRole !== role) {
        stats.membersUpdated += 1;
        if (stats.samples.members.length < 10) stats.samples.members.push({ uid, role, action: 'update-role' });
        if (!dryRun) await memberRef.set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }

    const patch = buildUserPatch({
      uid,
      userData: data,
      businessId,
      businessName,
      role,
    });

    // Only write if something would actually change.
    const nextHasChanges = Object.keys(patch).some((key) => {
      if (key === 'updatedAt') return true;
      return true;
    });

    if (nextHasChanges) {
      stats.usersPatched += 1;
      if (stats.samples.users.length < 10) {
        stats.samples.users.push({
          uid,
          role,
          name: toCleanString(patch.name) || toCleanString(asRecord(legacy).name) || null,
        });
      }
      if (!dryRun) {
        await userDoc.ref.set(patch, { merge: true });
      }
    }
  }

  // Patch business ownership if missing and we found an owner.
  const ownerUid = toCleanString(businessSnap.get('ownerUid'));
  const owners = businessSnap.get('owners');
  const hasOwners = Boolean(ownerUid) || (Array.isArray(owners) && owners.length);
  const resolvedOwner = ownerUidCandidate;

  if (!hasOwners && resolvedOwner) {
    stats.businessOwnerPatched = 1;
    if (!dryRun) {
      await businessRef.set(
        {
          ownerUid: resolvedOwner,
          owners: [resolvedOwner],
          billingContact: resolvedOwner,
          billingContactUid: resolvedOwner,
          updatedAt: FieldValue.serverTimestamp(),
          business: {
            ...businessNode,
            ownerUid: resolvedOwner,
            owners: [resolvedOwner],
            billingContact: resolvedOwner,
            billingContactUid: resolvedOwner,
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        ...stats,
        businessName,
        ownerUidCandidate,
        timestamp: Timestamp.now().toDate().toISOString(),
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[fixAiBusinessSeededBusiness] failed:', error);
  process.exitCode = 1;
});

