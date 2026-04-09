/*
  Script: fixBatchCounterFromBatches.js

  Purpose:
    Ajusta businesses/{businessId}/counters/batches.value al max(numberId)
    encontrado en businesses/{businessId}/batches.

  Uso (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/fixBatchCounterFromBatches.js --projectId ventamaxpos --businessId <id> --dry-run
    node functions/scripts/fixBatchCounterFromBatches.js --projectId ventamaxpos --businessId <id> --write
*/

import process from 'process';
import admin from 'firebase-admin';

const getFlag = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const hasFlag = (args, name) => args.includes(name);

const args = process.argv.slice(2);
const businessId = getFlag(args, '--businessId');
const projectId =
  getFlag(args, '--projectId') ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  null;
const isWrite = hasFlag(args, '--write');
const isDryRun = !isWrite || hasFlag(args, '--dry-run');

if (!businessId) {
  console.error(
    'Missing required args. Example:\n' +
      '  node functions/scripts/fixBatchCounterFromBatches.js --projectId ventamaxpos --businessId <id> --dry-run\n' +
      '  node functions/scripts/fixBatchCounterFromBatches.js --projectId ventamaxpos --businessId <id> --write',
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp(projectId ? { projectId } : undefined);
}

const db = admin.firestore();

const run = async () => {
  const bizRef = db.collection('businesses').doc(businessId);
  const batchesCol = bizRef.collection('batches');
  const counterRef = bizRef.collection('counters').doc('batches');

  const batchesSnap = await batchesCol.get();
  let maxNumberId = 0;
  let counted = 0;
  for (const d of batchesSnap.docs) {
    const v = d.data()?.numberId;
    if (typeof v === 'number' && Number.isFinite(v)) {
      counted += 1;
      if (v > maxNumberId) maxNumberId = v;
    }
  }

  const counterSnap = await counterRef.get();
  const currentValue = counterSnap.exists ? counterSnap.data()?.value ?? null : null;

  console.log('[FixCounter] businessId:', businessId);
  console.log('[FixCounter] batches:', batchesSnap.size, 'with numberId:', counted);
  console.log('[FixCounter] max(numberId):', maxNumberId);
  console.log('[FixCounter] current counter.value:', currentValue);
  console.log('[FixCounter] mode:', isDryRun ? 'dry-run' : 'write');

  if (isDryRun) return;

  await counterRef.set({ value: maxNumberId }, { merge: true });
  console.log('[FixCounter] Updated counter.value to', maxNumberId);
};

run().catch((error) => {
  console.error('[FixCounter] Failed:', error);
  process.exit(1);
});

