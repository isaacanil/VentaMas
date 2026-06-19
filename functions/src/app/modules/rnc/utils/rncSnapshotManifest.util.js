export const RNC_SNAPSHOT_MANIFEST_SCHEMA_VERSION = 1;
export const RNC_CURRENT_ACTIVATION_REASONS = Object.freeze([
  'publish',
  'rollback',
]);

export const DEFAULT_RNC_CURRENT_MANIFEST_PATH = 'rnc/current.json';
export const DEFAULT_RNC_LEGACY_SQLITE_STORAGE_PATH = 'rnc.sqlite.gz';
export const DEFAULT_RNC_SNAPSHOT_MANIFEST_PREFIX = 'rnc/manifests';
export const DEFAULT_RNC_SNAPSHOT_PREFIX = 'rnc/snapshots';

const cleanEnvValue = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const normalizeStoragePath = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/');

export const resolveRncCurrentManifestPath = ({ env = process.env } = {}) =>
  normalizeStoragePath(
    cleanEnvValue(env.RNC_CURRENT_MANIFEST_PATH) ??
      cleanEnvValue(env.RNC_SNAPSHOT_CURRENT_PATH) ??
      cleanEnvValue(env.RNC_CURRENT_METADATA_PATH) ??
      cleanEnvValue(env.RNC_SNAPSHOT_METADATA_PATH) ??
      DEFAULT_RNC_CURRENT_MANIFEST_PATH,
  );

export const resolveRncLegacySqliteStoragePath = ({ env = process.env } = {}) =>
  normalizeStoragePath(
    cleanEnvValue(env.RNC_SQLITE_STORAGE_PATH) ??
      cleanEnvValue(env.RNC_LOOKUP_SQLITE_OBJECT) ??
      DEFAULT_RNC_LEGACY_SQLITE_STORAGE_PATH,
  );

export const resolveRncSnapshotPrefix = ({ env = process.env } = {}) =>
  normalizeStoragePath(
    cleanEnvValue(env.RNC_SNAPSHOT_PREFIX) ?? DEFAULT_RNC_SNAPSHOT_PREFIX,
  ).replace(/\/$/, '');

export const resolveRncSnapshotManifestPrefix = ({ env = process.env } = {}) =>
  normalizeStoragePath(
    cleanEnvValue(env.RNC_SNAPSHOT_MANIFEST_PREFIX) ??
      DEFAULT_RNC_SNAPSHOT_MANIFEST_PREFIX,
  ).replace(/\/$/, '');

export const buildVersionedRncSnapshotPath = ({ sha256, snapshotPrefix }) => {
  const hash = cleanEnvValue(sha256);
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
    throw new Error('sha256 invalido para snapshot RNC.');
  }

  return normalizeStoragePath(`${snapshotPrefix}/${hash.toLowerCase()}.sqlite.gz`);
};

export const buildVersionedRncManifestPath = ({
  manifestPrefix,
  sha256,
}) => {
  const hash = cleanEnvValue(sha256);
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
    throw new Error('sha256 invalido para manifest RNC.');
  }

  return normalizeStoragePath(`${manifestPrefix}/${hash.toLowerCase()}.json`);
};

const isPlainRecord = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isNonNegativeInteger = (value) =>
  Number.isInteger(value) && value >= 0;

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
};

const normalizeSha256 = (value) =>
  typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value)
    ? value.toLowerCase()
    : null;

const normalizeActivationReason = (manifest) => {
  if (RNC_CURRENT_ACTIVATION_REASONS.includes(manifest?.activationReason)) {
    return manifest.activationReason;
  }

  if (typeof manifest?.rolledBackAt === 'string') return 'rollback';
  if (typeof manifest?.publishedAt === 'string') return 'publish';

  return null;
};

const normalizeActivatedAt = (manifest) =>
  typeof manifest?.activatedAt === 'string'
    ? manifest.activatedAt
    : typeof manifest?.rolledBackAt === 'string'
      ? manifest.rolledBackAt
      : typeof manifest?.publishedAt === 'string'
        ? manifest.publishedAt
        : null;

