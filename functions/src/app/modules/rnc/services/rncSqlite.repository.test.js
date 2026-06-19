import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { DatabaseSync } from 'node:sqlite';
import { createGzip } from 'node:zlib';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { MockHttpsError } = vi.hoisted(() => {
  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  return {
    MockHttpsError: HoistedHttpsError,
  };
});

const storageMocks = vi.hoisted(() => {
  const files = new Map();
  const file = vi.fn((name) => {
    const mock = files.get(name);
    if (!mock) {
      throw new Error(`Unexpected RNC storage file: ${name}`);
    }
    return mock;
  });
  const bucket = vi.fn(() => ({
    file,
    name: 'test-rnc-bucket',
  }));

  return {
    bucket,
    file,
    files,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  storage: {
    bucket: storageMocks.bucket,
  },
}));

import {
  createRncSqliteRepository,
  openRncSqliteDatabase,
  RNC_SQLITE_MAX_RUNTIME_BYTES,
  resetRncSqliteCacheForTests,
} from './rncSqlite.repository.js';

const originalMaxSqliteBytesEnv = process.env.RNC_SQLITE_MAX_BYTES;

let tempDirs = [];
let db;

const createTempDir = async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'ventamas-rnc-test-'));
  tempDirs.push(tempDir);
  return tempDir;
};

