/*
  Script: reconcileBusinessUsageSnapshot.js

  Purpose:
    Reconciliar usage/current de un negocio usando conteos reales de Firestore.

  Auth:
    Usa Application Default Credentials o una service account local.

  Qué actualiza:
    businesses/{businessId}/usage/current

  Métricas incluidas:
    - productsTotal
    - warehousesTotal
    - clientsTotal
    - suppliersTotal
    - usersTotal
    - openCashRegisters
    - businessesTotal

  Resolución del negocio:
    - Por --businessId explícito
    - O por --userName y --businessIdPrefix
    - Por defecto intenta: userName=dev#3407 y businessIdPrefix=X

  Usage (PowerShell 7.5.4):
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --dry-run
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --write
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --userName dev#3407 --businessIdPrefix X --write
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --businessId X... --write
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --service-account C:\path\key.json --write
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

const SCRIPT_NAME = 'reconcileBusinessUsageSnapshot';

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

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const projectId = toCleanString(getFlagValue(args, '--projectId'));
const explicitBusinessId = toCleanString(getFlagValue(args, '--businessId'));
const userName = toCleanString(getFlagValue(args, '--userName')) || 'dev#3407';
const businessIdPrefix =
  toCleanString(getFlagValue(args, '--businessIdPrefix')) || 'X';
const serviceAccountPath =
  toCleanString(getFlagValue(args, '--service-account')) ||
  toCleanString(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!projectId) {
  console.error(
    'Usage: node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId <firebase-project-id> [--businessId <id>] [--userName <name>] [--businessIdPrefix <prefix>] [--service-account <path>] [--dry-run|--write]',
  );
  process.exit(1);
}

if (!shouldWrite) {
  console.log(
    `[${SCRIPT_NAME}] Running in DRY-RUN mode (pass --write to persist changes).`,
  );
}

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return admin.credential.cert(JSON.parse(raw));
};

const initializeAdminApp = () => {
  if (admin.apps.length) return admin.app();

  const options = {
    projectId,
    credential: serviceAccountPath
      ? loadServiceAccountCredential(serviceAccountPath)
      : admin.credential.applicationDefault(),
  };

  return admin.initializeApp(options);
};

const summarizeUser = (uid, data) => {
  const root = asRecord(data);
  const legacy = asRecord(root.user);
  return {
    uid,
    name: toCleanString(root.name) || toCleanString(legacy.name),
    displayName:
      toCleanString(root.displayName) || toCleanString(legacy.displayName),
    businessId:
      toCleanString(root.businessId) ||
      toCleanString(root.businessID) ||
      toCleanString(legacy.businessId) ||
      toCleanString(legacy.businessID),
    activeBusinessId:
      toCleanString(root.activeBusinessId) ||
      toCleanString(legacy.activeBusinessId),
    role: toCleanString(root.role) || toCleanString(legacy.role),
  };
};

const matchesOwnership = (businessData, ownerUid) => {
  const root = asRecord(businessData);
  const businessNode = asRecord(root.business);

  return [
    root.ownerUid,
    root.billingContactUid,
    businessNode.ownerUid,
    businessNode.billingContactUid,
  ].some((value) => toCleanString(value) === ownerUid);
};

const app = initializeAdminApp();
const db = admin.firestore();
const resolvedProjectId =
  toCleanString(app.options.projectId) ||
  toCleanString(process.env.GOOGLE_CLOUD_PROJECT) ||
  toCleanString(process.env.GCLOUD_PROJECT) ||
  projectId;

const getCount = async (query) => {
  const snapshot = await query.count().get();
  return Number(snapshot.data().count || 0);
};

const findUserByName = async (normalizedName) => {
  const queries = [
    db.collection('users').where('name', '==', normalizedName).limit(10),
    db.collection('users').where('displayName', '==', normalizedName).limit(10),
  ];

  const seen = new Map();
  for (const query of queries) {
    // eslint-disable-next-line no-await-in-loop
    const snapshot = await query.get();
    snapshot.docs.forEach((docSnap) => {
      if (seen.has(docSnap.id)) return;
      seen.set(docSnap.id, {
        uid: docSnap.id,
        summary: summarizeUser(docSnap.id, docSnap.data() || {}),
      });
    });
  }

  const matches = [...seen.values()];
  if (!matches.length) {
    throw new Error(`No se encontró usuario con name/displayName "${normalizedName}".`);
  }
  if (matches.length > 1) {
    throw new Error(
      `Se encontraron múltiples usuarios para "${normalizedName}": ${matches.map((item) => item.uid).join(', ')}`,
    );
  }
  return matches[0];
};

const listBusinessIdsFromBillingLinks = async (ownerUid) => {
  const snapshot = await db
    .collection('billingAccounts')
    .doc(`acct_${ownerUid}`)
    .collection('businessLinks')
    .get();

  return snapshot.docs
    .map((docSnap) => toCleanString(docSnap.id))
    .filter(Boolean);
};

const scanBusinessesForOwner = async (ownerUid) => {
  const snapshot = await db.collection('businesses').get();

  return snapshot.docs
    .map((docSnap) => ({
      id: toCleanString(docSnap.id),
      data: docSnap.data() || {},
    }))
    .filter((entry) => entry.id && matchesOwnership(entry.data, ownerUid))
    .map((entry) => entry.id);
};

const resolveBusinessId = async () => {
  if (explicitBusinessId) {
    return {
      businessId: explicitBusinessId,
      resolution: 'explicit-businessId',
      ownerUid: null,
      user: null,
      candidates: [explicitBusinessId],
    };
  }

  const user = await findUserByName(userName);
  const ownerUid = user.uid;

  let candidates = await listBusinessIdsFromBillingLinks(ownerUid);
  if (!candidates.length) {
    candidates = await scanBusinessesForOwner(ownerUid);
  }

  const filtered = candidates.filter((businessId) =>
    businessIdPrefix ? businessId.startsWith(businessIdPrefix) : true,
  );

  if (!filtered.length) {
    throw new Error(
      `No se encontró negocio para ${userName} con prefijo ${businessIdPrefix}. Candidatos vistos: ${candidates.join(', ') || 'ninguno'}`,
    );
  }

  if (filtered.length > 1) {
    throw new Error(
      `Se encontraron múltiples negocios para ${userName} con prefijo ${businessIdPrefix}: ${filtered.join(', ')}`,
    );
  }

  return {
    businessId: filtered[0],
    resolution: 'userName+businessIdPrefix',
    ownerUid,
    user: user.summary,
    candidates: filtered,
  };
};

const buildUsageSnapshot = async ({ businessId, ownerUid }) => {
  const businessRef = db.collection('businesses').doc(businessId);

  const productsTotal = await getCount(businessRef.collection('products'));
  const warehousesTotal = await getCount(businessRef.collection('warehouses'));
  const clientsTotal = await getCount(businessRef.collection('clients'));
  const suppliersTotal = await getCount(businessRef.collection('providers'));
  const usersTotal = await getCount(businessRef.collection('members'));
  const openCashRegistersOpen = await getCount(
    businessRef.collection('cashCounts').where('cashCount.state', '==', 'open'),
  );
  const openCashRegistersClosing = await getCount(
    businessRef
      .collection('cashCounts')
      .where('cashCount.state', '==', 'closing'),
  );
  const businessesTotal = ownerUid
    ? await getCount(
        db
          .collection('billingAccounts')
          .doc(`acct_${ownerUid}`)
          .collection('businessLinks'),
      )
    : 0;

  return {
    businessId,
    productsTotal,
    warehousesTotal,
    clientsTotal,
    suppliersTotal,
    usersTotal,
    openCashRegisters: openCashRegistersOpen + openCashRegistersClosing,
    businessesTotal,
  };
};

const run = async () => {
  const resolution = await resolveBusinessId();
  const usageRef = db.doc(`businesses/${resolution.businessId}/usage/current`);

  const [usageSnap, nextUsage] = await Promise.all([
    usageRef.get(),
    buildUsageSnapshot({
      businessId: resolution.businessId,
      ownerUid: resolution.ownerUid,
    }),
  ]);

  const currentUsage = usageSnap.exists ? usageSnap.data() || {} : {};
  const payload = {
    ...currentUsage,
    ...nextUsage,
    reconciledBy: SCRIPT_NAME,
    reconciledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (shouldWrite) {
    await usageRef.set(payload, { merge: true });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: shouldWrite ? 'write' : 'dry-run',
        projectId: resolvedProjectId,
        resolution,
        currentUsage,
        nextUsage,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(`[${SCRIPT_NAME}] failed:`, error);
  process.exitCode = 1;
});
