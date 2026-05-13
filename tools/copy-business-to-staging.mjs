#!/usr/bin/env node
/* eslint-env node */
/* global console, setTimeout */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

import {
  deserializeFromExport,
  serializeForExport,
  sortDocsForImport,
} from './business-slice/utils.mjs';

const requireFromFunctions = createRequire(
  path.resolve(process.cwd(), 'functions/package.json'),
);
const admin = requireFromFunctions('firebase-admin');
const bcrypt = requireFromFunctions('bcryptjs');

const DEFAULT_BUSINESS_ID = 'X63aIFwHzk3r0gmT8w6P';
const DEFAULT_SOURCE_PROJECT = 'ventamaxpos';
const DEFAULT_TARGET_PROJECT = 'ventamax-staging';
const DEFAULT_SOURCE_KEY =
  'C:/Dev/keys/VentaMas/ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json';
const DEFAULT_TARGET_KEY =
  'C:/Dev/keys/VentaMas-staging/ventamax-staging-firebase-adminsdk-fbsvc-5400dd05d4.json';
const DEFAULT_USERNAME = 'dev#3407';
const DEFAULT_PASSWORD_ENV = 'STAGING_USER_PASSWORD';

const USAGE = `
Uso:
  node tools/copy-business-to-staging.mjs --dry-run
  node tools/copy-business-to-staging.mjs --write

Opciones:
  --business-id=<id>          Default: ${DEFAULT_BUSINESS_ID}
  --source-project=<id>       Default: ${DEFAULT_SOURCE_PROJECT}
  --target-project=<id>       Default: ${DEFAULT_TARGET_PROJECT}
  --source-key=<path>         Default: ${DEFAULT_SOURCE_KEY}
  --target-key=<path>         Default: ${DEFAULT_TARGET_KEY}
  --username=<name>           Default: ${DEFAULT_USERNAME}
  --password-env=<name>       Default: ${DEFAULT_PASSWORD_ENV}
  --batch-size=<n>            Default: 300
  --batch-delay-ms=<n>        Default: 0. Pausa entre batches.
  --start-index=<n>           Default: 0. Reanuda desde indice de documento.
  --print-range=<start:end>   Imprime paths del rango filtrado y termina.
  --business-collections=<csv>
                              Solo lee estas subcolecciones directas del negocio.
  --copy-member-users         Copia root users vinculados a members del negocio.
  --include-prefix=<csv>      Solo escribe paths que empiezan con esos prefijos.
  --exclude-prefix=<csv>      Excluye paths que empiezan con esos prefijos.
  --retries=<n>               Default: 3. Reintentos por batch.
  --retry-delay-ms=<n>        Default: 1500.
  --write-mode=<batch|bulk>   Default: batch.
  --quiet-scan                No imprime cada coleccion descubierta.
  --recursive                 Recorre subcolecciones de cada documento. Lento.
  --write                     Escribe en target.
  --dry-run                   Solo lee source y resume docs.
  --help                      Muestra ayuda.
`;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const parseArgs = (argv) => {
  const flags = {};
  for (const arg of argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      continue;
    }
    if (arg === '--write') {
      flags.write = true;
      continue;
    }
    if (arg === '--dry-run') {
      flags.dryRun = true;
      continue;
    }
    if (arg === '--recursive') {
      flags.recursive = true;
      continue;
    }
    if (arg === '--quiet-scan') {
      flags['quiet-scan'] = true;
      continue;
    }
    if (arg === '--copy-member-users') {
      flags['copy-member-users'] = true;
      continue;
    }
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      flags[match[1]] = match[2];
      continue;
    }
    throw new Error(`Argumento no reconocido: ${arg}`);
  }
  return flags;
};

const cleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const parseInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseNonNegativeInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseCsv = (value) =>
  cleanString(value)
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const pathMatchesPrefix = (pathValue, prefix) =>
  pathValue === prefix || pathValue.startsWith(`${prefix}/`);

const loadCredential = (keyPath) => {
  const normalized = cleanString(keyPath);
  if (!normalized) return admin.credential.applicationDefault();
  if (!fs.existsSync(normalized)) {
    throw new Error(`Service account no existe: ${normalized}`);
  }
  return admin.credential.cert(JSON.parse(fs.readFileSync(normalized, 'utf8')));
};

