import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rename, stat, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';

import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';

import { storage } from '../../../core/config/firebase.js';
import {
  DEFAULT_RNC_CURRENT_MANIFEST_PATH,
  DEFAULT_RNC_LEGACY_SQLITE_STORAGE_PATH,
  normalizeStoragePath,
  parseRncCurrentManifest,
  parseRncSnapshotManifest,
  resolveRncCurrentManifestPath,
  resolveRncLegacySqliteStoragePath,
} from '../utils/rncSnapshotManifest.util.js';
import { resolveRncStorageBucketName } from '../utils/rncStorage.util.js';

const DEFAULT_TABLE = 'rnc';
const DEFAULT_RNC_COLUMN = 'rnc_number';
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
export const RNC_SQLITE_MAX_RUNTIME_BYTES = 512 * 1024 * 1024;
const DEFAULT_MAX_SQLITE_BYTES = RNC_SQLITE_MAX_RUNTIME_BYTES;
const RNC_SQLITE_USER_VERSION = 1;
const CACHE_DIR = path.join(tmpdir(), 'ventamas-rnc');
const RNC_SELECT_COLUMNS = Object.freeze([
  'rnc_number',
  'full_name',
  'business_name',
  'business_activity',
  'category',
  'payment_regime',
  'field_6',
  'field_7',
  'registration_date',
  'status',
  'condition',
  'raw_fields_json',
  'source_updated_at',
]);

const quoteIdentifier = (value) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new HttpsError(
      'failed-precondition',
      `Identificador SQLite invalido para RNC: ${value}`,
    );
  }

  return `"${value}"`;
};

const cleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveCacheTtlMs = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_CACHE_TTL_MS;
};

const resolveMaxSqliteBytes = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_SQLITE_BYTES;

  return Math.min(Math.floor(parsed), RNC_SQLITE_MAX_RUNTIME_BYTES);
};

const readBooleanOption = (value) =>
  ['1', 'true', 'yes', 'on'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase(),
  );

const normalizePathOption = (value, fallback) =>
  normalizeStoragePath(cleanString(value) ?? fallback);

const normalizeSnapshotConfig = (config = {}) => ({
  bucketName: config.bucketName ?? null,
  cacheTtlMs: resolveCacheTtlMs(config.cacheTtlMs),
  currentManifestPath: normalizePathOption(
    config.currentManifestPath ?? config.manifestPath,
    DEFAULT_RNC_CURRENT_MANIFEST_PATH,
  ),
  enableLegacyFallback: readBooleanOption(config.enableLegacyFallback),
  lastUpdated: cleanString(config.lastUpdated),
  legacyStoragePath: normalizePathOption(
    config.legacyStoragePath ?? config.storagePath,
    DEFAULT_RNC_LEGACY_SQLITE_STORAGE_PATH,
  ),
  maxSqliteBytes: resolveMaxSqliteBytes(
    config.maxSqliteBytes ?? process.env.RNC_SQLITE_MAX_BYTES,
  ),
  rncColumn: cleanString(config.rncColumn) ?? DEFAULT_RNC_COLUMN,
  table: cleanString(config.table) ?? DEFAULT_TABLE,
});

const resolveSnapshotConfig = () =>
  normalizeSnapshotConfig({
    bucketName: resolveRncStorageBucketName(),
    cacheTtlMs: process.env.RNC_SQLITE_CACHE_TTL_MS,
    currentManifestPath: resolveRncCurrentManifestPath(),
    enableLegacyFallback: process.env.RNC_SQLITE_ENABLE_LEGACY_FALLBACK,
    lastUpdated: process.env.RNC_SQLITE_LAST_UPDATED,
    legacyStoragePath: resolveRncLegacySqliteStoragePath(),
    maxSqliteBytes: process.env.RNC_SQLITE_MAX_BYTES,
    rncColumn: process.env.RNC_SQLITE_RNC_COLUMN,
    table: process.env.RNC_SQLITE_TABLE,
  });

let cachedDatabase = null;
let cachedStatement = null;
let cachedSnapshot = null;
let cachedManifest = null;
let cachedManifestCheckedAt = 0;
let cachedManifestKey = null;
let openingDatabasePromise = null;
let openingDatabasePromiseKey = null;
let activeQueryCount = 0;
const retiredDatabases = new Set();
const retiredCachePaths = new Set();
const snapshotDownloadPromises = new Map();
let snapshotTransitionLock = Promise.resolve();

