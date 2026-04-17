/**
 * diagnose-invoice-missing-fields.mjs
 *
 * READ-ONLY diagnostic: muestra los campos relevantes para el validador DGII 607
 * de las facturas con `data.numberID` específico (ej. 953, 954).
 *
 * Uso (PowerShell, desde functions/):
 *   node scripts/diagnose-invoice-missing-fields.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P `
 *     --numberIds=953,954
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

const parseArgs = () => {
  const rawArgs = process.argv.slice(2);
  const args = Object.fromEntries(
    rawArgs
      .map((raw) => raw.split('='))
      .map(([key, ...rest]) => [key.replace(/^--/, ''), rest.join('=') ?? '']),
  );
  return {
    keyPath: args.keyPath || '',
    projectId: args.projectId || 'ventamaxpos',
    businessId: args.businessId || 'X63aIFwHzk3r0gmT8w6P',
    numberIds: args.numberIds
      ? args.numberIds.split(',').map((n) => Number(n.trim())).filter(Number.isFinite)
      : [],
  };
};

const toClean = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

const main = async () => {
  const { keyPath, projectId, businessId, numberIds } = parseArgs();

  if (!numberIds.length) {
    console.error('Debes pasar --numberIds=953,954 (al menos uno).');
    process.exit(1);
  }

  // ── Admin SDK init ──────────────────────────────────────────────────────────
  if (keyPath) {
    const credential = admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf8')));
    admin.initializeApp({ credential, projectId });
  } else {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  const collPath = `businesses/${businessId}/invoices`;
  console.log(`\nBusiness  : ${businessId}`);
  console.log(`Collection: ${collPath}`);
  console.log(`NumberIDs : ${numberIds.join(', ')}\n`);

  // Firestore doesn't support OR queries on the same field in older SDKs,
  // so we run one query per numberID.
  for (const numberID of numberIds) {
    const snap = await db
      .collection(collPath)
      .where('data.numberID', '==', numberID)
      .get();

    if (snap.empty) {
      console.log(`── Invoice #${numberID} ── NOT FOUND\n`);
      continue;
    }

    for (const docSnap of snap.docs) {
      const raw = docSnap.data();
      const d = raw?.data ?? {};
      const client = (d?.client && typeof d.client === 'object') ? d.client : {};

      console.log(`── Invoice #${numberID}  (docId: ${docSnap.id}) ──`);
      console.log(`  data.numberID          : ${d?.numberID ?? '❌ missing'}`);
      console.log(`  data.NCF               : ${toClean(d?.NCF) ?? toClean(d?.comprobante) ?? '❌ missing'}`);
      console.log(`  data.status            : ${toClean(d?.status) ?? '❌ missing'}`);
      console.log(`  data.date              : ${d?.date?.toDate?.()?.toISOString() ?? d?.date ?? '❌ missing'}`);
      console.log(`  data.client            : ${JSON.stringify(client)}`);
      console.log(`    client.id            : ${toClean(client.id) ?? '❌ missing'}`);
      console.log(`    client.rnc           : ${toClean(client.rnc) ?? '❌ missing'}`);
      console.log(`    client.personalID    : ${toClean(client.personalID) ?? '❌ missing'}`);
      console.log(`    client.name          : ${toClean(client.name) ?? '❌ missing'}`);
      console.log(`  data.totalPurchase     : ${JSON.stringify(d?.totalPurchase)}`);
      console.log(`  data.totalTaxes        : ${JSON.stringify(d?.totalTaxes)}`);
      console.log(`  data.selectedTaxReceiptType: ${toClean(d?.selectedTaxReceiptType) ?? '❌ missing'}`);
      console.log(`  raw top-level keys     : ${Object.keys(raw).join(', ')}`);
      console.log(`  raw.data keys          : ${Object.keys(d).join(', ')}\n`);
    }
  }

  console.log('Done (read-only, no changes made).');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