const initDb = ({ appName, projectId, keyPath }) => {
  const existing = admin.apps.find((app) => app.name === appName);
  const app =
    existing ??
    admin.initializeApp(
      {
        credential: loadCredential(keyPath),
        projectId,
      },
      appName,
    );
  return admin.firestore(app);
};

const blockedUserKeys = new Set([
  'emailVerification',
  'history',
  'lockUntil',
  'loginAttempts',
  'presence',
  'sessionLogs',
  'sessionToken',
  'sessionTokens',
  'verification',
]);

const deleteBlockedKeysDeep = (value, seen = new WeakSet()) => {
  if (Array.isArray(value)) {
    return value.map((item) => deleteBlockedKeysDeep(item, seen));
  }
  if (!isRecord(value)) return value;
  if (
    value instanceof Date ||
    typeof value.toMillis === 'function' ||
    typeof value.path === 'string'
  ) {
    return value;
  }
  if (seen.has(value)) return null;
  seen.add(value);
  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    if (blockedUserKeys.has(key)) continue;
    output[key] = deleteBlockedKeysDeep(nested, seen);
  }
  seen.delete(value);
  return output;
};

const summarizeByCollection = (entries) => {
  const counts = new Map();
  for (const entry of entries) {
    const segments = entry.path.split('/');
    const collectionPath = segments.filter((_, index) => index % 2 === 0).join('/');
    counts.set(collectionPath, (counts.get(collectionPath) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
};

const addEntry = (entriesByPath, pathValue, data, domain) => {
  entriesByPath.set(pathValue, {
    path: pathValue,
    domain,
    data: serializeForExport(data),
  });
};

const collectDocTree = async (docRef, entriesByPath, domain) => {
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error(`No existe ${docRef.path}`);
  }
  addEntry(entriesByPath, snap.ref.path, snap.data(), domain);

  const collections = await snap.ref.listCollections();
  for (const collectionRef of collections) {
    const childDocs = await collectionRef.get();
    for (const childDoc of childDocs.docs) {
      await collectDocTree(childDoc.ref, entriesByPath, domain);
    }
  }
};

const collectCollection = async (
  collectionRef,
  entriesByPath,
  domain,
  options = {},
) => {
  const snap = await collectionRef.get();
  if (snap.size > 0 && !options.quiet) {
    console.log(`- ${collectionRef.path}: ${snap.size}`);
  }
  for (const docSnap of snap.docs) {
    addEntry(entriesByPath, docSnap.ref.path, docSnap.data(), domain);
  }
  return snap.docs;
};

const collectNamedSubcollections = async ({
  docs,
  entriesByPath,
  names,
  domain,
  quiet,
}) => {
  for (const docSnap of docs) {
    for (const name of names) {
      await collectCollection(docSnap.ref.collection(name), entriesByPath, domain, {
        quiet,
      });
    }
  }
};

const collectBusinessDirect = async ({
  db,
  businessId,
  entriesByPath,
  quiet,
  rootCollectionIds = [],
}) => {
  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) {
    throw new Error(`No existe ${businessRef.path}`);
  }
  addEntry(entriesByPath, businessSnap.ref.path, businessSnap.data(), 'business');

  const rootCollections = await businessRef.listCollections();
  const docsByRootCollection = new Map();
  if (!quiet) {
    console.log('');
    console.log('Subcolecciones directas del negocio:');
  }
  for (const collectionRef of rootCollections) {
    if (
      rootCollectionIds.length > 0 &&
      !rootCollectionIds.includes(collectionRef.id)
    ) {
      continue;
    }
    const docs = await collectCollection(collectionRef, entriesByPath, 'business', {
      quiet,
    });
    docsByRootCollection.set(collectionRef.id, docs);
  }

  const invoicesV2 = docsByRootCollection.get('invoicesV2') || [];
  const warehouses = docsByRootCollection.get('warehouses') || [];
  const settings = docsByRootCollection.get('settings') || [];
  const usage = docsByRootCollection.get('usage') || [];

  if (!quiet) {
    console.log('');
    console.log('Subcolecciones nested conocidas:');
  }
  await collectNamedSubcollections({
    docs: [],
    entriesByPath,
    names: ['outbox'],
    domain: 'business',
    quiet,
  });
  await collectNamedSubcollections({
    docs: invoicesV2,
    entriesByPath,
    names: ['audit', 'compensations', 'outbox'],
    domain: 'business',
    quiet,
  });

  for (const warehouse of warehouses) {
    const shelves = await collectCollection(
      warehouse.ref.collection('shelves'),
      entriesByPath,
      'business',
      { quiet },
    );
    for (const shelf of shelves) {
      const rows = await collectCollection(
        shelf.ref.collection('rows'),
        entriesByPath,
        'business',
        { quiet },
      );
      await collectNamedSubcollections({
        docs: rows,
        entriesByPath,
        names: ['segments'],
        domain: 'business',
        quiet,
      });
    }
  }

  const accountingSettings = settings.find((docSnap) => docSnap.id === 'accounting');
  if (accountingSettings) {
    await collectCollection(
      accountingSettings.ref.collection('audit'),
      entriesByPath,
      'business',
      { quiet },
    );
  }

  const monthlyUsage = usage.find((docSnap) => docSnap.id === 'monthly');
  if (monthlyUsage) {
    await collectCollection(
      monthlyUsage.ref.collection('entries'),
      entriesByPath,
      'business',
      { quiet },
    );
  }
};

const findUser = async ({ db, username }) => {
  const byName = await db.collection('users').where('name', '==', username).limit(1).get();
  if (!byName.empty) return byName.docs[0];

  const byLegacyName = await db
    .collection('users')
    .where('user.name', '==', username)
    .limit(1)
    .get();
  if (!byLegacyName.empty) return byLegacyName.docs[0];

  throw new Error(`No encontre users con name/user.name = ${username}`);
};

const collectMemberUsers = async ({ db, businessId, entriesByPath }) => {
  const members = await db.collection(`businesses/${businessId}/members`).get();
  const userIds = new Set();

  for (const member of members.docs) {
    const data = member.data() || {};
    for (const candidate of [member.id, data.uid, data.userId, data.id]) {
      const normalized = cleanString(candidate);
      if (normalized) userIds.add(normalized);
    }
  }

  for (const userId of userIds) {
    const userSnap = await db.doc(`users/${userId}`).get();
    if (!userSnap.exists) {
      console.warn(`Usuario miembro no existe en root users: ${userId}`);
      continue;
    }

    addEntry(
      entriesByPath,
      userSnap.ref.path,
      deleteBlockedKeysDeep(userSnap.data() || {}),
      'identity',
    );
  }
};

const prepareUserData = async ({ userSnap, businessId, password }) => {
  const source = deleteBlockedKeysDeep(userSnap.data() || {});
  const passwordHash = await bcrypt.hash(password, 10);
  return {
    ...source,
    id: source.id || userSnap.id,
    uid: source.uid || userSnap.id,
    name: source.name || DEFAULT_USERNAME,
    active: true,
    password: passwordHash,
    passwordChangedAt: null,
    activeBusinessId: businessId,
    lastSelectedBusinessId: businessId,
    loginAttempts: 0,
    lockUntil: null,
  };
};

const ensureMemberEntry = async ({ entriesByPath, businessId, userSnap }) => {
  const memberPath = `businesses/${businessId}/members/${userSnap.id}`;
  if (entriesByPath.has(memberPath)) return;

  const userData = userSnap.data() || {};
  const role =
    cleanString(userData.activeRole) ||
    cleanString(userData.role) ||
    cleanString(userData.type) ||
    'dev';
  addEntry(
    entriesByPath,
    memberPath,
    {
      id: userSnap.id,
      uid: userSnap.id,
      userId: userSnap.id,
      businessId,
      name: cleanString(userData.name) || DEFAULT_USERNAME,
      realName: cleanString(userData.realName) || cleanString(userData.displayName) || null,
      email: cleanString(userData.email) || null,
      active: true,
      role,
      activeRole: role,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    },
    'identity',
  );
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableCommitError = (error) =>
  [4, 10, 13, 14].includes(Number(error?.code));

const commitChunk = async (db, chunk, options = {}) => {
  const retries = Math.max(0, options.retries || 0);
  const retryDelayMs = Math.max(0, options.retryDelayMs || 0);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const batch = db.batch();
    for (const entry of chunk) {
      batch.set(db.doc(entry.path), deserializeFromExport(entry.data, db), {
        merge: false,
      });
    }

    try {
      await batch.commit();
      return;
    } catch (error) {
      if (attempt >= retries || !isRetryableCommitError(error)) {
        throw error;
      }

      const delay = retryDelayMs * (attempt + 1);
      console.warn(
        `Batch commit retry ${attempt + 1}/${retries} after ${delay}ms: ${error.message}`,
      );
      await wait(delay);
    }
  }
};

const writeWithBulkWriter = async (db, entries, options = {}) => {
  const retries = Math.max(0, options.retries || 0);
  const logEvery = Math.max(1, options.logEvery || 500);
  const writer = db.bulkWriter({
    throttling: {
      initialOpsPerSecond: 50,
      maxOpsPerSecond: 200,
    },
  });

  writer.onWriteError((error) => {
    if (
      error.failedAttempts <= retries &&
      isRetryableCommitError({ code: error.code })
    ) {
      console.warn(
        `BulkWriter retry ${error.failedAttempts}/${retries}: ${error.message}`,
      );
      return true;
    }
    return false;
  });

  let scheduled = 0;
  for (const entry of entries) {
    writer.set(db.doc(entry.path), deserializeFromExport(entry.data, db));
    scheduled += 1;
    if (scheduled % logEvery === 0) {
      console.log(`Bulk scheduled: ${scheduled}/${entries.length}`);
    }
  }

  await writer.close();
  console.log(`Bulk scheduled: ${scheduled}/${entries.length}`);
};

const main = async () => {
  const flags = parseArgs(process.argv);
  if (flags.help) {
    console.log(USAGE.trim());
    return;
  }

  const write = flags.write === true;
  if (write && flags.dryRun) {
    throw new Error('Usa --write o --dry-run, no ambos.');
  }

  const businessId = cleanString(flags['business-id']) || DEFAULT_BUSINESS_ID;
  const sourceProjectId =
    cleanString(flags['source-project']) || DEFAULT_SOURCE_PROJECT;
  const targetProjectId =
    cleanString(flags['target-project']) || DEFAULT_TARGET_PROJECT;
  const sourceKey = cleanString(flags['source-key']) || DEFAULT_SOURCE_KEY;
  const targetKey = cleanString(flags['target-key']) || DEFAULT_TARGET_KEY;
  const username = cleanString(flags.username) || DEFAULT_USERNAME;
  const passwordEnv = cleanString(flags['password-env']) || DEFAULT_PASSWORD_ENV;
  const batchSize = parseInteger(flags['batch-size'], 300);
  const batchDelayMs = parseNonNegativeInteger(flags['batch-delay-ms'], 0);
  const startIndex = parseNonNegativeInteger(flags['start-index'], 0);
  const printRange = cleanString(flags['print-range']);
  const businessCollections = parseCsv(flags['business-collections']);
  const copyMemberUsers = flags['copy-member-users'] === true;
  const includePrefixes = parseCsv(flags['include-prefix']);
  const excludePrefixes = parseCsv(flags['exclude-prefix']);
  const retries = parseInteger(flags.retries, 3);
  const retryDelayMs = parseInteger(flags['retry-delay-ms'], 1500);
  const writeMode = cleanString(flags['write-mode']) || 'batch';
  const quietScan = flags['quiet-scan'] === true;
  const recursive = flags.recursive === true;

  if (batchSize > 400) {
    throw new Error('Usa --batch-size <= 400.');
  }
  if (startIndex < 0) {
    throw new Error('Usa --start-index >= 0.');
  }
  if (retries < 0) {
    throw new Error('Usa --retries >= 0.');
  }
  if (!['batch', 'bulk'].includes(writeMode)) {
    throw new Error('Usa --write-mode=batch o --write-mode=bulk.');
  }
  if (write && !process.env[passwordEnv]) {
    throw new Error(`Falta variable de entorno ${passwordEnv}.`);
  }

  console.log('[copy-business-to-staging] start');
  console.log(`source=${sourceProjectId}`);
  console.log(`target=${targetProjectId}`);
  console.log(`business=${businessId}`);
  console.log(`username=${username}`);
  console.log(`mode=${write ? 'write' : 'dry-run'}`);
  console.log(`scan=${recursive ? 'recursive' : 'direct+known-nested'}`);
  console.log(`batchSize=${batchSize}`);
  console.log(`batchDelayMs=${batchDelayMs}`);
  console.log(`startIndex=${startIndex}`);
  if (printRange) {
    console.log(`printRange=${printRange}`);
  }
  if (businessCollections.length > 0) {
    console.log(`businessCollections=${businessCollections.join(',')}`);
  }
  console.log(`copyMemberUsers=${copyMemberUsers ? 'yes' : 'no'}`);
  if (includePrefixes.length > 0) {
    console.log(`includePrefix=${includePrefixes.join(',')}`);
  }
  if (excludePrefixes.length > 0) {
    console.log(`excludePrefix=${excludePrefixes.join(',')}`);
  }
  console.log(`retries=${retries}`);
  console.log(`writeMode=${writeMode}`);

  const sourceDb = initDb({
    appName: 'copy-business-source',
    projectId: sourceProjectId,
    keyPath: sourceKey,
  });

  const entriesByPath = new Map();
  if (recursive) {
    await collectDocTree(sourceDb.doc(`businesses/${businessId}`), entriesByPath, 'business');
  } else {
    await collectBusinessDirect({
      db: sourceDb,
      businessId,
      entriesByPath,
      quiet: quietScan,
      rootCollectionIds: businessCollections,
    });
  }

  if (copyMemberUsers) {
    await collectMemberUsers({ db: sourceDb, businessId, entriesByPath });
  }

  const userSnap = await findUser({ db: sourceDb, username });
  if (write) {
    const preparedUser = await prepareUserData({
      userSnap,
      businessId,
      password: process.env[passwordEnv],
    });
    addEntry(entriesByPath, `users/${userSnap.id}`, preparedUser, 'identity');
  } else {
    addEntry(entriesByPath, `users/${userSnap.id}`, userSnap.data(), 'identity');
  }
  await ensureMemberEntry({ entriesByPath, businessId, userSnap });

  const allEntries = sortDocsForImport([...entriesByPath.values()]);
  const entries = allEntries.filter((entry) => {
    const included =
      includePrefixes.length === 0 ||
      includePrefixes.some((prefix) => pathMatchesPrefix(entry.path, prefix));
    const excluded = excludePrefixes.some((prefix) =>
      pathMatchesPrefix(entry.path, prefix),
    );
    return included && !excluded;
  });
  console.log('');
  console.log('Docs por coleccion:');
  for (const [collectionPath, count] of summarizeByCollection(entries)) {
    console.log(`- ${collectionPath}: ${count}`);
  }
  console.log(`Total docs: ${entries.length}`);

  if (printRange) {
    const [fromRaw, toRaw] = printRange.split(':');
    const from = parseNonNegativeInteger(fromRaw, 0);
    const to = parseNonNegativeInteger(toRaw, from + 25);
    console.log('');
    console.log(`Paths ${from}:${to}`);
    entries.slice(from, to).forEach((entry, offset) => {
      console.log(`${from + offset}: ${entry.path}`);
    });
    return;
  }

  if (!write) {
    console.log('');
    console.log('Dry-run completado. No se escribio en staging.');
    return;
  }

  if (targetProjectId === sourceProjectId) {
    throw new Error('target-project no puede ser igual a source-project.');
  }

  const targetDb = initDb({
    appName: 'copy-business-target',
    projectId: targetProjectId,
    keyPath: targetKey,
  });

  const entriesToWrite = entries.slice(startIndex);
  if (writeMode === 'bulk') {
    await writeWithBulkWriter(targetDb, entriesToWrite, { retries });
    console.log('');
    console.log('Copia completada en staging.');
    console.log(`Docs escritos: ${entriesToWrite.length}`);
    console.log(`Usuario staging: ${username}`);
    return;
  }

  const chunks = chunkArray(entriesToWrite, batchSize);
  for (const [index, chunk] of chunks.entries()) {
    const fromIndex = startIndex + index * batchSize;
    await commitChunk(targetDb, chunk, { retries, retryDelayMs });
    console.log(
      `Batch ${index + 1}/${chunks.length}: ${chunk.length} docs; index ${fromIndex}`,
    );
    if (batchDelayMs > 0 && index < chunks.length - 1) {
      await wait(batchDelayMs);
    }
  }

  console.log('');
  console.log('Copia completada en staging.');
  console.log(`Docs escritos: ${entriesToWrite.length}`);
  console.log(`Usuario staging: ${username}`);
};

main().catch((error) => {
  console.error('[copy-business-to-staging] failed');
  console.error(error);
  process.exitCode = 1;
});
