/*
  Script: backfillBusinessSubscriptions.js

  Purpose:
    Ensure each business has a minimal subscription node so:
      - Frontend can display subscription status (e.g. Business Selector pill)
      - Backend subscription enforcement can be enabled consistently

  Writes (merge):
    businesses/{businessId}.subscription
    businesses/{businessId}.business.subscription (legacy mirror)

  Defaults (configurable):
    status: "active"
    planId: "legacy"
    provider: "manual"

  Usage (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/backfillBusinessSubscriptions.js --dry-run
    node functions/scripts/backfillBusinessSubscriptions.js --write

  Flags:
    --businessId <id>   Optional. If omitted, processes all businesses.
    --status <value>    Optional. Default: active
    --planId <value>    Optional. Default: legacy
    --dry-run           Default. Prints what would be written.
    --write             Actually writes missing subscription nodes.
    --limit <n>         Optional. Stop after scanning n businesses.
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

const getFlagValue = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const parseLimit = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : null;
};

const resolveExistingSubscription = (businessData) => {
  const root = asRecord(businessData);
  const nestedBusiness = asRecord(root.business);
  const rootSubscription = asRecord(root.subscription);
  const nestedSubscription = asRecord(nestedBusiness.subscription);

  const status =
    toCleanString(rootSubscription.status)?.toLowerCase() ||
    toCleanString(nestedSubscription.status)?.toLowerCase() ||
    null;
  const planId =
    toCleanString(rootSubscription.planId) || toCleanString(nestedSubscription.planId) || null;

  return { status, planId };
};

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const businessIdFilter = toCleanString(getFlagValue(args, '--businessId'));
const limit = parseLimit(getFlagValue(args, '--limit'));

const statusDefault =
  toCleanString(getFlagValue(args, '--status'))?.toLowerCase() || 'active';
const planIdDefault = toCleanString(getFlagValue(args, '--planId')) || 'legacy';

if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: node functions/scripts/backfillBusinessSubscriptions.js [--businessId <id>] [--status <value>] [--planId <value>] [--dry-run|--write] [--limit <n>]',
  );
  process.exit(0);
}

if (!shouldWrite) {
  console.log(
    '[backfillBusinessSubscriptions] Running in DRY-RUN mode (pass --write to apply changes).',
  );
}

const run = async () => {
  let scanned = 0;
  let matched = 0;
  let created = 0;
  let existing = 0;

  const samples = [];

  const pageSize = 250;
  let lastDoc = null;

  while (true) {
    let query = db
      .collection('businesses')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const businessDoc of snapshot.docs) {
      scanned += 1;
      if (limit && scanned > limit) break;

      const businessId = businessDoc.id;
      if (businessIdFilter && businessId !== businessIdFilter) {
        continue;
      }
      matched += 1;

      const data = businessDoc.data() || {};
      const existingSub = resolveExistingSubscription(data);
      if (existingSub.status) {
        existing += 1;
        continue;
      }

      const payload = {
        planId: planIdDefault,
        status: statusDefault,
        provider: 'manual',
        source: 'maintenance_backfill',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (samples.length < 10) {
        const bizNode = asRecord(data.business);
        samples.push({
          businessId,
          name: toCleanString(data.name) || toCleanString(bizNode.name) || null,
          status: payload.status,
          planId: payload.planId,
        });
      }

      if (shouldWrite) {
        await businessDoc.ref.set(
          {
            subscription: payload,
            business: {
              ...(asRecord(data.business) || {}),
              subscription: payload,
            },
          },
          { merge: true },
        );
      }

      created += 1;
    }

    if (limit && scanned >= limit) break;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: shouldWrite ? 'write' : 'dry-run',
        businessIdFilter: businessIdFilter || null,
        statusDefault,
        planIdDefault,
        scanned,
        matched,
        created,
        existing,
        samples,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[backfillBusinessSubscriptions] failed:', error);
  process.exitCode = 1;
});