const getBucket = (bucketName) =>
  bucketName ? storage.bucket(bucketName) : storage.bucket();

const getSnapshotFile = ({ bucketName, storagePath }) =>
  getBucket(bucketName).file(storagePath);

const isStorageNotFoundError = (error) =>
  error?.code === 404 ||
  error?.code === 'ENOENT' ||
  error?.errors?.some((item) => item?.reason === 'notFound');

const getManifestCacheKey = (config) =>
  [config.bucketName ?? '', config.currentManifestPath].join('|');

const getOpenDatabaseCacheKey = (config) =>
  [
    config.bucketName ?? '',
    config.currentManifestPath,
    config.legacyStoragePath,
    config.table,
    config.rncColumn,
  ].join('|');

const shouldCheckCurrentManifest = (config) =>
  !cachedManifest ||
  cachedManifestKey !== getManifestCacheKey(config) ||
  !cachedManifestCheckedAt ||
  Date.now() - cachedManifestCheckedAt >= config.cacheTtlMs;

const readCurrentManifest = async (config) => {
  const bucket = getBucket(config.bucketName);
  const file = bucket.file(config.currentManifestPath);
  let currentFileRead = false;

  try {
    const [metadata] = await file.getMetadata();
    const [buffer] = await file.download();
    currentFileRead = true;
    const manifest = parseRncCurrentManifest(buffer);
    if (manifest?.manifestPath) {
      const manifestFile = bucket.file(manifest.manifestPath);
      const [snapshotManifestMetadata] = await manifestFile.getMetadata();
      const [snapshotManifestBuffer] = await manifestFile.download();
      const snapshotManifest = parseRncSnapshotManifest(snapshotManifestBuffer);

      return {
        ...snapshotManifest,
        bucketName: bucket.name ?? config.bucketName ?? null,
        currentManifestGeneration: metadata?.generation || null,
        currentManifestPath: config.currentManifestPath,
        currentUpdated: metadata?.updated || null,
        generation: cleanString(snapshotManifest.generation),
        lastUpdated:
          cleanString(snapshotManifest.lastUpdated) ??
          cleanString(snapshotManifest.generatedAt) ??
          cleanString(snapshotManifest.updated),
        manifestGeneration: snapshotManifestMetadata?.generation || null,
        manifestPath: manifest.manifestPath,
        manifestUpdated: snapshotManifestMetadata?.updated || null,
        storagePath: snapshotManifest.snapshotPath,
        updated: cleanString(snapshotManifest.updated),
      };
    }

    return {
      ...manifest,
      bucketName: bucket.name ?? config.bucketName ?? null,
      currentManifestGeneration: metadata?.generation || null,
      currentManifestPath: config.currentManifestPath,
      currentUpdated: metadata?.updated || null,
      generation: cleanString(manifest.generation),
      lastUpdated:
        cleanString(manifest.lastUpdated) ??
        cleanString(manifest.generatedAt) ??
        cleanString(manifest.updated),
      storagePath: manifest.snapshotPath,
      updated: cleanString(manifest.updated),
    };
  } catch (error) {
    if (
      !currentFileRead &&
      isStorageNotFoundError(error) &&
      config.enableLegacyFallback &&
      config.legacyStoragePath
    ) {
      const legacyFile = bucket.file(config.legacyStoragePath);
      try {
        const [metadata] = await legacyFile.getMetadata();
        logger.warn('[lookupRnc] current manifest missing; using legacy snapshot', {
          currentManifestPath: config.currentManifestPath,
          legacyStoragePath: config.legacyStoragePath,
        });
        return {
          bucketName: bucket.name ?? config.bucketName ?? null,
          currentManifestGeneration: null,
          currentManifestPath: config.currentManifestPath,
          currentUpdated: null,
          generation: metadata?.generation || null,
          lastUpdated:
            cleanString(config.lastUpdated) ?? cleanString(metadata?.updated),
          legacy: true,
          schemaVersion: null,
          sha256: null,
          snapshotPath: config.legacyStoragePath,
          storagePath: config.legacyStoragePath,
          updated: cleanString(metadata?.updated),
        };
      } catch (legacyError) {
        if (!isStorageNotFoundError(legacyError)) throw legacyError;
      }
    }

    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      'failed-precondition',
      'Manifest RNC current.json invalido o no disponible.',
      {
        cause: error?.message,
        currentManifestPath: config.currentManifestPath,
      },
    );
  }
};

