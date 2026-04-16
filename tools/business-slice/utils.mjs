import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

const requireFromFunctions = createRequire(
  new URL('../../functions/package.json', import.meta.url),
);

const { applicationDefault, getApps, initializeApp } = requireFromFunctions(
  'firebase-admin/app',
);
const { DocumentReference, FieldPath, GeoPoint, Timestamp, getFirestore } =
  requireFromFunctions('firebase-admin/firestore');
const bcrypt = requireFromFunctions('bcryptjs');

export const DEFAULT_DOMAINS = [
  'identity',
  'sales',
  'inventory',
  'receivables',
  'fiscal',
];

export const DEFAULT_EXPORT_OPTIONS = {
  invoiceLimit: 15,
  cashCountLimit: 3,
  receivableLimit: 15,
  productLimit: 25,
  movementLimit: 100,
  taxReportLimit: 10,
  purchaseLimit: 25,
  expenseLimit: 25,
  creditNoteLimit: 25,
  sanitize: 'auth-only',
  localPassword: 'VmAa1122',
};

const EXPORTED_USERS_APP = 'business-slice-export';
const EMULATOR_IMPORT_APP = 'business-slice-import';

let localPasswordHashPromise = null;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const isTimestampLike = (value) =>
  value instanceof Timestamp ||
  (value &&
    typeof value === 'object' &&
    typeof value.toDate === 'function' &&
    typeof value.toMillis === 'function');

const isDocumentReferenceLike = (value) =>
  value instanceof DocumentReference ||
  (value &&
    typeof value === 'object' &&
    typeof value.path === 'string' &&
    typeof value.id === 'string' &&
    'firestore' in value);

const isGeoPointLike = (value) =>
  value instanceof GeoPoint ||
  (value &&
    typeof value === 'object' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number');

export const parseListArg = (value) => {
  const raw = toCleanString(value);
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const parseIntegerArg = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.floor(numeric);
};

export const parseBooleanFlag = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (value === true) return true;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

export const parseCliArgs = (argv) => {
  const parsed = {
    positional: [],
    flags: {},
  };

  for (const token of argv.slice(2)) {
    if (!token.startsWith('--')) {
      parsed.positional.push(token);
      continue;
    }

    const [rawKey, ...rest] = token.slice(2).split('=');
    const key = rawKey.trim();
    if (!key) continue;

    if (rest.length === 0) {
      parsed.flags[key] = true;
      continue;
    }

    parsed.flags[key] = rest.join('=');
  }

  return parsed;
};

export const ensureDirectoryForFile = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

export const readJsonFile = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

export const writeJsonFile = async (filePath, data) => {
  await ensureDirectoryForFile(filePath);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

export const resolveDefaultExportPath = (businessId) =>
  path.resolve(
    process.cwd(),
    'tmp',
    'emulator-seeds',
    businessId,
    'business-slice.json',
  );

export const getOrInitExportDb = ({ projectId } = {}) => {
  const existing = getApps().find((app) => app.name === EXPORTED_USERS_APP);
  const app =
    existing ??
    initializeApp(
      {
        credential: applicationDefault(),
        ...(projectId ? { projectId } : {}),
      },
      EXPORTED_USERS_APP,
    );
  return getFirestore(app);
};

export const getOrInitEmulatorDb = ({ projectId } = {}) => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST no esta definido. Este importador solo escribe en emulador.',
    );
  }

  const existing = getApps().find((app) => app.name === EMULATOR_IMPORT_APP);
  const app =
    existing ??
    initializeApp(
      {
        ...(projectId ? { projectId } : {}),
      },
      EMULATOR_IMPORT_APP,
    );
  return getFirestore(app);
};

export const getDocData = async (db, docPath) => {
  const snap = await db.doc(docPath).get();
  if (!snap.exists) return null;
  return {
    id: snap.id,
    path: snap.ref.path,
    data: snap.data(),
  };
};

export const getCollectionDocs = async (db, collectionPath) => {
  const snap = await db.collection(collectionPath).get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    path: doc.ref.path,
    data: doc.data(),
  }));
};

export const filterCollectionDocs = async (
  db,
  collectionPath,
  predicate = () => true,
) => {
  const docs = await getCollectionDocs(db, collectionPath);
  return docs.filter((entry) => predicate(entry.data, entry));
};

