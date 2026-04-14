// One-off diagnostic script to reproduce Firestore rules issues against prod.
//
// Usage (PowerShell):
//   node tools/debug-firestore-permissions.mjs dev_caja1 "PASSWORD"
//
// Notes:
// - Uses the public callable function `clientLogin` to obtain a Firebase custom token.
// - Signs in with that custom token and then performs reads/writes that are currently failing.

import 'dotenv/config';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  updateDoc,
  setDoc,
  increment,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env var ${key}. Did you load .env?`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID'),
};

const username = process.argv[2] || '';
const password = process.env.DEBUG_FIRESTORE_PASSWORD || '';

if (!username || !password) {
  console.error(
    'Usage: set DEBUG_FIRESTORE_PASSWORD and run node tools/debug-firestore-permissions.mjs <username>',
  );
  process.exit(2);
}

const businessId = process.env.DEBUG_BUSINESS_ID || 'X63aIFwHzk3r0gmT8w6P';
const approverUid = process.env.DEBUG_APPROVER_UID || 'BdNGtDt3y0';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const callClientLogin = httpsCallable(functions, 'clientLogin');

const pretty = (value) => JSON.stringify(value, null, 2);

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

const summarizeLoginPayload = (payload) => ({
  ok: Boolean(payload?.ok),
  code: payload?.code || null,
  message: payload?.message || payload?.error || null,
  keys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
});

const section = (title) => {
  console.log(`\n=== ${title} ===`);
};

const safeOp = async (label, fn) => {
  try {
    const result = await fn();
    console.log(`${label}: OK`);
    return { ok: true, result };
  } catch (error) {
    const message = error?.message || String(error);
    console.log(`${label}: FAIL -> ${message}`);
    if (error?.code) console.log(`  code: ${error.code}`);
    if (error?.customData) {
      console.log(`  customData: ${pretty(redactSensitive(error.customData))}`);
    }
    return { ok: false, error };
  }
};

const pick = (obj, keys) => {
  const source = obj && typeof obj === 'object' ? obj : {};
  return keys.reduce((acc, key) => {
    acc[key] = source?.[key];
    return acc;
  }, {});
};

section('Config');
console.log(
  pretty({
    projectId: firebaseConfig.projectId,
    businessId,
    username,
    approverUid,
  }),
);

section('Login (clientLogin -> customToken -> signInWithCustomToken)');
const loginRes = await safeOp('clientLogin', async () => {
  const sessionInfo = { ua: 'debug-firestore-permissions' };
  const response = await callClientLogin({ username, password, sessionInfo });
  return response.data;
});

if (!loginRes.ok) process.exit(1);
const payload = loginRes.result || {};
if (!payload.ok) {
  console.log(`clientLogin payload not ok: ${pretty(summarizeLoginPayload(payload))}`);
  process.exit(1);
}

await safeOp('signInWithCustomToken', async () => {
  await signInWithCustomToken(auth, payload.firebaseCustomToken);
});

const currentUid = auth.currentUser?.uid || null;
section('Auth');
console.log(pretty({ currentUid }));

section('Reads');
const currentUserRead = await safeOp('getDoc users/current', async () => {
  if (!currentUid) throw new Error('No current uid');
  const snap = await getDoc(doc(db, 'users', currentUid));
  const data = snap.data() || null;
  return {
    exists: snap.exists(),
    pick: {
      uid: currentUid,
      activeBusinessId: data?.activeBusinessId,
      businessID: data?.businessID,
      businessId: data?.businessId,
      role: data?.role,
      activeRole: data?.activeRole,
      platformRoles: data?.platformRoles,
      nested: pick(data?.user, [
        'activeBusinessId',
        'businessID',
        'businessId',
        'role',
        'activeRole',
        'platformRoles',
      ]),
    },
  };
});
if (currentUserRead.ok) console.log(pretty(currentUserRead.result));

const approverRead = await safeOp('getDoc users/approver', async () => {
  const snap = await getDoc(doc(db, 'users', approverUid));
  const data = snap.data() || null;
  return {
    exists: snap.exists(),
    pick: {
      uid: approverUid,
      activeBusinessId: data?.activeBusinessId,
      businessID: data?.businessID,
      businessId: data?.businessId,
      role: data?.role,
      activeRole: data?.activeRole,
      platformRoles: data?.platformRoles,
      nested: pick(data?.user, [
        'activeBusinessId',
        'businessID',
        'businessId',
        'role',
        'activeRole',
        'platformRoles',
      ]),
      user: pick(data?.user, ['name', 'displayName']),
    },
  };
});
if (approverRead.ok) console.log(pretty(approverRead.result));

const membershipRead = await safeOp('getDoc businesses/<id>/members/current', async () => {
  if (!currentUid) throw new Error('No current uid');
  const snap = await getDoc(doc(db, 'businesses', businessId, 'members', currentUid));
  const data = snap.data() || null;
  return {
    exists: snap.exists(),
    pick: {
      role: data?.role,
      activeRole: data?.activeRole,
      status: data?.status,
      active: data?.active,
    },
  };
});
if (membershipRead.ok) console.log(pretty(membershipRead.result));

const counterRead = await safeOp('getDoc businesses/<id>/counters/lastCashCountId', async () => {
  const snap = await getDoc(
    doc(db, 'businesses', businessId, 'counters', 'lastCashCountId'),
  );
  const data = snap.data() || null;
  return {
    exists: snap.exists(),
    pick: {
      value: data?.value,
      keys: data ? Object.keys(data) : [],
    },
  };
});
if (counterRead.ok) console.log(pretty(counterRead.result));

await safeOp('query users where user.name == approver', async () => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('user.name', '==', 'dev#3407'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      activeBusinessId: data?.activeBusinessId,
      role: data?.role,
      activeRole: data?.activeRole,
      nested: pick(data?.user, ['name', 'displayName', 'businessId', 'role']),
    };
  });
});

section('Write: transaction increment counter by +1');
await safeOp('runTransaction counters/lastCashCountId +1', async () => {
  const counterRef = doc(db, 'businesses', businessId, 'counters', 'lastCashCountId');
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const currentValue = snap.data()?.value ?? 0;
    if (!snap.exists()) {
      tx.set(counterRef, { value: 1 });
      return { created: true, next: 1 };
    }
    tx.update(counterRef, { value: currentValue + 1 });
    return { created: false, from: currentValue, to: currentValue + 1 };
  });
});

section('Write: direct counter updates (no transaction)');
await safeOp('updateDoc value = current + 1', async () => {
  const counterRef = doc(db, 'businesses', businessId, 'counters', 'lastCashCountId');
  const snap = await getDoc(counterRef);
  const currentValue = snap.data()?.value ?? 0;
  await updateDoc(counterRef, { value: currentValue + 1 });
  return { from: currentValue, to: currentValue + 1 };
});

await safeOp('setDoc merge value = current + 1', async () => {
  const counterRef = doc(db, 'businesses', businessId, 'counters', 'lastCashCountId');
  const snap = await getDoc(counterRef);
  const currentValue = snap.data()?.value ?? 0;
  await setDoc(counterRef, { value: currentValue + 1 }, { merge: true });
  return { from: currentValue, to: currentValue + 1 };
});

await safeOp('updateDoc increment(1)', async () => {
  const counterRef = doc(db, 'businesses', businessId, 'counters', 'lastCashCountId');
  await updateDoc(counterRef, { value: increment(1) });
  return { ok: true };
});

section('Done');