const normalizeRejectedSha256List = (manifest) => {
  const rawValues = [
    ...(Array.isArray(manifest?.rejectedSha256List)
      ? manifest.rejectedSha256List
      : []),
    ...(Array.isArray(manifest?.rejectedSha256)
      ? manifest.rejectedSha256
      : [manifest?.rejectedSha256]),
  ].filter(Boolean);

  const hashes = rawValues.map(normalizeSha256);
  if (hashes.some((hash) => !hash)) {
    throw new Error('Manifest RNC current.json invalido.');
  }

  return [...new Set(hashes)];
};

const parseJsonManifest = (rawManifest) => {
  const text = Buffer.isBuffer(rawManifest)
    ? rawManifest.toString('utf8')
    : String(rawManifest ?? '');
  return JSON.parse(text);
};

export const parseRncSnapshotManifest = (rawManifest) => {
  const manifest = parseJsonManifest(rawManifest);
  const snapshotPath =
    typeof manifest?.snapshotPath === 'string'
      ? normalizeStoragePath(manifest.snapshotPath)
      : null;
  const sha256 = normalizeSha256(
    manifest?.snapshotGzipSha256 ?? manifest?.sha256,
  );
  const sqliteSha256 = manifest?.sqliteSha256
    ? normalizeSha256(manifest.sqliteSha256)
    : null;

  if (
    !isPlainRecord(manifest) ||
    manifest.schemaVersion !== RNC_SNAPSHOT_MANIFEST_SCHEMA_VERSION ||
    !snapshotPath ||
    !sha256 ||
    !snapshotPath.endsWith(`/${sha256}.sqlite.gz`) ||
    !isValidIsoDate(manifest.generatedAt) ||
    !isNonNegativeInteger(manifest.rowCount) ||
    !isPositiveInteger(manifest.sqliteBytes) ||
    !isPositiveInteger(manifest.sqliteGzipBytes) ||
    manifest.source == null ||
    (manifest.sqliteSha256 && !sqliteSha256)
  ) {
    throw new Error('Manifest RNC current.json invalido.');
  }

  return {
    ...manifest,
    snapshotPath,
    snapshotGzipSha256: sha256,
    sha256,
    ...(sqliteSha256 ? { sqliteSha256 } : {}),
  };
};

export const parseRncCurrentManifest = (rawManifest) => {
  const manifest = parseJsonManifest(rawManifest);
  const manifestPath =
    typeof manifest?.manifestPath === 'string'
      ? normalizeStoragePath(manifest.manifestPath)
      : null;
  const sha256 = normalizeSha256(
    manifest?.snapshotGzipSha256 ?? manifest?.sha256,
  );

  if (manifestPath) {
    const activatedAt = normalizeActivatedAt(manifest);
    const activationReason = normalizeActivationReason(manifest);
    const rejectedSha256List = normalizeRejectedSha256List(manifest);

    if (
      !isPlainRecord(manifest) ||
      manifest.schemaVersion !== RNC_SNAPSHOT_MANIFEST_SCHEMA_VERSION ||
      !sha256 ||
      !manifestPath.endsWith(`/${sha256}.json`) ||
      (activatedAt && !isValidIsoDate(activatedAt)) ||
      (manifest.rollbackHoldUntil &&
        !isValidIsoDate(manifest.rollbackHoldUntil)) ||
      (manifest.activationReason && !activationReason)
    ) {
      throw new Error('Manifest RNC current.json invalido.');
    }

    return {
      ...manifest,
      ...(activatedAt ? { activatedAt } : {}),
      ...(activationReason ? { activationReason } : {}),
      manifestPath,
      rejectedSha256List,
      snapshotGzipSha256: sha256,
      sha256,
      type: 'snapshot-manifest-pointer',
    };
  }

  return parseRncSnapshotManifest(JSON.stringify(manifest));
};