export const sortDocsForImport = (docs) =>
  [...docs].sort((left, right) => {
    const leftDepth = left.path.split('/').length;
    const rightDepth = right.path.split('/').length;
    if (leftDepth !== rightDepth) return leftDepth - rightDepth;
    return left.path.localeCompare(right.path);
  });

export const createDocAccumulator = () => {
  const docsByPath = new Map();

  return {
    add(pathValue, data, domain) {
      if (!pathValue || data === undefined || data === null) return false;
      const current = docsByPath.get(pathValue);
      docsByPath.set(pathValue, {
        path: pathValue,
        data,
        domain: domain || current?.domain || null,
      });
      return !current;
    },
    has(pathValue) {
      return docsByPath.has(pathValue);
    },
    toArray() {
      return Array.from(docsByPath.values());
    },
    size() {
      return docsByPath.size;
    },
  };
};

export const collectionPathFromDocPath = (docPath) => {
  const segments = String(docPath).split('/').filter(Boolean);
  return segments.slice(0, -1).join('/');
};

export const summarizeDocsByCollection = (docs) =>
  docs.reduce((acc, entry) => {
    const collectionPath = collectionPathFromDocPath(entry.path);
    acc[collectionPath] = (acc[collectionPath] || 0) + 1;
    return acc;
  }, {});

export const extractInvoiceNumber = (invoiceData) => {
  const root = isRecord(invoiceData) ? invoiceData : {};
  const nested = isRecord(root.data) ? root.data : {};
  const candidates = [
    root.numberID,
    nested.numberID,
    root.number,
    nested.number,
    root.invoiceNumber,
    nested.invoiceNumber,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    const normalized = String(candidate).trim();
    if (normalized) return normalized;
  }

  return null;
};

export const extractInvoiceClientId = (invoiceData) => {
  const root = isRecord(invoiceData) ? invoiceData : {};
  const nested = isRecord(root.data) ? root.data : {};
  const clientRoot = isRecord(root.client) ? root.client : {};
  const clientNested = isRecord(nested.client) ? nested.client : {};

  const candidates = [
    root.clientId,
    nested.clientId,
    clientRoot.id,
    clientNested.id,
    clientRoot.clientId,
    clientNested.clientId,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    const normalized = String(candidate).trim();
    if (normalized) return normalized;
  }

  return null;
};

export const extractInvoiceProductIds = (invoiceData) => {
  const root = isRecord(invoiceData) ? invoiceData : {};
  const nested = isRecord(root.data) ? root.data : {};
  const products = toArray(root.products).concat(toArray(nested.products));
  const result = new Set();

  for (const product of products) {
    if (!isRecord(product)) continue;
    const candidates = [product.id, product.productId];
    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined) continue;
      const normalized = String(candidate).trim();
      if (normalized) result.add(normalized);
    }
  }

  return Array.from(result);
};

export const extractTimestampMillis = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (isTimestampLike(value)) return value.toMillis();
  if (isRecord(value) && typeof value.seconds === 'number') {
    return Math.trunc(value.seconds * 1000);
  }
  return null;
};

export const pickLatestDocs = (docs, limit, extraFields = []) => {
  if (!Array.isArray(docs) || docs.length <= limit) return docs;

  const sortFields = [
    ...extraFields,
    'updatedAt',
    'createdAt',
    'date',
    'voidedAt',
    'openedAt',
    'closedAt',
  ];

  const ranked = [...docs].sort((left, right) => {
    const leftData = isRecord(left.data) ? left.data : {};
    const rightData = isRecord(right.data) ? right.data : {};

    for (const field of sortFields) {
      const leftMillis = extractTimestampMillis(leftData[field]);
      const rightMillis = extractTimestampMillis(rightData[field]);
      if (leftMillis === null && rightMillis === null) continue;
      if (leftMillis === null) return 1;
      if (rightMillis === null) return -1;
      if (leftMillis !== rightMillis) return rightMillis - leftMillis;
    }

    return right.path.localeCompare(left.path);
  });

  return ranked.slice(0, limit);
};