const createDatabase = async () => {
  const tempDir = await createTempDir();
  const dbPath = path.join(tempDir, 'rnc.sqlite');
  db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA user_version = 1;
    CREATE TABLE rnc (
      rnc_number TEXT PRIMARY KEY,
      full_name TEXT,
      business_name TEXT,
      business_activity TEXT,
      category TEXT,
      payment_regime TEXT,
      field_6 TEXT,
      field_7 TEXT,
      registration_date TEXT,
      status TEXT,
      condition TEXT,
      raw_fields_json TEXT,
      source_updated_at TEXT
    );
    INSERT INTO rnc (rnc_number, full_name, status, condition)
    VALUES ('401007551', 'EMPRESA EJEMPLO SRL', 'ACTIVO', 'NORMAL');
  `);
  return db;
};

const createGzippedDatabase = async ({ fullName, rncNumber }) => {
  const tempDir = await createTempDir();
  const dbPath = path.join(tempDir, 'rnc.sqlite');
  const gzipPath = `${dbPath}.gz`;
  const fixtureDb = new DatabaseSync(dbPath);

  try {
    fixtureDb.exec(`
      PRAGMA user_version = 1;
      CREATE TABLE rnc (
        rnc_number TEXT PRIMARY KEY,
        full_name TEXT,
        business_name TEXT,
        business_activity TEXT,
        category TEXT,
        payment_regime TEXT,
        field_6 TEXT,
        field_7 TEXT,
        registration_date TEXT,
        status TEXT,
        condition TEXT,
        raw_fields_json TEXT,
        source_updated_at TEXT
      );
      INSERT INTO rnc (rnc_number, full_name, status, condition)
      VALUES ('${rncNumber}', '${fullName}', 'ACTIVO', 'NORMAL');
    `);
  } finally {
    fixtureDb.close();
  }

  const sqliteBuffer = await readFile(dbPath);
  await pipeline(
    createReadStream(dbPath),
    createGzip(),
    createWriteStream(gzipPath),
  );
  const gzipBuffer = await readFile(gzipPath);

  return {
    gzipPath,
    sha256: createHash('sha256').update(gzipBuffer).digest('hex'),
    sqliteBytes: sqliteBuffer.length,
    sqliteSha256: createHash('sha256').update(sqliteBuffer).digest('hex'),
  };
};

const createManifest = ({
  generatedAt,
  generation,
  sha256,
  sqliteBytes = 1024,
  sqliteSha256,
}) => ({
  generatedAt,
  generation,
  rowCount: 1,
  schemaVersion: 1,
  sha256,
  snapshotGzipSha256: sha256,
  snapshotPath: `rnc/snapshots/${sha256}.sqlite.gz`,
  source: {
    type: 'unit-test',
  },
  sqliteBytes,
  sqliteGzipBytes: 512,
  ...(sqliteSha256 ? { sqliteSha256 } : {}),
});

const createManifestFileMock = ({ getManifest }) => ({
  download: vi.fn(async () => [
    Buffer.from(JSON.stringify(getManifest()), 'utf8'),
  ]),
  getMetadata: vi.fn(async () => [
    {
      generation: `manifest-${getManifest().generation}`,
      updated: getManifest().generatedAt,
    },
  ]),
});

const createSnapshotFileMock = ({ generation, gzipPath }) => ({
  bucket: {
    name: 'test-rnc-bucket',
  },
  createReadStream: vi.fn(() => createReadStream(gzipPath)),
  getMetadata: vi.fn(async () => [
    {
      generation,
      updated: '2026-06-17T10:00:00.000Z',
    },
  ]),
});

const createDelayedSnapshotFileMock = ({
  generation,
  gzipPath,
  onDownloadEnd,
  onDownloadStart,
}) => ({
  bucket: {
    name: 'test-rnc-bucket',
  },
  createReadStream: vi.fn(() => {
    onDownloadStart?.();
    const delayedStream = new Transform({
      transform(chunk, _encoding, callback) {
        setTimeout(() => {
          callback(null, chunk);
        }, 20);
      },
    });
    const stream = createReadStream(gzipPath).pipe(delayedStream);
    const finishDownload = () => {
      onDownloadEnd?.();
    };
    stream.once('end', finishDownload);
    stream.once('error', finishDownload);
    return stream;
  }),
  getMetadata: vi.fn(async () => [
    {
      generation,
      updated: '2026-06-17T10:00:00.000Z',
    },
  ]),
});

describe('createRncSqliteRepository', () => {
  afterEach(async () => {
    resetRncSqliteCacheForTests();
    storageMocks.files.clear();
    vi.clearAllMocks();

    if (db) {
      db.close();
      db = null;
    }

    if (originalMaxSqliteBytesEnv === undefined) {
      delete process.env.RNC_SQLITE_MAX_BYTES;
    } else {
      process.env.RNC_SQLITE_MAX_BYTES = originalMaxSqliteBytesEnv;
    }

    for (const tempDir of tempDirs) {
      await rm(tempDir, { recursive: true, force: true });
    }
    tempDirs = [];
  });

  it('finds an RNC by the configured indexed column', async () => {
    const database = await createDatabase();
    const repository = createRncSqliteRepository({
      database,
      config: {
        storagePath: 'rnc.sqlite.gz',
        table: 'rnc',
        rncColumn: 'rnc_number',
        lastUpdated: '2026-06-17',
      },
    });

    await expect(repository.findByRnc('401007551')).resolves.toMatchObject({
      rnc_number: '401007551',
      full_name: 'EMPRESA EJEMPLO SRL',
      status: 'ACTIVO',
    });
    expect(repository.getSnapshotMetadata()).toMatchObject({
      lastUpdated: '2026-06-17',
      storagePath: 'rnc.sqlite.gz',
    });
  });

  it('rejects unsafe identifiers', () => {
    expect(() =>
      createRncSqliteRepository({
        database: {},
        config: {
          storagePath: 'rnc.sqlite.gz',
          table: 'rnc; DROP TABLE rnc;',
          rncColumn: 'rnc_number',
        },
      }),
    ).toThrow('Identificador SQLite invalido para RNC');
  });

  it('reads current manifest snapshotPath and shares one cold-start download', async () => {
    const fixture = await createGzippedDatabase({
      fullName: 'EMPRESA CURRENT SRL',
      rncNumber: '401007551',
    });
    const manifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: fixture.sha256,
      sqliteBytes: fixture.sqliteBytes,
      sqliteSha256: fixture.sqliteSha256,
    });
    const manifestFile = createManifestFileMock({
      getManifest: () => manifest,
    });
    const snapshotFile = createSnapshotFileMock({
      generation: '1',
      gzipPath: fixture.gzipPath,
    });
    storageMocks.files.set('rnc/current.json', manifestFile);
    storageMocks.files.set(manifest.snapshotPath, snapshotFile);

    const config = {
      bucketName: 'test-rnc-bucket',
      cacheTtlMs: 15 * 60 * 1000,
      currentManifestPath: 'rnc/current.json',
      rncColumn: 'rnc_number',
      table: 'rnc',
    };

    const [firstDatabase, secondDatabase] = await Promise.all([
      openRncSqliteDatabase(config),
      openRncSqliteDatabase(config),
    ]);

    expect(firstDatabase).toBe(secondDatabase);
    expect(manifestFile.download).toHaveBeenCalledTimes(2);
    expect(snapshotFile.createReadStream).toHaveBeenCalledTimes(1);

    const repository = createRncSqliteRepository({ config });
    await expect(repository.findByRnc('401007551')).resolves.toMatchObject({
      full_name: 'EMPRESA CURRENT SRL',
      rnc_number: '401007551',
    });
    expect(repository.getSnapshotMetadata()).toMatchObject({
      currentManifestPath: 'rnc/current.json',
      generation: '1',
      sha256: fixture.sha256,
      snapshotPath: manifest.snapshotPath,
    });
  });

  it('shares one SQLite open for 20 concurrent cold-start requests', async () => {
    const fixture = await createGzippedDatabase({
      fullName: 'EMPRESA CONCURRENTE SRL',
      rncNumber: '401007551',
    });
    const manifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: fixture.sha256,
      sqliteBytes: fixture.sqliteBytes,
      sqliteSha256: fixture.sqliteSha256,
    });
    const manifestFile = createManifestFileMock({
      getManifest: () => manifest,
    });
    const snapshotFile = createSnapshotFileMock({
      generation: '1',
      gzipPath: fixture.gzipPath,
    });
    storageMocks.files.set('rnc/current.json', manifestFile);
    storageMocks.files.set(manifest.snapshotPath, snapshotFile);

    const config = {
      bucketName: 'test-rnc-bucket',
      cacheTtlMs: 15 * 60 * 1000,
      currentManifestPath: 'rnc/current.json',
      rncColumn: 'rnc_number',
      table: 'rnc',
    };

    const databases = await Promise.all(
      Array.from({ length: 20 }, () => openRncSqliteDatabase(config)),
    );

    expect(new Set(databases).size).toBe(1);
    expect(manifestFile.download).toHaveBeenCalledTimes(2);
    expect(snapshotFile.createReadStream).toHaveBeenCalledTimes(1);

    const repository = createRncSqliteRepository({ config });
    const rows = await Promise.all(
      Array.from({ length: 20 }, () => repository.findByRnc('401007551')),
    );

    expect(rows).toHaveLength(20);
    expect(rows).toEqual(
      Array.from({ length: 20 }, () =>
        expect.objectContaining({
          full_name: 'EMPRESA CONCURRENTE SRL',
          rnc_number: '401007551',
        }),
      ),
    );
  });

  it('dereferences current manifest pointers to versioned snapshot manifests', async () => {
    const fixture = await createGzippedDatabase({
      fullName: 'EMPRESA POINTER SRL',
      rncNumber: '401007551',
    });
    const manifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: fixture.sha256,
      sqliteBytes: fixture.sqliteBytes,
      sqliteSha256: fixture.sqliteSha256,
    });
    const manifestPath = `rnc/manifests/${fixture.sha256}.json`;
    const currentFile = {
      download: vi.fn(async () => [
        Buffer.from(
          JSON.stringify({
            manifestPath,
            schemaVersion: 1,
            sha256: fixture.sha256,
          }),
          'utf8',
        ),
      ]),
      getMetadata: vi.fn(async () => [
        {
          generation: 'current-1',
          updated: '2026-06-17T10:00:01.000Z',
        },
      ]),
    };
    const manifestFile = createManifestFileMock({
      getManifest: () => manifest,
    });
    const snapshotFile = createSnapshotFileMock({
      generation: '1',
      gzipPath: fixture.gzipPath,
    });
    storageMocks.files.set('rnc/current.json', currentFile);
    storageMocks.files.set(manifestPath, manifestFile);
    storageMocks.files.set(manifest.snapshotPath, snapshotFile);

    const repository = createRncSqliteRepository({
      config: {
        bucketName: 'test-rnc-bucket',
        currentManifestPath: 'rnc/current.json',
        rncColumn: 'rnc_number',
        table: 'rnc',
      },
    });

    await expect(repository.findByRnc('401007551')).resolves.toMatchObject({
      full_name: 'EMPRESA POINTER SRL',
      rnc_number: '401007551',
    });
    expect(currentFile.download).toHaveBeenCalledTimes(2);
    expect(manifestFile.download).toHaveBeenCalledTimes(2);
    expect(snapshotFile.createReadStream).toHaveBeenCalledTimes(1);
    expect(repository.getSnapshotMetadata()).toMatchObject({
      currentManifestPath: 'rnc/current.json',
      generation: '1',
      sha256: fixture.sha256,
      snapshotPath: manifest.snapshotPath,
    });
  });

  it('falls back to the legacy fixed snapshot when current manifest is missing', async () => {
    const fixture = await createGzippedDatabase({
      fullName: 'EMPRESA LEGACY SRL',
      rncNumber: '401007551',
    });
    const notFound = Object.assign(new Error('not found'), { code: 404 });
    const currentFile = {
      download: vi.fn(),
      getMetadata: vi.fn(async () => {
        throw notFound;
      }),
    };
    const legacySnapshotFile = createSnapshotFileMock({
      generation: 'legacy-1',
      gzipPath: fixture.gzipPath,
    });
    storageMocks.files.set('rnc/current.json', currentFile);
    storageMocks.files.set('rnc.sqlite.gz', legacySnapshotFile);

    const config = {
      bucketName: 'test-rnc-bucket',
      currentManifestPath: 'rnc/current.json',
      enableLegacyFallback: true,
      legacyStoragePath: 'rnc.sqlite.gz',
      rncColumn: 'rnc_number',
      table: 'rnc',
    };
    const repository = createRncSqliteRepository({ config });

    await expect(repository.findByRnc('401007551')).resolves.toMatchObject({
      full_name: 'EMPRESA LEGACY SRL',
      rnc_number: '401007551',
    });
    expect(repository.getSnapshotMetadata()).toMatchObject({
      generation: 'legacy-1',
      snapshotPath: 'rnc.sqlite.gz',
      storagePath: 'rnc.sqlite.gz',
    });
  });

  it('does not use the legacy fixed snapshot unless explicitly enabled', async () => {
    const fixture = await createGzippedDatabase({
      fullName: 'EMPRESA LEGACY SRL',
      rncNumber: '401007551',
    });
    const notFound = Object.assign(new Error('not found'), { code: 404 });
    storageMocks.files.set('rnc/current.json', {
      download: vi.fn(),
      getMetadata: vi.fn(async () => {
        throw notFound;
      }),
    });
    storageMocks.files.set(
      'rnc.sqlite.gz',
      createSnapshotFileMock({
        generation: 'legacy-1',
        gzipPath: fixture.gzipPath,
      }),
    );

    const repository = createRncSqliteRepository({
      config: {
        bucketName: 'test-rnc-bucket',
        currentManifestPath: 'rnc/current.json',
        legacyStoragePath: 'rnc.sqlite.gz',
        rncColumn: 'rnc_number',
        table: 'rnc',
      },
    });

    await expect(repository.findByRnc('401007551')).rejects.toMatchObject({
      code: 'failed-precondition',
    });
  });

  it('rejects a corrupted gzip snapshot on cold start', async () => {
    const badDir = await createTempDir();
    const badGzipPath = path.join(badDir, 'bad.sqlite.gz');
    const badBytes = Buffer.from('not a gzip file');
    await writeFile(badGzipPath, badBytes);
    const badSha256 = createHash('sha256').update(badBytes).digest('hex');
    const manifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: badSha256,
    });
    storageMocks.files.set(
      'rnc/current.json',
      createManifestFileMock({
        getManifest: () => manifest,
      }),
    );
    storageMocks.files.set(
      manifest.snapshotPath,
      createSnapshotFileMock({
        generation: '1',
        gzipPath: badGzipPath,
      }),
    );

    const repository = createRncSqliteRepository({
      config: {
        bucketName: 'test-rnc-bucket',
        currentManifestPath: 'rnc/current.json',
        rncColumn: 'rnc_number',
        table: 'rnc',
      },
    });

    await expect(repository.findByRnc('401007551')).rejects.toThrow();
  });

  it('rejects an oversized SQLite snapshot while streaming gunzip output', async () => {
    const fixture = await createGzippedDatabase({
      fullName: 'EMPRESA GRANDE SRL',
      rncNumber: '401007551',
    });
    const manifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: fixture.sha256,
      sqliteBytes: fixture.sqliteBytes,
      sqliteSha256: fixture.sqliteSha256,
    });
    storageMocks.files.set(
      'rnc/current.json',
      createManifestFileMock({
        getManifest: () => manifest,
      }),
    );
    storageMocks.files.set(
      manifest.snapshotPath,
      createSnapshotFileMock({
        generation: '1',
        gzipPath: fixture.gzipPath,
      }),
    );

    const repository = createRncSqliteRepository({
      config: {
        bucketName: 'test-rnc-bucket',
        currentManifestPath: 'rnc/current.json',
        maxSqliteBytes: fixture.sqliteBytes - 1,
        rncColumn: 'rnc_number',
        table: 'rnc',
      },
    });

    await expect(repository.findByRnc('401007551')).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'SQLite RNC excede el maximo permitido para runtime.',
    });
  });

  it('honors RNC_SQLITE_MAX_BYTES when config leaves the runtime limit unset', async () => {
    const fixture = await createGzippedDatabase({
      fullName: 'EMPRESA LIMITE ENV SRL',
      rncNumber: '401007551',
    });
    const manifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: fixture.sha256,
      sqliteBytes: fixture.sqliteBytes,
      sqliteSha256: fixture.sqliteSha256,
    });
    storageMocks.files.set(
      'rnc/current.json',
      createManifestFileMock({
        getManifest: () => manifest,
      }),
    );
    storageMocks.files.set(
      manifest.snapshotPath,
      createSnapshotFileMock({
        generation: '1',
        gzipPath: fixture.gzipPath,
      }),
    );
    process.env.RNC_SQLITE_MAX_BYTES = String(fixture.sqliteBytes - 1);

    const repository = createRncSqliteRepository({
      config: {
        bucketName: 'test-rnc-bucket',
        currentManifestPath: 'rnc/current.json',
        rncColumn: 'rnc_number',
        table: 'rnc',
      },
    });

    await expect(repository.findByRnc('401007551')).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'SQLite RNC excede el maximo permitido para runtime.',
    });
  });

  it('keeps the runtime SQLite byte cap aligned with lookup memory', () => {
    expect(RNC_SQLITE_MAX_RUNTIME_BYTES).toBe(512 * 1024 * 1024);
  });

  it('shares one snapshot download by SHA even when initialization keys differ', async () => {
    const fixture = await createGzippedDatabase({
      fullName: 'EMPRESA SINGLE FLIGHT SRL',
      rncNumber: '401007551',
    });
    const manifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: fixture.sha256,
      sqliteBytes: fixture.sqliteBytes,
      sqliteSha256: fixture.sqliteSha256,
    });
    const manifestFile = createManifestFileMock({
      getManifest: () => manifest,
    });
    const snapshotFile = createSnapshotFileMock({
      generation: '1',
      gzipPath: fixture.gzipPath,
    });
    storageMocks.files.set('rnc/current.json', manifestFile);
    storageMocks.files.set(manifest.snapshotPath, snapshotFile);

    const baseConfig = {
      bucketName: 'test-rnc-bucket',
      currentManifestPath: 'rnc/current.json',
      rncColumn: 'rnc_number',
      table: 'rnc',
    };

    const [firstDatabase, secondDatabase] = await Promise.all([
      openRncSqliteDatabase({
        ...baseConfig,
        legacyStoragePath: 'legacy-a.sqlite.gz',
      }),
      openRncSqliteDatabase({
        ...baseConfig,
        legacyStoragePath: 'legacy-b.sqlite.gz',
      }),
    ]);

    expect(firstDatabase).toBeTruthy();
    expect(secondDatabase).toBe(firstDatabase);
    expect(snapshotFile.createReadStream).toHaveBeenCalledTimes(1);
  });

  it('serializes downloads for different snapshot SHAs across config keys', async () => {
    const firstFixture = await createGzippedDatabase({
      fullName: 'EMPRESA TRANSICION B SRL',
      rncNumber: '401007551',
    });
    const secondFixture = await createGzippedDatabase({
      fullName: 'EMPRESA TRANSICION C SRL',
      rncNumber: '401007551',
    });
    const firstManifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: firstFixture.sha256,
      sqliteBytes: firstFixture.sqliteBytes,
      sqliteSha256: firstFixture.sqliteSha256,
    });
    const secondManifest = createManifest({
      generatedAt: '2026-06-17T10:01:00.000Z',
      generation: '2',
      sha256: secondFixture.sha256,
      sqliteBytes: secondFixture.sqliteBytes,
      sqliteSha256: secondFixture.sqliteSha256,
    });
    let activeDownloads = 0;
    let maxActiveDownloads = 0;
    const trackDownloadStart = () => {
      activeDownloads += 1;
      maxActiveDownloads = Math.max(maxActiveDownloads, activeDownloads);
    };
    const trackDownloadEnd = () => {
      activeDownloads -= 1;
    };
    const firstSnapshotFile = createDelayedSnapshotFileMock({
      generation: '1',
      gzipPath: firstFixture.gzipPath,
      onDownloadEnd: trackDownloadEnd,
      onDownloadStart: trackDownloadStart,
    });
    const secondSnapshotFile = createDelayedSnapshotFileMock({
      generation: '2',
      gzipPath: secondFixture.gzipPath,
      onDownloadEnd: trackDownloadEnd,
      onDownloadStart: trackDownloadStart,
    });
    storageMocks.files.set(
      'rnc/current-b.json',
      createManifestFileMock({
        getManifest: () => firstManifest,
      }),
    );
    storageMocks.files.set(
      'rnc/current-c.json',
      createManifestFileMock({
        getManifest: () => secondManifest,
      }),
    );
    storageMocks.files.set(firstManifest.snapshotPath, firstSnapshotFile);
    storageMocks.files.set(secondManifest.snapshotPath, secondSnapshotFile);

    const baseConfig = {
      bucketName: 'test-rnc-bucket',
      rncColumn: 'rnc_number',
      table: 'rnc',
    };

    await Promise.all([
      openRncSqliteDatabase({
        ...baseConfig,
        currentManifestPath: 'rnc/current-b.json',
      }),
      openRncSqliteDatabase({
        ...baseConfig,
        currentManifestPath: 'rnc/current-c.json',
      }),
    ]);

    expect(firstSnapshotFile.createReadStream).toHaveBeenCalledTimes(1);
    expect(secondSnapshotFile.createReadStream).toHaveBeenCalledTimes(1);
    expect(maxActiveDownloads).toBe(1);
  });

  it('rejects activation when current.json changes after download', async () => {
    const firstFixture = await createGzippedDatabase({
      fullName: 'EMPRESA DESCARGADA SRL',
      rncNumber: '401007551',
    });
    const secondFixture = await createGzippedDatabase({
      fullName: 'EMPRESA ACTUAL SRL',
      rncNumber: '401007551',
    });
    const firstManifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: firstFixture.sha256,
      sqliteBytes: firstFixture.sqliteBytes,
      sqliteSha256: firstFixture.sqliteSha256,
    });
    const secondManifest = createManifest({
      generatedAt: '2026-06-17T10:01:00.000Z',
      generation: '2',
      sha256: secondFixture.sha256,
      sqliteBytes: secondFixture.sqliteBytes,
      sqliteSha256: secondFixture.sqliteSha256,
    });
    let activeManifest = firstManifest;
    const manifestFile = {
      download: vi.fn(async () => {
        const manifest = activeManifest;
        activeManifest = secondManifest;
        return [Buffer.from(JSON.stringify(manifest), 'utf8')];
      }),
      getMetadata: vi.fn(async () => [
        {
          generation: `manifest-${activeManifest.generation}`,
          updated: activeManifest.generatedAt,
        },
      ]),
    };
    storageMocks.files.set('rnc/current.json', manifestFile);
    storageMocks.files.set(
      firstManifest.snapshotPath,
      createSnapshotFileMock({
        generation: '1',
        gzipPath: firstFixture.gzipPath,
      }),
    );
    storageMocks.files.set(
      secondManifest.snapshotPath,
      createSnapshotFileMock({
        generation: '2',
        gzipPath: secondFixture.gzipPath,
      }),
    );
    const downloadedCachePath = path.join(
      tmpdir(),
      'ventamas-rnc',
      `${firstFixture.sha256}.sqlite`,
    );
    await rm(downloadedCachePath, { force: true });

    const repository = createRncSqliteRepository({
      config: {
        bucketName: 'test-rnc-bucket',
        currentManifestPath: 'rnc/current.json',
        rncColumn: 'rnc_number',
        table: 'rnc',
      },
    });

    await expect(repository.findByRnc('401007551')).rejects.toMatchObject({
      code: 'failed-precondition',
    });
    await expect(readFile(downloadedCachePath)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('refreshes hot instances when current manifest sha changes after TTL', async () => {
    const firstFixture = await createGzippedDatabase({
      fullName: 'EMPRESA PRIMERA SRL',
      rncNumber: '401007551',
    });
    const secondFixture = await createGzippedDatabase({
      fullName: 'EMPRESA SEGUNDA SRL',
      rncNumber: '401007551',
    });
    const firstManifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: firstFixture.sha256,
      sqliteBytes: firstFixture.sqliteBytes,
      sqliteSha256: firstFixture.sqliteSha256,
    });
    const secondManifest = createManifest({
      generatedAt: '2026-06-17T10:15:00.000Z',
      generation: '2',
      sha256: secondFixture.sha256,
      sqliteBytes: secondFixture.sqliteBytes,
      sqliteSha256: secondFixture.sqliteSha256,
    });
    let activeManifest = firstManifest;
    const manifestFile = createManifestFileMock({
      getManifest: () => activeManifest,
    });
    const firstSnapshotFile = createSnapshotFileMock({
      generation: '1',
      gzipPath: firstFixture.gzipPath,
    });
    const secondSnapshotFile = createSnapshotFileMock({
      generation: '2',
      gzipPath: secondFixture.gzipPath,
    });
    storageMocks.files.set('rnc/current.json', manifestFile);
    storageMocks.files.set(firstManifest.snapshotPath, firstSnapshotFile);
    storageMocks.files.set(secondManifest.snapshotPath, secondSnapshotFile);

    const config = {
      bucketName: 'test-rnc-bucket',
      cacheTtlMs: 1,
      currentManifestPath: 'rnc/current.json',
      rncColumn: 'rnc_number',
      table: 'rnc',
    };
    let repository = createRncSqliteRepository({ config });

    await expect(repository.findByRnc('401007551')).resolves.toMatchObject({
      full_name: 'EMPRESA PRIMERA SRL',
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
    activeManifest = secondManifest;
    repository = createRncSqliteRepository({ config });

    await expect(repository.findByRnc('401007551')).resolves.toMatchObject({
      full_name: 'EMPRESA SEGUNDA SRL',
    });
    expect(firstSnapshotFile.createReadStream).toHaveBeenCalledTimes(1);
    expect(secondSnapshotFile.createReadStream).toHaveBeenCalledTimes(1);
  });

  it('keeps serving the previous SQLite when a newer snapshot fails activation', async () => {
    const firstFixture = await createGzippedDatabase({
      fullName: 'EMPRESA ESTABLE SRL',
      rncNumber: '401007551',
    });
    const firstManifest = createManifest({
      generatedAt: '2026-06-17T10:00:00.000Z',
      generation: '1',
      sha256: firstFixture.sha256,
      sqliteBytes: firstFixture.sqliteBytes,
      sqliteSha256: firstFixture.sqliteSha256,
    });
    const badDir = await createTempDir();
    const badGzipPath = path.join(badDir, 'bad.sqlite.gz');
    const badBytes = Buffer.from('not a gzip file');
    await writeFile(badGzipPath, badBytes);
    const badSha256 = createHash('sha256').update(badBytes).digest('hex');
    const badManifest = createManifest({
      generatedAt: '2026-06-17T10:15:00.000Z',
      generation: '2',
      sha256: badSha256,
    });
    let activeManifest = firstManifest;
    const manifestFile = createManifestFileMock({
      getManifest: () => activeManifest,
    });
    const firstSnapshotFile = createSnapshotFileMock({
      generation: '1',
      gzipPath: firstFixture.gzipPath,
    });
    const badSnapshotFile = createSnapshotFileMock({
      generation: '2',
      gzipPath: badGzipPath,
    });
    storageMocks.files.set('rnc/current.json', manifestFile);
    storageMocks.files.set(firstManifest.snapshotPath, firstSnapshotFile);
    storageMocks.files.set(badManifest.snapshotPath, badSnapshotFile);

    const config = {
      bucketName: 'test-rnc-bucket',
      cacheTtlMs: 1,
      currentManifestPath: 'rnc/current.json',
      rncColumn: 'rnc_number',
      table: 'rnc',
    };
    let repository = createRncSqliteRepository({ config });

    await expect(repository.findByRnc('401007551')).resolves.toMatchObject({
      full_name: 'EMPRESA ESTABLE SRL',
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
    activeManifest = badManifest;
    repository = createRncSqliteRepository({ config });

    await expect(repository.findByRnc('401007551')).resolves.toMatchObject({
      full_name: 'EMPRESA ESTABLE SRL',
    });
    expect(badSnapshotFile.createReadStream).toHaveBeenCalledTimes(1);
  });
});