const getCurrentManifest = async (config) => {
  if (!shouldCheckCurrentManifest(config)) {
    return cachedManifest;
  }

  const manifest = await readCurrentManifest(config);
  cachedManifest = manifest;
  cachedManifestCheckedAt = Date.now();
  cachedManifestKey = getManifestCacheKey(config);
  return manifest;
};

const closeCachedDatabase = () => {
  cachedStatement = null;
  if (cachedDatabase) {
    cachedDatabase.close();
    cachedDatabase = null;
  }
  for (const database of retiredDatabases) {
    database.close();
  }
  retiredDatabases.clear();
  for (const cachePath of retiredCachePaths) {
    unlink(cachePath).catch(() => undefined);
  }
  retiredCachePaths.clear();
};

const createHashTap = (hash) =>
  new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });

const createByteLimitTap = ({ limit, snapshotPath }) => {
  let bytes = 0;
  return new Transform({
    transform(chunk, _encoding, callback) {
      bytes += chunk.length;
      if (bytes > limit) {
        callback(
          new HttpsError(
            'failed-precondition',
            'SQLite RNC excede el maximo permitido para runtime.',
            {
              maxSqliteBytes: limit,
              size: bytes,
              snapshotPath,
            },
          ),
        );
        return;
      }

      callback(null, chunk);
    },
  });
};

const readSnapshotObjectMetadata = async (file) => {
  if (typeof file.getMetadata !== 'function') return {};
  const [metadata] = await file.getMetadata();
  return metadata ?? {};
};

const getSnapshotCachePath = (snapshot) => {
  const cacheKey =
    snapshot.sha256 ||
    snapshot.generation ||
    createHash('sha256').update(snapshot.snapshotPath).digest('hex');
  const safeCacheKey = String(cacheKey).replace(/[^A-Za-z0-9_-]/g, '_');
  return path.join(CACHE_DIR, `${safeCacheKey}.sqlite`);
};

const getSnapshotDownloadKey = (config, snapshot) =>
  [
    config.bucketName ?? '',
    snapshot.sha256 ?? '',
    snapshot.generation ?? '',
    snapshot.snapshotPath,
  ].join('|');

const closeRetiredDatabasesIfIdle = () => {
  if (activeQueryCount > 0) return;

  for (const database of retiredDatabases) {
    database.close();
    retiredDatabases.delete(database);
  }
  for (const cachePath of retiredCachePaths) {
    unlink(cachePath).catch(() => undefined);
    retiredCachePaths.delete(cachePath);
  }
};

const runWithActiveDatabaseQuery = (callback) => {
  activeQueryCount += 1;
  try {
    return callback();
  } finally {
    activeQueryCount -= 1;
    closeRetiredDatabasesIfIdle();
  }
};