export const collectLocationIdsFromStocks = (stocks) => {
  const locations = new Set();
  for (const entry of stocks) {
    const data = isRecord(entry.data) ? entry.data : {};
    const rawLocation = toCleanString(String(data.location || ''));
    if (!rawLocation) continue;
    const parts = rawLocation.split('/').filter(Boolean);
    if (parts[0]) locations.add(parts[0]);
    if (parts[1]) locations.add(parts[1]);
    if (parts[2]) locations.add(parts[2]);
    if (parts[3]) locations.add(parts[3]);
  }
  return locations;
};

export const serializeForExport = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) {
    return {
      __type: 'date',
      millis: value.getTime(),
    };
  }
  if (isTimestampLike(value)) {
    return {
      __type: 'timestamp',
      millis: value.toMillis(),
    };
  }
  if (isGeoPointLike(value)) {
    return {
      __type: 'geopoint',
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }
  if (isDocumentReferenceLike(value)) {
    return {
      __type: 'document-reference',
      path: value.path,
    };
  }
  if (value instanceof FieldPath) {
    return {
      __type: 'field-path',
      segments: value._segments || [],
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeForExport(item));
  }
  if (isRecord(value)) {
    const output = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      const serialized = serializeForExport(nestedValue);
      if (serialized !== undefined) {
        output[key] = serialized;
      }
    }
    return output;
  }
  return value;
};

export const deserializeFromExport = (value, db) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => deserializeFromExport(item, db));
  }
  if (value.__type === 'timestamp' && Number.isFinite(value.millis)) {
    return Timestamp.fromMillis(value.millis);
  }
  if (value.__type === 'date' && Number.isFinite(value.millis)) {
    return new Date(value.millis);
  }
  if (
    value.__type === 'document-reference' &&
    typeof value.path === 'string' &&
    value.path.trim()
  ) {
    return db.doc(value.path.trim());
  }
  if (
    value.__type === 'geopoint' &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude)
  ) {
    return new GeoPoint(value.latitude, value.longitude);
  }
  const output = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === '__type') continue;
    output[key] = deserializeFromExport(nestedValue, db);
  }
  return output;
};

const isLeafSerializableObject = (value) =>
  value instanceof Date ||
  isTimestampLike(value) ||
  isGeoPointLike(value) ||
  isDocumentReferenceLike(value);

const deleteKeysDeep = (value, blockedKeys, seen = new WeakSet()) => {
  if (Array.isArray(value)) {
    return value.map((item) => deleteKeysDeep(item, blockedKeys, seen));
  }
  if (!isRecord(value)) return value;
  if (isLeafSerializableObject(value)) return value;
  if (seen.has(value)) return null;

  seen.add(value);

  const output = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (blockedKeys.has(key)) continue;
    output[key] = deleteKeysDeep(nestedValue, blockedKeys, seen);
  }

  seen.delete(value);
  return output;
};

const getLocalPasswordHash = async (localPassword) => {
  if (!localPasswordHashPromise) {
    localPasswordHashPromise = bcrypt.hash(localPassword, 10);
  }
  return localPasswordHashPromise;
};

export const sanitizeDocForExport = async ({
  docPath,
  data,
  sanitize = DEFAULT_EXPORT_OPTIONS.sanitize,
  localPassword = DEFAULT_EXPORT_OPTIONS.localPassword,
}) => {
  if (sanitize === 'none') {
    return data;
  }

  const blockedKeys = new Set([
    'sessionToken',
    'sessionTokens',
    'sessionLogs',
    'verification',
    'verificationCode',
    'customToken',
    'firebaseCustomToken',
  ]);

  const next = deleteKeysDeep(data, blockedKeys);

  if (!docPath.startsWith('users/')) {
    return next;
  }

  const hashedPassword = await getLocalPasswordHash(localPassword);
  return {
    ...next,
    password: hashedPassword,
    passwordChangedAt: null,
  };
};

export const formatSummaryLines = (summary) =>
  Object.entries(summary)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([collectionPath, count]) => `${collectionPath}: ${count}`);

export const uniqueStrings = (values) =>
  Array.from(
    new Set(
      values
        .map((value) => toCleanString(String(value || '')))
        .filter(Boolean),
    ),
  );

export const exitWithUsage = (message, usage) => {
  if (message) {
    console.error(message);
    console.error('');
  }
  console.error(usage.trim());
  process.exit(1);
};
