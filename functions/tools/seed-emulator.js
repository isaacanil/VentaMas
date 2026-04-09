import fs from 'fs';
import path from 'path';
import process from 'process';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const map = new Map();
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    if (!key?.startsWith('--')) continue;
    map.set(key.slice(2), args[i + 1]);
  }
  return map;
};

const args = parseArgs();
const serviceAccountPath = args.get('serviceAccount');
const projectId = args.get('projectId') || 'ventamaxpos';
const businessId = args.get('businessId');
const userId = args.get('userId');

if (!serviceAccountPath || !businessId || !userId) {
  console.error(
    'Usage: node functions/tools/seed-emulator.mjs --serviceAccount <path> --projectId <id> --businessId <id> --userId <id>',
  );
  process.exit(1);
}

const resolvedServiceAccount = path.resolve(serviceAccountPath);
if (!fs.existsSync(resolvedServiceAccount)) {
  console.error(`Service account file not found: ${resolvedServiceAccount}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(resolvedServiceAccount, 'utf8'),
);

const prodApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    projectId,
  },
  'prod',
);

const emulatorApp = admin.initializeApp(
  {
    projectId,
  },
  'emulator',
);

const prodDb = getFirestore(prodApp);
const emulatorDb = getFirestore(emulatorApp);
emulatorDb.settings({
  host: '127.0.0.1:8081',
  ssl: false,
});

const copyDoc = async (sourceDoc, targetDoc) => {
  const snapshot = await sourceDoc.get();
  if (!snapshot.exists) return 0;
  await targetDoc.set(snapshot.data());
  return 1;
};

const copyCollection = async (sourceCol, targetCol, stats) => {
  const snapshot = await sourceCol.get();
  for (const docSnap of snapshot.docs) {
    const targetDoc = targetCol.doc(docSnap.id);
    await targetDoc.set(docSnap.data());
    stats.docs += 1;
    const subcollections = await sourceCol.doc(docSnap.id).listCollections();
    for (const subcol of subcollections) {
      const targetSub = targetDoc.collection(subcol.id);
      await copyCollection(subcol, targetSub, stats);
    }
  }
};

const copyWithSubcollections = async (sourceDoc, targetDoc, stats) => {
  const copied = await copyDoc(sourceDoc, targetDoc);
  stats.docs += copied;
  const subcollections = await sourceDoc.listCollections();
  for (const subcol of subcollections) {
    const targetSub = targetDoc.collection(subcol.id);
    await copyCollection(subcol, targetSub, stats);
  }
};

const run = async () => {
  const stats = { docs: 0 };
  console.log('[Seed] Starting full clone to emulator...');
  console.log(`[Seed] Project: ${projectId}`);
  console.log(`[Seed] User: users/${userId}`);
  console.log(`[Seed] Business: businesses/${businessId}`);

  await copyWithSubcollections(
    prodDb.collection('users').doc(userId),
    emulatorDb.collection('users').doc(userId),
    stats,
  );

  await copyWithSubcollections(
    prodDb.collection('businesses').doc(businessId),
    emulatorDb.collection('businesses').doc(businessId),
    stats,
  );

  console.log(`[Seed] Done. Documents copied: ${stats.docs}`);
  process.exit(0);
};

run().catch((error) => {
  console.error('[Seed] Failed:', error);
  process.exit(1);
});
