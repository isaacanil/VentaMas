import { resolveRncStorageBucketName } from '../utils/rncStorage.util.js';
import {
  DEFAULT_RNC_CURRENT_MANIFEST_PATH,
  DEFAULT_RNC_LEGACY_SQLITE_STORAGE_PATH,
  resolveRncCurrentManifestPath,
  resolveRncLegacySqliteStoragePath,
} from '../utils/rncSnapshotManifest.util.js';

export const RNC_LOOKUP_SOURCES = Object.freeze({
  STORAGE_SQLITE: 'storage-sqlite',
  UNAVAILABLE: 'unavailable',
});

const DEFAULT_SQLITE_RNC_COLUMN = 'rnc_number';
const DEFAULT_SQLITE_TABLE = 'rnc';
const DEFAULT_SQLITE_CACHE_TTL_MS = 15 * 60 * 1000;

export class RncRepositoryUnavailableError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'RncRepositoryUnavailableError';
    this.code = 'rnc-repository-unavailable';
    this.details = details;
  }
}

export const isRncRepositoryUnavailableError = (error) =>
  error instanceof RncRepositoryUnavailableError ||
  error?.code === 'rnc-repository-unavailable';

const cleanEnvValue = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveCacheTtlMs = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_SQLITE_CACHE_TTL_MS;
};

export const createUnavailableRncRepository = ({
  reason = 'not-configured',
} = {}) => ({
  source: RNC_LOOKUP_SOURCES.UNAVAILABLE,
  async findByRnc(_rncNumber) {
    throw new RncRepositoryUnavailableError(
      'RNC lookup repository is not configured.',
      {
        reason,
        source: RNC_LOOKUP_SOURCES.UNAVAILABLE,
      },
    );
  },
});

const buildStorageSqliteConfig = ({
  bucketName = null,
  cacheTtlMs = DEFAULT_SQLITE_CACHE_TTL_MS,
  currentManifestPath = DEFAULT_RNC_CURRENT_MANIFEST_PATH,
  enableLegacyFallback = false,
  lastUpdated = null,
  rncColumn = DEFAULT_SQLITE_RNC_COLUMN,
  objectPath = DEFAULT_RNC_LEGACY_SQLITE_STORAGE_PATH,
  table = DEFAULT_SQLITE_TABLE,
} = {}) => ({
  bucketName,
  cacheTtlMs,
  currentManifestPath,
  enableLegacyFallback,
  lastUpdated,
  rncColumn,
  legacyStoragePath: objectPath,
  table,
});

export const createStorageSqliteRncRepository = ({
  bucketName = null,
  cacheTtlMs = DEFAULT_SQLITE_CACHE_TTL_MS,
  currentManifestPath = DEFAULT_RNC_CURRENT_MANIFEST_PATH,
  database = null,
  enableLegacyFallback = false,
  lastUpdated = null,
  objectPath = DEFAULT_RNC_LEGACY_SQLITE_STORAGE_PATH,
  rncColumn = DEFAULT_SQLITE_RNC_COLUMN,
  table = DEFAULT_SQLITE_TABLE,
} = {}) => {
  const config = buildStorageSqliteConfig({
    bucketName,
    cacheTtlMs,
    currentManifestPath,
    enableLegacyFallback,
    lastUpdated,
    objectPath,
    rncColumn,
    table,
  });
  let repositoryPromise = null;

  const loadRepository = async () => {
    if (!repositoryPromise) {
      repositoryPromise = import('../services/rncSqlite.repository.js').then(
        ({ createRncSqliteRepository }) =>
          createRncSqliteRepository({
            database,
            config,
          }),
      );
    }

    return repositoryPromise;
  };

  return {
    bucketName,
    currentManifestPath: config.currentManifestPath,
    objectPath: config.legacyStoragePath,
    source: RNC_LOOKUP_SOURCES.STORAGE_SQLITE,
    async findByRnc(rncNumber) {
      const repository = await loadRepository();
      return repository.findByRnc(rncNumber);
    },
    async getSnapshotMetadata() {
      const repository = await loadRepository();
      return repository.getSnapshotMetadata();
    },
  };
};

export const createRncLookupRepository = ({ env = process.env } = {}) => {
  const requestedSource =
    cleanEnvValue(env.RNC_LOOKUP_SOURCE) ?? RNC_LOOKUP_SOURCES.STORAGE_SQLITE;
  if (requestedSource === RNC_LOOKUP_SOURCES.UNAVAILABLE) {
    return createUnavailableRncRepository({
      reason: 'explicitly-disabled',
    });
  }

  if (requestedSource === RNC_LOOKUP_SOURCES.STORAGE_SQLITE) {
    return createStorageSqliteRncRepository({
      bucketName: resolveRncStorageBucketName({ env }),
      cacheTtlMs: resolveCacheTtlMs(env.RNC_SQLITE_CACHE_TTL_MS),
      currentManifestPath: resolveRncCurrentManifestPath({ env }),
      enableLegacyFallback: cleanEnvValue(env.RNC_SQLITE_ENABLE_LEGACY_FALLBACK),
      lastUpdated: cleanEnvValue(env.RNC_SQLITE_LAST_UPDATED),
      objectPath: resolveRncLegacySqliteStoragePath({ env }),
      rncColumn:
        cleanEnvValue(env.RNC_SQLITE_RNC_COLUMN) ?? DEFAULT_SQLITE_RNC_COLUMN,
      table: cleanEnvValue(env.RNC_SQLITE_TABLE) ?? DEFAULT_SQLITE_TABLE,
    });
  }

  return createUnavailableRncRepository({
    reason: requestedSource
      ? `unsupported-source:${requestedSource}`
      : 'not-configured',
  });
};
