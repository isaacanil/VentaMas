/*
  Script: migrateLegacyToBillingAccounts.js

  Purpose:
    Vincular negocios legacy a billingAccounts owner-level sin cambiar plan comercial.
    Por defecto deja plan `legacy` para no impactar usuarios actuales.

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/billing/migrateLegacyToBillingAccounts.js --dry-run
    node functions/scripts/billing/migrateLegacyToBillingAccounts.js --write
*/

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const shouldWrite = process.argv.includes('--write');
const limitArgIdx = process.argv.findIndex((arg) => arg === '--limit');
const limit =
  limitArgIdx >= 0 && process.argv[limitArgIdx + 1]
    ? Math.max(1, Number(process.argv[limitArgIdx + 1]) || 0)
    : null;

const resolveOwnerUid = (data) => {
  const root = asRecord(data);
  const businessNode = asRecord(root.business);
  return (
    toCleanString(root.ownerUid) ||
    toCleanString(businessNode.ownerUid) ||
    toCleanString(root.billingContactUid) ||
    toCleanString(businessNode.billingContactUid) ||
    null
  );
};

const resolveBillingAccountId = (ownerUid) => `acct_${ownerUid}`;

const run = async () => {
  const businessesSnap = await db.collection('businesses').get();
  let scanned = 0;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  const samples = [];

  for (const businessDoc of businessesSnap.docs) {
    scanned += 1;
    if (limit && scanned > limit) break;

    const businessId = businessDoc.id;
    const data = businessDoc.data() || {};
    const ownerUid = resolveOwnerUid(data);
    if (!ownerUid) {
      failed += 1;
      continue;
    }

    const billingAccountId = resolveBillingAccountId(ownerUid);
    const businessBillingAccountId = toCleanString(data.billingAccountId);
    if (businessBillingAccountId === billingAccountId) {
      skipped += 1;
      continue;
    }

    if (samples.length < 20) {
      samples.push({ businessId, ownerUid, billingAccountId });
    }

    if (shouldWrite) {
      const accountRef = db.doc(`billingAccounts/${billingAccountId}`);
      const linkRef = accountRef.collection('businessLinks').doc(businessId);

      await Promise.all([
        accountRef.set(
          {
            billingAccountId,
            ownerUid,
            status: 'active',
            provider: 'azul',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        linkRef.set(
          {
            businessId,
            ownerUid,
            status: 'active',
            linkedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        businessDoc.ref.set(
          {
            billingAccountId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            business: {
              ...asRecord(data.business),
              billingAccountId,
            },
          },
          { merge: true },
        ),
      ]);
    }

    migrated += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: shouldWrite ? 'write' : 'dry-run',
        scanned,
        migrated,
        skipped,
        failed,
        samples,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[migrateLegacyToBillingAccounts] failed', error);
  process.exitCode = 1;
});
