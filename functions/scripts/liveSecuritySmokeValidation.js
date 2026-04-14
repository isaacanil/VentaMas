/*
  Script: liveSecuritySmokeValidation.js

  Purpose:
    Run live (non-emulator) smoke checks for multi-business security.

  Scope:
    - Firestore tenant isolation
    - Firestore aggregation access
    - Role-based write checks (products admin-only)
    - Storage tenant isolation + public login image read
    - Invite flow creates canonical membership
    - Login/custom-token/refresh smoke

  Usage:
    node functions/scripts/liveSecuritySmokeValidation.js --service-account C:/path/key.json

  Notes:
    - Uses real project data and creates temporary smoke artifacts.
    - Cleans up temporary docs/files when possible.
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);

const getFlagValue = (flag) => {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  const value = args[idx + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeRole = (value) => {
  const role = toCleanString(value);
  return role ? role.toLowerCase() : null;
};

const isActiveStatus = (value) => {
  const status = toCleanString(value)?.toLowerCase();
  if (!status) return true;
  return !['inactive', 'suspended', 'revoked'].includes(status);
};

const randomSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const json = JSON.parse(raw);
  return admin.credential.cert(json);
};

const findEnvValue = (envText, key) => {
  const regex = new RegExp(`^${key}=(.+)$`, 'm');
  const match = envText.match(regex);
  if (!match) return null;
  const raw = match[1].trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
};

const readRootEnv = () => {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const text = fs.readFileSync(envPath, 'utf8');
  return {
    apiKey: findEnvValue(text, 'VITE_FIREBASE_API_KEY'),
    projectId: findEnvValue(text, 'VITE_FIREBASE_PROJECT_ID'),
    storageBucket: findEnvValue(text, 'VITE_FIREBASE_STORAGE_BUCKET'),
  };
};

const serviceAccountPath =
  getFlagValue('--service-account') ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  null;

if (!serviceAccountPath) {
  console.error(
    '[liveSecuritySmokeValidation] Missing service account. Use --service-account or GOOGLE_APPLICATION_CREDENTIALS.',
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: loadServiceAccountCredential(serviceAccountPath),
  });
}

const db = admin.firestore();
const envValues = readRootEnv();
const projectId = envValues.projectId || process.env.GCLOUD_PROJECT || 'ventamaxpos';
const apiKey = envValues.apiKey;
const storageBucket = envValues.storageBucket || `${projectId}.appspot.com`;

if (!apiKey) {
  console.error(
    '[liveSecuritySmokeValidation] Missing VITE_FIREBASE_API_KEY in root .env',
  );
  process.exit(1);
}

const results = [];
const cleanupTasks = [];

const addResult = (name, ok, detail = null) => {
  results.push({
    name,
    ok,
    detail: detail || null,
  });
};

const withStep = async (name, fn) => {
  try {
    const detail = await fn();
    addResult(name, true, detail);
    return detail;
  } catch (error) {
    addResult(name, false, String(error?.message || error));
    return null;
  }
};

const addCleanup = (fn) => {
  cleanupTasks.push(fn);
};

const redactSensitive = (value, depth = 0) => {
  if (depth > 4) return '<redacted>';
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth + 1));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const out = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (/(token|password|secret|authorization|cookie)/i.test(key)) {
      out[key] = '<redacted>';
      continue;
    }
    out[key] = redactSensitive(nestedValue, depth + 1);
  }
  return out;
};

const safeJson = (value) => JSON.stringify(redactSensitive(value));

const runCleanup = async () => {
  for (const task of cleanupTasks.reverse()) {
    try {
      // eslint_disable-next-line no-await-in-loop
      await task();
    } catch {
      // Ignore cleanup failures in smoke mode.
    }
  }
};

const exchangeCustomTokenForIdToken = async (customToken) => {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true,
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.idToken) {
    throw new Error(
      `Token exchange failed (${response.status}): ${safeJson(payload)}`,
    );
  }
  return payload.idToken;
};

const createIdTokenForUid = async (uid) => {
  const customToken = await admin.auth().createCustomToken(uid);
  return exchangeCustomTokenForIdToken(customToken);
};

const firestoreDocUrl = (docPath) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;

const firestoreReadDoc = async (docPath, idToken) => {
  const response = await fetch(firestoreDocUrl(docPath), {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  const text = await response.text();
  return { status: response.status, text };
};

const firestoreWriteDoc = async (docPath, idToken, fields) => {
  const response = await fetch(firestoreDocUrl(docPath), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  const text = await response.text();
  return { status: response.status, text };
};

const firestoreRunAggregation = async (businessId, idToken) => {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/businesses/${businessId}:runAggregationQuery`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredAggregationQuery: {
          aggregations: [
            {
              alias: 'aggregate_0',
              count: {},
            },
          ],
          structuredQuery: {
            from: [{ collectionId: 'products' }],
            limit: 1,
          },
        },
      }),
    },
  );

  const text = await response.text();
  return { status: response.status, text };
};

const storageObjectUrl = (objectPath) =>
  `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(objectPath)}`;

const storageUpload = async (objectPath, idToken, content) => {
  const response = await fetch(
    `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o?name=${encodeURIComponent(objectPath)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: content,
    },
  );
  const text = await response.text();
  return { status: response.status, text };
};

const storageRead = async (objectPath, idToken = null) => {
  const headers = {};
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }
  const response = await fetch(`${storageObjectUrl(objectPath)}?alt=media`, {
    headers,
  });
  const text = await response.text();
  return { status: response.status, text };
};

const callCallable = async (name, data, idToken = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(
    `https://us-central1-${projectId}.cloudfunctions.net/${name}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ data }),
    },
  );

  const json = await response.json().catch(() => ({}));
  if (json?.error) {
    const message =
      json.error?.message ||
      json.error?.status ||
      `Callable ${name} failed`;
    throw new Error(`${name}: ${message}`);
  }
  if (!response.ok) {
    throw new Error(`${name}: HTTP ${response.status}`);
  }
  return json?.result ?? json;
};

const assertStatus = (actual, expectedStatuses, context) => {
  const list = Array.isArray(expectedStatuses)
    ? expectedStatuses
    : [expectedStatuses];
  if (!list.includes(actual)) {
    throw new Error(`${context}: expected ${list.join('/')} got ${actual}`);
  }
};

const findBusinessActors = async () => {
  const businessesSnap = await db.collection('businesses').limit(200).get();
  const businesses = [];

  for (const businessDoc of businessesSnap.docs) {
    // eslint_disable-next-line no-await-in-loop
    const membersSnap = await businessDoc.ref.collection('members').limit(200).get();
    const activeMembers = membersSnap.docs
      .map((docSnap) => ({
        uid: docSnap.id,
        role: normalizeRole(docSnap.get('role')),
        status: normalizeRole(docSnap.get('status')) || 'active',
      }))
      .filter((member) => member.role && isActiveStatus(member.status));

    if (!activeMembers.length) continue;

    businesses.push({
      businessId: businessDoc.id,
      members: activeMembers,
    });
  }

  const adminRoles = new Set(['owner', 'admin', 'dev']);
  const cashierRoles = new Set(['cashier', 'specialcashier1', 'specialcashier2']);

  const businessA = businesses.find((business) => {
    const hasAdmin = business.members.some((member) => adminRoles.has(member.role));
    const hasCashier = business.members.some((member) =>
      cashierRoles.has(member.role),
    );
    return hasAdmin && hasCashier;
  });

  if (!businessA) {
    throw new Error('No business with admin + cashier active members found');
  }

  const adminActor = businessA.members.find((member) =>
    adminRoles.has(member.role),
  );
  const cashierActor = businessA.members.find((member) =>
    cashierRoles.has(member.role),
  );

  if (!adminActor || !cashierActor) {
    throw new Error('Business A actors not found');
  }

  const businessB = businesses.find(
    (business) =>
      business.businessId !== businessA.businessId &&
      business.members.some((member) => member.uid !== cashierActor.uid),
  );

  if (!businessB) {
    throw new Error('No second business for cross-tenant checks');
  }

  const businessBActor = businessB.members[0];
  if (!businessBActor) {
    throw new Error('No actor found for business B');
  }

  return {
    businessAId: businessA.businessId,
    businessBId: businessB.businessId,
    adminUid: adminActor.uid,
    cashierUid: cashierActor.uid,
    businessBUid: businessBActor.uid,
  };
};

const findDevUid = async () => {
  const byActiveRole = await db
    .collection('users')
    .where('activeRole', '==', 'dev')
    .limit(1)
    .get();
  if (!byActiveRole.empty) return byActiveRole.docs[0].id;

  const byNestedActiveRole = await db
    .collection('users')
    .where('user.activeRole', '==', 'dev')
    .limit(1)
    .get();
  if (!byNestedActiveRole.empty) return byNestedActiveRole.docs[0].id;

  return null;
};

const createSessionTokenDoc = async (uid, label) => {
  const tokenId = `smoke_${label}_${randomSuffix()}`;
  const ref = db.collection('sessionTokens').doc(tokenId);
  await ref.set({
    userId: uid,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastActivity: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromMillis(
      Date.now() + 60 * 60 * 1000,
    ),
    metadata: {
      smoke: true,
      label,
    },
  });

  addCleanup(async () => {
    await ref.delete();
  });

  return tokenId;
};

const run = async () => {
  const startedAt = new Date().toISOString();
  const context = await withStep('discoverActors', async () =>
    findBusinessActors(),
  );
  if (!context) {
    throw new Error('discoverActors failed');
  }

  const {
    businessAId,
    businessBId,
    adminUid,
    cashierUid,
    businessBUid,
  } = context;

  const adminIdToken = await withStep('token.admin', async () =>
    createIdTokenForUid(adminUid),
  );
  const cashierIdToken = await withStep('token.cashier', async () =>
    createIdTokenForUid(cashierUid),
  );
  const businessBIdToken = await withStep('token.businessB', async () =>
    createIdTokenForUid(businessBUid),
  );

  if (!adminIdToken || !cashierIdToken || !businessBIdToken) {
    throw new Error('token generation failed');
  }

  await withStep('firestore.read.ownBusiness', async () => {
    const result = await firestoreReadDoc(`businesses/${businessAId}`, cashierIdToken);
    assertStatus(result.status, 200, 'cashier own business read');
    return { status: result.status };
  });

  await withStep('firestore.read.crossTenantDenied', async () => {
    const result = await firestoreReadDoc(`businesses/${businessBId}`, cashierIdToken);
    assertStatus(result.status, [401, 403], 'cashier cross-tenant read');
    return { status: result.status };
  });

  await withStep('firestore.aggregation.ownBusiness', async () => {
    const result = await firestoreRunAggregation(businessAId, cashierIdToken);
    assertStatus(result.status, 200, 'cashier own aggregation');
    return { status: result.status };
  });

  await withStep('firestore.aggregation.crossTenantDenied', async () => {
    const result = await firestoreRunAggregation(businessBId, cashierIdToken);
    assertStatus(result.status, [401, 403], 'cashier cross-tenant aggregation');
    return { status: result.status };
  });

  const smokeProductPath = `businesses/${businessAId}/products/smoke_${randomSuffix()}`;
  addCleanup(async () => {
    await db.doc(smokeProductPath).delete();
  });

  await withStep('firestore.role.cashierCannotWriteProducts', async () => {
    const result = await firestoreWriteDoc(smokeProductPath, cashierIdToken, {
      name: { stringValue: 'Smoke Product Denied' },
      status: { stringValue: 'active' },
      isDeleted: { booleanValue: false },
    });
    assertStatus(result.status, [401, 403], 'cashier products write denied');
    return { status: result.status };
  });

  await withStep('firestore.role.adminCanWriteProducts', async () => {
    const result = await firestoreWriteDoc(smokeProductPath, adminIdToken, {
      name: { stringValue: 'Smoke Product Allowed' },
      status: { stringValue: 'active' },
      isDeleted: { booleanValue: false },
    });
    assertStatus(result.status, [200, 201], 'admin products write allowed');
    return { status: result.status };
  });

  const storageObject = `businesses/${businessAId}/smoke-tests/live-${randomSuffix()}.txt`;
  addCleanup(async () => {
    await admin.storage().bucket(storageBucket).file(storageObject).delete({
      ignoreNotFound: true,
    });
  });

  await withStep('storage.write.ownBusiness', async () => {
    const result = await storageUpload(
      storageObject,
      cashierIdToken,
      `live smoke ${new Date().toISOString()}`,
    );
    assertStatus(result.status, [200, 201], 'cashier own storage write');
    return { status: result.status };
  });

  await withStep('storage.read.ownBusiness', async () => {
    const result = await storageRead(storageObject, cashierIdToken);
    assertStatus(result.status, 200, 'cashier own storage read');
    return { status: result.status };
  });

  await withStep('storage.read.crossTenantDenied', async () => {
    const result = await storageRead(storageObject, businessBIdToken);
    assertStatus(result.status, [401, 403], 'cross-tenant storage read denied');
    return { status: result.status };
  });

  const devUid = await withStep('discoverDevUser', async () => findDevUid());
  if (devUid) {
    const devToken = await withStep('token.dev', async () => createIdTokenForUid(devUid));
    if (devToken) {
      const loginImageObject = `app-config/login-image/smoke-${randomSuffix()}.txt`;
      addCleanup(async () => {
        await admin.storage().bucket(storageBucket).file(loginImageObject).delete({
          ignoreNotFound: true,
        });
      });

      await withStep('storage.loginImage.devWrite', async () => {
        const result = await storageUpload(
          loginImageObject,
          devToken,
          `public login image smoke ${new Date().toISOString()}`,
        );
        assertStatus(result.status, [200, 201], 'dev login-image write');
        return { status: result.status };
      });

      await withStep('storage.loginImage.publicRead', async () => {
        const result = await storageRead(loginImageObject, null);
        assertStatus(result.status, 200, 'public login-image read');
        return { status: result.status };
      });
    }
  }

  const inviteSmokeUid = `smokeInvite_${randomSuffix()}`;
  const inviteSmokeRef = db.collection('users').doc(inviteSmokeUid);
  await inviteSmokeRef.set({
    id: inviteSmokeUid,
    uid: inviteSmokeUid,
    name: inviteSmokeUid.toLowerCase(),
    displayName: 'Smoke Invite User',
    active: true,
    activeRole: 'cashier',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    user: {
      id: inviteSmokeUid,
      name: inviteSmokeUid.toLowerCase(),
      displayName: 'Smoke Invite User',
      active: true,
      activeRole: 'cashier',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  });
  addCleanup(async () => {
    await inviteSmokeRef.delete();
  });

  const actorSessionToken = await createSessionTokenDoc(adminUid, 'invite_actor');
  const inviteeSessionToken = await createSessionTokenDoc(
    inviteSmokeUid,
    'invite_target',
  );

  let createdInviteId = null;
  let createdInviteCode = null;

  await withStep('invites.create', async () => {
    const result = await callCallable('createBusinessInvite', {
      businessId: businessAId,
      role: 'cashier',
      sessionToken: actorSessionToken,
      deliveryChannel: 'copy',
    });
    if (!result?.ok || !result?.code || !result?.inviteId) {
      throw new Error(`Invalid invite create response: ${safeJson(result)}`);
    }
    createdInviteId = result.inviteId;
    createdInviteCode = result.code;
    addCleanup(async () => {
      await db.collection('businessInvites').doc(createdInviteId).delete();
    });
    return { inviteId: result.inviteId };
  });

  await withStep('invites.redeem', async () => {
    if (!createdInviteCode) {
      throw new Error('Invite code missing from create step');
    }
    const result = await callCallable('redeemBusinessInvite', {
      code: createdInviteCode,
      sessionToken: inviteeSessionToken,
    });
    if (!result?.ok) {
      throw new Error(`Invalid invite redeem response: ${safeJson(result)}`);
    }
    return {
      businessId: result.businessId,
      role: result.role,
    };
  });

  await withStep('invites.canonicalMembershipCreated', async () => {
    const memberRef = db.doc(`businesses/${businessAId}/members/${inviteSmokeUid}`);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      throw new Error('Canonical membership was not created');
    }
    addCleanup(async () => {
      await memberRef.delete();
    });
    return {
      role: memberSnap.get('role') || null,
      status: memberSnap.get('status') || null,
    };
  });

  const loginSmokeUid = `smokeLogin_${randomSuffix()}`;
  const loginUsername = `smoke_login_${randomSuffix()}`.toLowerCase();
  const loginPassword = `Smk${Math.random().toString(36).slice(2, 8)}9A`;
  const passwordHash = await bcrypt.hash(loginPassword, 10);

  const loginUserRef = db.collection('users').doc(loginSmokeUid);
  await loginUserRef.set({
    id: loginSmokeUid,
    uid: loginSmokeUid,
    name: loginUsername,
    displayName: 'Smoke Login User',
    activeBusinessId: businessAId,
    activeRole: 'cashier',
    accessControl: [
      {
        businessId: businessAId,
        role: 'cashier',
        status: 'active',
      },
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    user: {
      id: loginSmokeUid,
      name: loginUsername,
      displayName: 'Smoke Login User',
      businessID: businessAId,
      activeBusinessId: businessAId,
      activeRole: 'cashier',
      role: 'cashier',
      active: true,
      password: passwordHash,
      loginAttempts: 0,
      lockUntil: null,
    },
  });
  addCleanup(async () => {
    await loginUserRef.delete();
  });

  const loginMemberRef = db.doc(`businesses/${businessAId}/members/${loginSmokeUid}`);
  await loginMemberRef.set({
    uid: loginSmokeUid,
    userId: loginSmokeUid,
    businessId: businessAId,
    role: 'cashier',
    status: 'active',
    source: 'smoke_login',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  addCleanup(async () => {
    await loginMemberRef.delete();
  });

  let smokeSessionToken = null;
  let smokeFirebaseCustomToken = null;

  await withStep('auth.login.customToken', async () => {
    const result = await callCallable('clientLogin', {
      username: loginUsername,
      password: loginPassword,
    });
    if (!result?.ok || !result?.sessionToken || !result?.firebaseCustomToken) {
      throw new Error(`Invalid login response: ${safeJson(result)}`);
    }
    smokeSessionToken = result.sessionToken;
    smokeFirebaseCustomToken = result.firebaseCustomToken;
    addCleanup(async () => {
      if (smokeSessionToken) {
        await db.collection('sessionTokens').doc(smokeSessionToken).delete();
      }
    });
    return {
      userId: result.userId,
      hasCustomToken: Boolean(result.firebaseCustomToken),
    };
  });

  await withStep('auth.refreshSession', async () => {
    if (!smokeSessionToken) {
      throw new Error('Smoke session token missing');
    }
    const result = await callCallable('clientRefreshSession', {
      sessionToken: smokeSessionToken,
      extend: true,
    });
    if (!result?.ok || !result?.firebaseCustomToken) {
      throw new Error(`Invalid refresh response: ${safeJson(result)}`);
    }
    return {
      sessionId: result.session?.id || null,
    };
  });

  await withStep('auth.customToken.firestoreRead', async () => {
    if (!smokeFirebaseCustomToken) {
      throw new Error('Missing firebaseCustomToken from login');
    }
    const idToken = await exchangeCustomTokenForIdToken(smokeFirebaseCustomToken);
    const result = await firestoreReadDoc(`businesses/${businessAId}`, idToken);
    assertStatus(result.status, 200, 'firestore read with custom token');
    return { status: result.status };
  });

  await runCleanup();

  const failed = results.filter((item) => !item.ok);
  const summary = {
    ok: failed.length === 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    projectId,
    businessAId,
    businessBId,
    checked: results.length,
    failed: failed.length,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

run().catch(async (error) => {
  await runCleanup();
  console.error('[liveSecuritySmokeValidation] failed:', error);
  process.exit(1);
});
