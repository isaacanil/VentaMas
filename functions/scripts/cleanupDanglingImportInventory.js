/*
  Script: cleanupDanglingImportInventory.js

  Purpose:
    Limpia inconsistencias creadas por imports interrumpidos (timeouts, etc):
      - productsStock creados por un actor (createdBy) cuyo batchId NO existe
      - movements creados por un actor (createdBy) cuyo batchId NO existe
      - movements/productsStock cuyo productId NO existe

  Uso (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/cleanupDanglingImportInventory.js --projectId ventamaxpos --businessId <id> --actorUid script_import --dry-run
    node functions/scripts/cleanupDanglingImportInventory.js --projectId ventamaxpos --businessId <id> --actorUid script_import --write
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
const actorUid = getFlag(args, '--actorUid') || 'script_import';
const isWrite = hasFlag(args, '--write');
const isDryRun = !isWrite || hasFlag(args, '--dry-run');

if (!businessId) {
  console.error(
    'Missing required args. Example:\n' +
      '  node functions/scripts/cleanupDanglingImportInventory.js --projectId ventamaxpos --businessId <id> --actorUid script_import --dry-run\n' +
      '  node functions/scripts/cleanupDanglingImportInventory.js --projectId ventamaxpos --businessId <id> --actorUid script_import --write',
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp(projectId ? { projectId } : undefined);
}

const db = admin.firestore();

const run = async () => {
  const bizRef = db.collection('businesses').doc(businessId);
  const productsCol = bizRef.collection('products');
  const batchesCol = bizRef.collection('batches');
  const stockCol = bizRef.collection('productsStock');
  const movementsCol = bizRef.collection('movements');

  console.log('[Cleanup] businessId:', businessId);
  console.log('[Cleanup] actorUid:', actorUid);
  console.log('[Cleanup] mode:', isDryRun ? 'dry-run' : 'write');

  const productsSnap = await productsCol.get();
  const productIds = new Set(productsSnap.docs.map((d) => d.id));

  const [stockSnap, movementSnap] = await Promise.all([
    stockCol.where('createdBy', '==', actorUid).get(),
    movementsCol.where('createdBy', '==', actorUid).get(),
  ]);
  const batchSnap = await batchesCol.where('createdBy', '==', actorUid).get();

  const batchIdsToCheck = new Set();
  const candidates = {
    stockMissingBatch: [],
    stockMissingProduct: [],
    movementMissingBatch: [],
    movementMissingProduct: [],
    orphanBatches: [],
  };

  for (const d of stockSnap.docs) {
    const data = d.data() || {};
    const batchId = typeof data.batchId === 'string' ? data.batchId : null;
    if (batchId) batchIdsToCheck.add(batchId);
    const pid = typeof data.productId === 'string' ? data.productId : null;
    if (pid && !productIds.has(pid)) {
      candidates.stockMissingProduct.push({ id: d.id, productId: pid, batchId, qty: data.quantity ?? null });
    }
  }

  for (const d of movementSnap.docs) {
    const data = d.data() || {};
    const batchId = typeof data.batchId === 'string' ? data.batchId : null;
    if (batchId) batchIdsToCheck.add(batchId);
    const pid = typeof data.productId === 'string' ? data.productId : null;
    if (pid && !productIds.has(pid)) {
      candidates.movementMissingProduct.push({
        id: d.id,
        productId: pid,
        batchId,
        qty: data.quantity ?? null,
        reason: data.movementReason ?? null,
      });
    }
  }

  // Determine which batchIds are missing
  const batchIdList = Array.from(batchIdsToCheck);
  const missingBatchIds = new Set();
  const chunkSize = 200;
  for (let i = 0; i < batchIdList.length; i += chunkSize) {
    const chunk = batchIdList.slice(i, i + chunkSize);
    const snaps = await Promise.all(chunk.map((id) => batchesCol.doc(id).get()));
    snaps.forEach((snap, idx) => {
      if (!snap.exists) missingBatchIds.add(chunk[idx]);
    });
  }

  for (const d of stockSnap.docs) {
    const data = d.data() || {};
    const batchId = typeof data.batchId === 'string' ? data.batchId : null;
    if (batchId && missingBatchIds.has(batchId)) {
      candidates.stockMissingBatch.push({ id: d.id, batchId, productId: data.productId ?? null, qty: data.quantity ?? null });
    }
  }

  for (const d of movementSnap.docs) {
    const data = d.data() || {};
    const batchId = typeof data.batchId === 'string' ? data.batchId : null;
    if (batchId && missingBatchIds.has(batchId)) {
      candidates.movementMissingBatch.push({
        id: d.id,
        batchId,
        productId: data.productId ?? null,
        qty: data.quantity ?? null,
        reason: data.movementReason ?? null,
      });
    }
  }

  // Orphan batches: batch docs created by actor that have no stock/movement referencing them.
  const stockBatchIds = new Set(
    stockSnap.docs
      .map((d) => d.data()?.batchId)
      .filter((id) => typeof id === 'string'),
  );
  const movementBatchIds = new Set(
    movementSnap.docs
      .map((d) => d.data()?.batchId)
      .filter((id) => typeof id === 'string'),
  );
  for (const d of batchSnap.docs) {
    const id = d.id;
    if (!stockBatchIds.has(id) && !movementBatchIds.has(id)) {
      const data = d.data() || {};
      candidates.orphanBatches.push({
        id,
        productId: data.productId ?? null,
        qty: data.quantity ?? null,
        numberId: data.numberId ?? null,
      });
    }
  }

  const uniqueDeletes = new Map(); // path -> {col,id}
  const addDelete = (col, id) => uniqueDeletes.set(`${col}/${id}`, { col, id });

  candidates.stockMissingBatch.forEach((x) => addDelete('productsStock', x.id));
  candidates.stockMissingProduct.forEach((x) => addDelete('productsStock', x.id));
  candidates.movementMissingBatch.forEach((x) => addDelete('movements', x.id));
  candidates.movementMissingProduct.forEach((x) => addDelete('movements', x.id));
  candidates.orphanBatches.forEach((x) => addDelete('batches', x.id));

  console.log('[Cleanup] stockMissingBatch:', candidates.stockMissingBatch.length);
  console.log('[Cleanup] stockMissingProduct:', candidates.stockMissingProduct.length);
  console.log('[Cleanup] movementMissingBatch:', candidates.movementMissingBatch.length);
  console.log('[Cleanup] movementMissingProduct:', candidates.movementMissingProduct.length);
  console.log('[Cleanup] orphanBatches:', candidates.orphanBatches.length);
  console.log('[Cleanup] total unique deletes:', uniqueDeletes.size);

  if (!uniqueDeletes.size) {
    console.log('[Cleanup] Nothing to delete.');
    return;
  }

  // Print a small sample for visibility
  const sample = Array.from(uniqueDeletes.entries()).slice(0, 10).map(([path]) => path);
  console.log('[Cleanup] sample deletes:', sample);

  if (isDryRun) {
    console.log('[Cleanup] Dry-run: no deletes performed.');
    return;
  }

  const deletes = Array.from(uniqueDeletes.values());
  const maxOps = 450;
  let batch = db.batch();
  let opCount = 0;
  let batchNum = 0;

  for (const del of deletes) {
    const ref = bizRef.collection(del.col).doc(del.id);
    batch.delete(ref);
    opCount += 1;
    if (opCount >= maxOps) {
      batchNum += 1;
      console.log(`[Cleanup] committing delete batch ${batchNum} (${opCount} ops)...`);
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount) {
    batchNum += 1;
    console.log(`[Cleanup] committing delete batch ${batchNum} (${opCount} ops)...`);
    await batch.commit();
  }

  console.log('[Cleanup] Done.');
};

run().catch((error) => {
  console.error('[Cleanup] Failed:', error);
  process.exit(1);
});