const downloadSnapshotOnce = async (config, snapshot) => {
  await mkdir(CACHE_DIR, { recursive: true });

  const file = getSnapshotFile({
    bucketName: config.bucketName,
    storagePath: snapshot.snapshotPath,
  });
  const cacheDbPath = getSnapshotCachePath(snapshot);
  const temporaryPath = `${cacheDbPath}.download-${process.pid}-${Date.now()}`;
  const gzipHash = createHash('sha256');
  const sqliteHash = createHash('sha256');
  const startedAt = Date.now();

  try {
    await unlink(temporaryPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const objectMetadata = await readSnapshotObjectMetadata(file);
  try {
    await pipeline(
      file.createReadStream(),
      createHashTap(gzipHash),
      createGunzip(),
      createHashTap(sqliteHash),
      createByteLimitTap({
        limit: config.maxSqliteBytes,
        snapshotPath: snapshot.snapshotPath,
      }),
      createWriteStream(temporaryPath),
    );
    const downloadedSha256 = gzipHash.digest('hex');
    const downloadedSqliteSha256 = sqliteHash.digest('hex');
    const temporaryStats = await stat(temporaryPath);

    if (temporaryStats.size > config.maxSqliteBytes) {
      throw new HttpsError(
        'failed-precondition',
        'SQLite RNC excede el maximo permitido para runtime.',
        {
          maxSqliteBytes: config.maxSqliteBytes,
          size: temporaryStats.size,
          snapshotPath: snapshot.snapshotPath,
        },
      );
    }

    if (
      Number.isInteger(snapshot.sqliteBytes) &&
      snapshot.sqliteBytes > 0 &&
      snapshot.sqliteBytes !== temporaryStats.size
    ) {
      throw new HttpsError(
        'failed-precondition',
        'SQLite RNC no coincide con el tamano declarado en el manifest.',
        {
          expectedSqliteBytes: snapshot.sqliteBytes,
          actualSqliteBytes: temporaryStats.size,
          snapshotPath: snapshot.snapshotPath,
        },
      );
    }

    if (snapshot.sha256 && snapshot.sha256 !== downloadedSha256) {
      throw new HttpsError(
        'failed-precondition',
        'Snapshot RNC no coincide con sha256 del manifest actual.',
        {
          expectedSha256: snapshot.sha256,
          snapshotPath: snapshot.snapshotPath,
        },
      );
    }

    if (
      snapshot.sqliteSha256 &&
      snapshot.sqliteSha256 !== downloadedSqliteSha256
    ) {
      throw new HttpsError(
        'failed-precondition',
        'SQLite RNC no coincide con sqliteSha256 del manifest actual.',
        {
          expectedSqliteSha256: snapshot.sqliteSha256,
          snapshotPath: snapshot.snapshotPath,
        },
      );
    }

    logger.info('[lookupRnc] SQLite snapshot downloaded', {
      downloadMs: Date.now() - startedAt,
      sha256: snapshot.sha256 || downloadedSha256,
      snapshotPath: snapshot.snapshotPath,
      sqliteBytes: temporaryStats.size,
    });

    try {
      await unlink(cacheDbPath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }

    await rename(temporaryPath, cacheDbPath);

    return {
      ...snapshot,
      bucketName:
        file.bucket?.name ?? snapshot.bucketName ?? config.bucketName ?? null,
      cacheDbPath,
      generation: snapshot.generation ?? objectMetadata?.generation ?? null,
      sha256: snapshot.sha256 || downloadedSha256,
      sqliteBytes: temporaryStats.size,
      sqliteSha256: snapshot.sqliteSha256 || downloadedSqliteSha256,
      storagePath: snapshot.snapshotPath,
      updated: snapshot.updated ?? objectMetadata?.updated ?? null,
    };
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
};

const downloadSnapshot = async (config, snapshot) => {
  const downloadKey = getSnapshotDownloadKey(config, snapshot);
  if (!snapshotDownloadPromises.has(downloadKey)) {
    snapshotDownloadPromises.set(
      downloadKey,
      downloadSnapshotOnce(config, snapshot).finally(() => {
        snapshotDownloadPromises.delete(downloadKey);
      }),
    );
  }

  return snapshotDownloadPromises.get(downloadKey);
};

const runWithSnapshotTransitionLock = async (callback) => {
  const previousTransition = snapshotTransitionLock;
  let releaseTransition;
  snapshotTransitionLock = new Promise((resolve) => {
    releaseTransition = resolve;
  });

  await previousTransition;

  try {
    return await callback();
  } finally {
    releaseTransition();
  }
};

const isCachedSnapshotCurrent = (snapshot) =>
  Boolean(cachedDatabase) &&
  cachedSnapshot?.snapshotPath === snapshot.snapshotPath &&
  (snapshot.sha256
    ? cachedSnapshot?.sha256 === snapshot.sha256
    : !snapshot.generation || cachedSnapshot?.generation === snapshot.generation);

const openDatabaseFromCacheFile = (cacheDbPath) => {
  const database = new DatabaseSync(cacheDbPath, { readOnly: true });
  database.exec('PRAGMA query_only = ON;');
  return database;
};

const assertDatabaseReadable = (database, config) => {
  const userVersion = Number(
    database.prepare('PRAGMA user_version').get()?.user_version ?? 0,
  );
  if (userVersion !== RNC_SQLITE_USER_VERSION) {
    throw new HttpsError(
      'failed-precondition',
      `SQLite RNC tiene user_version incompatible: ${userVersion}.`,
    );
  }

  const tableName = quoteIdentifier(config.table);
  const rncColumn = quoteIdentifier(config.rncColumn);
  database.prepare(`SELECT ${rncColumn} FROM ${tableName} LIMIT 1`).get();
};

const snapshotsReferToSameObject = (left, right) =>
  Boolean(left && right) &&
  left.snapshotPath === right.snapshotPath &&
  (left.sha256
    ? left.sha256 === right.sha256
    : !left.generation || left.generation === right.generation);

const refreshManifestBeforeActivation = async (config, expectedSnapshot) => {
  const freshSnapshot = await readCurrentManifest(config);
  cachedManifest = freshSnapshot;
  cachedManifestCheckedAt = Date.now();
  cachedManifestKey = getManifestCacheKey(config);

  if (!snapshotsReferToSameObject(expectedSnapshot, freshSnapshot)) {
    throw new HttpsError(
      'failed-precondition',
      'El puntero RNC cambio durante la activacion del snapshot.',
      {
        currentSha256: freshSnapshot?.sha256 || null,
        currentSnapshotPath: freshSnapshot?.snapshotPath || null,
        expectedSha256: expectedSnapshot?.sha256 || null,
        expectedSnapshotPath: expectedSnapshot?.snapshotPath || null,
      },
    );
  }

  return freshSnapshot;
};

const replaceCachedDatabase = (database, snapshot) => {
  const previousDatabase = cachedDatabase;
  const previousSnapshot = cachedSnapshot;
  cachedStatement = null;
  cachedDatabase = database;
  cachedSnapshot = snapshot;

  if (previousDatabase && previousDatabase !== database) {
    retiredDatabases.add(previousDatabase);
    if (previousSnapshot?.cacheDbPath) {
      retiredCachePaths.add(previousSnapshot.cacheDbPath);
    }
    closeRetiredDatabasesIfIdle();
  }
};

const cleanupSnapshotCacheFiles = async ({ activeCachePath }) => {
  let entries;
  try {
    entries = await readdir(CACHE_DIR);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(CACHE_DIR, entry);
      if (filePath === activeCachePath || retiredCachePaths.has(filePath)) {
        return;
      }

      if (entry.includes('.download-') || entry.endsWith('.sqlite')) {
        await unlink(filePath).catch(() => undefined);
      }
    }),
  );
};

const cleanupInactiveSnapshotCacheFile = async (snapshot) => {
  const cacheDbPath = snapshot?.cacheDbPath;
  if (!cacheDbPath || cacheDbPath === cachedSnapshot?.cacheDbPath) return;

  await unlink(cacheDbPath).catch(() => undefined);
};

const logSnapshotCacheHit = (snapshot) => {
  logger.info('[lookupRnc] SQLite snapshot cache hit', {
    currentManifestPath: snapshot.currentManifestPath,
    generation: cachedSnapshot?.generation || null,
    sha256: cachedSnapshot?.sha256 || null,
    snapshotPath: cachedSnapshot?.snapshotPath || null,
  });
};

const loadCurrentDatabase = async (config) => {
  let snapshot;

  try {
    snapshot = await getCurrentManifest(config);
  } catch (error) {
    if (cachedDatabase) {
      cachedManifestCheckedAt = Date.now();
      logger.warn('[lookupRnc] current manifest refresh failed; using cache', {
        error,
        currentManifestPath: config.currentManifestPath,
        generation: cachedSnapshot?.generation || null,
        snapshotPath: cachedSnapshot?.snapshotPath || null,
      });
      return cachedDatabase;
    }

    throw error;
  }

  if (isCachedSnapshotCurrent(snapshot)) {
    logSnapshotCacheHit(snapshot);
    return cachedDatabase;
  }

  return runWithSnapshotTransitionLock(async () => {
    if (isCachedSnapshotCurrent(snapshot)) {
      logSnapshotCacheHit(snapshot);
      return cachedDatabase;
    }

    let nextSnapshot;
    let nextDatabase;

    try {
      nextSnapshot = await downloadSnapshot(config, snapshot);
      nextDatabase = openDatabaseFromCacheFile(nextSnapshot.cacheDbPath);
      assertDatabaseReadable(nextDatabase, config);
      nextSnapshot = {
        ...nextSnapshot,
        ...(await refreshManifestBeforeActivation(config, snapshot)),
        cacheDbPath: nextSnapshot.cacheDbPath,
      };
    } catch (error) {
      if (nextDatabase) {
        nextDatabase.close();
      }
      await cleanupInactiveSnapshotCacheFile(nextSnapshot);

      if (cachedDatabase) {
        cachedManifest = cachedSnapshot;
        cachedManifestCheckedAt = Date.now();
        logger.error(
          '[lookupRnc] SQLite snapshot activation failed; using cache',
          {
            error,
            currentManifestPath: config.currentManifestPath,
            currentSha256: cachedSnapshot?.sha256 || null,
            nextSha256: snapshot?.sha256 || null,
            snapshotPath: snapshot?.snapshotPath || null,
          },
        );
        return cachedDatabase;
      }

      throw error;
    }

    replaceCachedDatabase(nextDatabase, nextSnapshot);
    await cleanupSnapshotCacheFiles({
      activeCachePath: nextSnapshot.cacheDbPath,
    });

    logger.info('[lookupRnc] SQLite snapshot activated', {
      currentManifestPath: nextSnapshot.currentManifestPath,
      generation: nextSnapshot.generation,
      sha256: nextSnapshot.sha256,
      snapshotPath: nextSnapshot.snapshotPath,
    });

    return cachedDatabase;
  });
};

export const resetRncSqliteCacheForTests = () => {
  cachedSnapshot = null;
  cachedManifest = null;
  cachedManifestCheckedAt = 0;
  cachedManifestKey = null;
  openingDatabasePromise = null;
  openingDatabasePromiseKey = null;
  snapshotDownloadPromises.clear();
  snapshotTransitionLock = Promise.resolve();
  closeCachedDatabase();
};

export const openRncSqliteDatabase = async (config = resolveSnapshotConfig()) => {
  const normalizedConfig = normalizeSnapshotConfig(config);
  const openDatabaseCacheKey = getOpenDatabaseCacheKey(normalizedConfig);
  if (
    cachedDatabase &&
    cachedManifest &&
    !shouldCheckCurrentManifest(normalizedConfig) &&
    isCachedSnapshotCurrent(cachedManifest)
  ) {
    return cachedDatabase;
  }

  if (
    !openingDatabasePromise ||
    openingDatabasePromiseKey !== openDatabaseCacheKey
  ) {
    openingDatabasePromiseKey = openDatabaseCacheKey;
    openingDatabasePromise = loadCurrentDatabase(normalizedConfig).finally(() => {
      openingDatabasePromise = null;
      openingDatabasePromiseKey = null;
    });
  }

  return openingDatabasePromise;
};

export const createRncSqliteRepository = ({
  database,
  config = resolveSnapshotConfig(),
} = {}) => {
  const resolvedConfig = normalizeSnapshotConfig(config);
  const tableName = quoteIdentifier(resolvedConfig.table);
  const rncColumn = quoteIdentifier(resolvedConfig.rncColumn);
  const selectColumns = RNC_SELECT_COLUMNS.map(quoteIdentifier).join(', ');
  const statementKey = `${tableName}|${rncColumn}`;

  return {
    async findByRnc(rnc) {
      const db = database || (await openRncSqliteDatabase(resolvedConfig));
      if (
        !cachedStatement ||
        cachedStatement.database !== db ||
        cachedStatement.key !== statementKey
      ) {
        const statement = db.prepare(
          `SELECT ${selectColumns} FROM ${tableName} WHERE ${rncColumn} = ? LIMIT 1`,
        );
        cachedStatement = {
          database: db,
          key: statementKey,
          statement,
        };
      }

      const row = runWithActiveDatabaseQuery(() => {
        const queryStartedAt = Date.now();
        const result = cachedStatement.statement.get(rnc) || null;
        const activeSnapshot = database ? null : cachedSnapshot;
        const generatedAtMs = Date.parse(activeSnapshot?.generatedAt ?? '');
        logger.info('[lookupRnc] SQLite query completed', {
          found: Boolean(result),
          queryMs: Date.now() - queryStartedAt,
          sha256: activeSnapshot?.sha256 || null,
          snapshotAgeMs: Number.isFinite(generatedAtMs)
            ? Date.now() - generatedAtMs
            : null,
        });

        return result;
      });

      return row;
    },

    getSnapshotMetadata() {
      const activeSnapshot = database ? null : cachedSnapshot;
      return {
        currentManifestPath: resolvedConfig.currentManifestPath,
        generation: activeSnapshot?.generation || null,
        lastUpdated:
          resolvedConfig.lastUpdated || activeSnapshot?.lastUpdated || null,
        rowCount: activeSnapshot?.rowCount ?? null,
        sha256: activeSnapshot?.sha256 || null,
        snapshotGzipSha256:
          activeSnapshot?.snapshotGzipSha256 || activeSnapshot?.sha256 || null,
        snapshotPath:
          activeSnapshot?.snapshotPath || resolvedConfig.legacyStoragePath,
        storagePath:
          activeSnapshot?.storagePath || resolvedConfig.legacyStoragePath,
      };
    },
  };
};
