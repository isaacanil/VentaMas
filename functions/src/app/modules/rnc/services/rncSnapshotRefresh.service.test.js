import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { Zip, ZipPassThrough, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => {
  const save = vi.fn();
  const getMetadata = vi.fn();
  const download = vi.fn();
  const manifestObjects = new Map();
  const notFound = () => Object.assign(new Error('not found'), { code: 404 });
  const preconditionFailed = () =>
    Object.assign(new Error('precondition failed'), { code: 412 });
  const file = vi.fn((name) => ({
    bucket: {
      name: 'test-bucket',
    },
    async download() {
      download(name);
      const object = manifestObjects.get(name);
      if (!object) throw notFound();
      return [
        Buffer.isBuffer(object.body)
          ? Buffer.from(object.body)
          : Buffer.from(object.body, 'utf8'),
      ];
    },
    async getMetadata() {
      getMetadata(name);
      const object = manifestObjects.get(name);
      if (!object) throw notFound();
      return [object.metadata];
    },
    name,
    async save(...args) {
      const [body, options = {}] = args;
      save(name, ...args);
      const existing = manifestObjects.get(name);
      const ifGenerationMatch =
        options?.preconditionOpts?.ifGenerationMatch;
      if (ifGenerationMatch !== undefined) {
        if (ifGenerationMatch === 0 && existing) {
          throw preconditionFailed();
        }
        if (
          ifGenerationMatch !== 0 &&
          existing?.metadata?.generation !== String(ifGenerationMatch)
        ) {
          throw preconditionFailed();
        }
      }
      manifestObjects.set(name, {
        body: Buffer.isBuffer(body) ? Buffer.from(body) : String(body),
        metadata: {
          generation: String(manifestObjects.size + 1),
          updated: '2026-06-17T10:00:01.000Z',
        },
      });
      return undefined;
    },
  }));
  const bucket = vi.fn(() => ({
    name: 'test-bucket',
    file,
  }));

  return {
    bucket,
    deleteObject(path) {
      manifestObjects.delete(path);
    },
    download,
    file,
    getObject(path) {
      return manifestObjects.get(path);
    },
    getMetadata,
    reset() {
      manifestObjects.clear();
      save.mockClear();
      getMetadata.mockClear();
      download.mockClear();
      file.mockClear();
      bucket.mockClear();
    },
    save,
    setCurrentManifest(path, manifest, metadata = {}) {
      manifestObjects.set(path, {
        body: JSON.stringify(manifest),
        metadata: {
          generation: '1',
          updated: '2026-06-16T10:00:00.000Z',
          ...metadata,
        },
      });
    },
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  storage: {
    bucket: storageMocks.bucket,
  },
}));

import {
  buildRncSqliteFromDgiiText,
  refreshRncSnapshot,
} from './rncSnapshotRefresh.service.js';

let tempDir;

const createTempDbPath = async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'ventamas-rnc-refresh-test-'));
  return path.join(tempDir, 'rnc.sqlite');
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const buildCrc32Table = () => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    table[index] = crc >>> 0;
  }
  return table;
};

const CRC32_TABLE = buildCrc32Table();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const CURRENT_RNC_PARSER_VERSION = '2026-06-18.1';
const OLD_RNC_PARSER_VERSION = '2026-06-17.1';

const createZipFixtureFromBuffer = (zipped) => {
  const buffer = Buffer.from(zipped);
  return {
    response: {
      ok: true,
      status: 200,
      async arrayBuffer() {
        return buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        );
      },
    },
    zipped: buffer,
  };
};

const createZipFixture = (text, entryName = 'TMP/DGII_RNC.TXT') =>
  createZipFixtureFromBuffer(
    zipSync({
      [entryName]: new TextEncoder().encode(text),
    }),
  );

const createZipFixtureFromEntries = (entries) => {
  const chunks = [];
  const zip = new Zip((error, chunk) => {
    if (error) throw error;
    chunks.push(Buffer.from(chunk));
  });

  for (const [entryName, text] of entries) {
    const entry = new ZipPassThrough(entryName);
    zip.add(entry);
    entry.push(new TextEncoder().encode(text), true);
  }
  zip.end();

  return createZipFixtureFromBuffer(Buffer.concat(chunks));
};

const createStoredZipFixture = (entries) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const localName = entry.localName ?? entry.name;
    const centralName = entry.centralName ?? entry.name;
    const localNameBytes = Buffer.from(localName, 'utf8');
    const centralNameBytes = Buffer.from(centralName, 'utf8');
    const body = Buffer.isBuffer(entry.body)
      ? entry.body
      : Buffer.from(entry.body ?? '', 'utf8');
    const entryCrc32 = entry.crc32 ?? crc32(body);
    const localCrc32 = entry.localCrc32 ?? entryCrc32;
    const centralCrc32 = entry.centralCrc32 ?? entryCrc32;
    const localCompressedSize =
      entry.localCompressedSize ?? entry.compressedSize ?? body.length;
    const localUncompressedSize =
      entry.localUncompressedSize ?? entry.uncompressedSize ?? body.length;
    const centralCompressedSize =
      entry.centralCompressedSize ?? entry.compressedSize ?? body.length;
    const centralUncompressedSize =
      entry.centralUncompressedSize ?? entry.uncompressedSize ?? body.length;
    const compression = entry.compression ?? 0;
    const localCompression = entry.localCompression ?? compression;
    const centralCompression = entry.centralCompression ?? compression;
    const flags = entry.flags ?? 0;
    const localFlags = entry.localFlags ?? flags;
    const centralFlags = entry.centralFlags ?? flags;
    const versionMadeBy = entry.versionMadeBy ?? 20;
    const localOffset = offset;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(localFlags, 6);
    localHeader.writeUInt16LE(localCompression, 8);
    localHeader.writeUInt32LE(0, 10);
    localHeader.writeUInt32LE(localCrc32, 14);
    localHeader.writeUInt32LE(localCompressedSize, 18);
    localHeader.writeUInt32LE(localUncompressedSize, 22);
    localHeader.writeUInt16LE(localNameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, localNameBytes, body);
    offset += localHeader.length + localNameBytes.length + body.length;

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(versionMadeBy, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(centralFlags, 8);
    centralHeader.writeUInt16LE(centralCompression, 10);
    centralHeader.writeUInt32LE(0, 12);
    centralHeader.writeUInt32LE(centralCrc32, 16);
    centralHeader.writeUInt32LE(centralCompressedSize, 20);
    centralHeader.writeUInt32LE(centralUncompressedSize, 24);
    centralHeader.writeUInt16LE(centralNameBytes.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(entry.externalAttributes ?? 0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, centralNameBytes);
  }

  const centralDirectory = Buffer.concat(centralParts);
  const centralDirectoryOffset = offset;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(centralDirectoryOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return createZipFixtureFromBuffer(
    Buffer.concat([...localParts, centralDirectory, eocd]),
  );
};

const createStreamingZipResponse = (zipped, chunkSize = 16) => ({
  ok: true,
  status: 200,
  body: new ReadableStream({
    start(controller) {
      for (let offset = 0; offset < zipped.length; offset += chunkSize) {
        controller.enqueue(zipped.subarray(offset, offset + chunkSize));
      }
      controller.close();
    },
  }),
});

const createZipResponse = (text) => createZipFixture(text).response;

describe('rncSnapshotRefresh.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.reset();
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it('builds an indexed SQLite database from DGII pipe-delimited text', async () => {
    const dbPath = await createTempDbPath();
    const result = buildRncSqliteFromDgiiText({
      dbPath,
      sourceUpdatedAt: '2026-06-17T10:00:00.000Z',
      text: [
        '401007551|EMPRESA EJEMPLO SRL|COMERCIAL EJEMPLO|SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        'NO-VALIDO|Fila mala',
      ].join('\n'),
    });

    expect(result).toMatchObject({
      duplicateRncCount: 0,
      expectedFieldCount: 11,
      fieldCountDistribution: {
        2: 1,
        11: 1,
      },
      nonEmptyLineCount: 2,
      rowCount: 1,
      skippedRows: 1,
      validSourceRows: 1,
    });
    expect(result.parserVersion).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);

    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      expect(
        db
          .prepare(
            'SELECT rnc_number, full_name, business_name, business_activity, registration_date, status, condition FROM rnc WHERE rnc_number = ?',
          )
          .get('401007551'),
      ).toMatchObject({
        rnc_number: '401007551',
        full_name: 'EMPRESA EJEMPLO SRL',
        business_name: 'COMERCIAL EJEMPLO',
        business_activity: 'SERVICIOS',
        registration_date: '2026-06-17',
        status: 'ACTIVO',
        condition: 'NORMAL',
      });
    } finally {
      db.close();
    }
  });

  it('counts duplicate RNC rows separately from unique SQLite rows', async () => {
    const dbPath = await createTempDbPath();
    const result = buildRncSqliteFromDgiiText({
      dbPath,
      sourceUpdatedAt: null,
      text: [
        '401007551|EMPRESA ORIGINAL SRL|ORIGINAL|SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        '401007551|EMPRESA DUPLICADA SRL|DUPLICADA|SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      ].join('\n'),
    });

    expect(result).toMatchObject({
      duplicateRncCount: 1,
      rowCount: 1,
      validSourceRows: 2,
    });

    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      expect(
        db
          .prepare(
            'SELECT full_name, business_name FROM rnc WHERE rnc_number = ?',
          )
          .get('401007551'),
      ).toMatchObject({
        business_name: 'DUPLICADA',
        full_name: 'EMPRESA DUPLICADA SRL',
      });
    } finally {
      db.close();
    }
  });

  it('rejects DGII parser lines over the configured byte limit', async () => {
    const dbPath = await createTempDbPath();

    expect(() =>
      buildRncSqliteFromDgiiText({
        dbPath,
        maxLineBytes: 16,
        sourceUpdatedAt: null,
        text:
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      }),
    ).toThrow('Linea DGII RNC excede el maximo permitido');
  });

  it('rejects DGII parser fields over the configured byte limit', async () => {
    const dbPath = await createTempDbPath();

    expect(() =>
      buildRncSqliteFromDgiiText({
        dbPath,
        maxFieldBytes: 12,
        sourceUpdatedAt: null,
        text: [
          '401007551',
          'CAMPO-DEMASIADO-LARGO',
          '',
          'SERVICIOS',
          ' ',
          ' ',
          ' ',
          ' ',
          '17/06/2026',
          'ACTIVO',
          'NORMAL',
        ].join('|'),
      }),
    ).toThrow('Campo DGII RNC excede el maximo permitido');
  });


  it('downloads DGII ZIP, creates gzip SQLite, and uploads snapshot metadata', async () => {
    const fetchFn = vi.fn(async () =>
      createZipResponse(
        '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      ),
    );

    const result = await refreshRncSnapshot({
      env: {
        RNC_SQLITE_BUCKET: 'rnc-bucket',
        RNC_SQLITE_STORAGE_PATH: 'rnc.sqlite.gz',
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_PREFIX: 'rnc/snapshots',
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn,
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      ok: true,
      bucketName: 'test-bucket',
      currentManifestPath: 'rnc/current.json',
      duplicateRncCount: 0,
      duplicateRncRatio: 0,
      entryName: 'TMP/DGII_RNC.TXT',
      expectedEntryName: 'TMP/DGII_RNC.TXT',
      expectedFieldCount: 11,
      generatedAt: '2026-06-17T10:00:00.000Z',
      legacyStoragePath: 'rnc.sqlite.gz',
      maxDuplicateRncRatio: 0.01,
      maxDuplicateRncRatioIncrease: 0.005,
      minimumRowCount: 1,
      nonEmptyLineCount: 1,
      rowCount: 1,
      skippedRows: 0,
      trigger: 'unit-test',
      validation: {
        knownLookups: [
          {
            found: true,
            rnc: '401007551',
          },
        ],
        minimumRowCount: 1,
        qualityMetrics: {
          nullConditionRows: 0,
          nullFullNameRows: 0,
          nullStatusRows: 0,
        },
        quickCheck: 'ok',
        rowCount: 1,
        validationRncNumbers: ['401007551'],
      },
      validationRncNumbers: ['401007551'],
      validSourceRows: 1,
    });
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.snapshotGzipSha256).toBe(result.sha256);
    expect(result.sqliteGzipSha256).toBe(result.sha256);
    expect(result.sqliteSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.sourceZipSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.storagePath).toMatch(
      /^rnc\/snapshots\/[a-f0-9]{64}\.sqlite\.gz$/,
    );
    expect(result.manifest).toMatchObject({
      schemaVersion: 1,
      expectedEntryName: 'TMP/DGII_RNC.TXT',
      expectedFieldCount: 11,
      generatedAt: '2026-06-17T10:00:00.000Z',
      manifestCreatedAt: '2026-06-17T10:00:00.000Z',
      manifestPath: expect.stringMatching(
        /^rnc\/manifests\/[a-f0-9]{64}\.json$/,
      ),
      minimumRowCount: 1,
      parserVersion: expect.stringMatching(/^\d{4}-\d{2}-\d{2}\.\d+$/),
      duplicateRncRatio: 0,
      maxDuplicateRncRatio: 0.01,
      maxDuplicateRncRatioIncrease: 0.005,
      rowCount: 1,
      snapshotGzipSha256: result.sha256,
      snapshotPath: result.storagePath,
      trigger: 'unit-test',
      validation: {
        quickCheck: 'ok',
        rowCount: 1,
      },
    });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://dgii.gov.do/app/WebApps/Consultas/RNC/DGII_RNC.zip',
      expect.objectContaining({
        headers: expect.objectContaining({
          referer:
            'https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/rnc.aspx',
          'user-agent': expect.stringContaining('Mozilla/5.0'),
        }),
      }),
    );
    expect(storageMocks.bucket).toHaveBeenCalledWith('rnc-bucket');
    expect(storageMocks.file).toHaveBeenCalledWith('rnc/current.json');
    expect(storageMocks.file).toHaveBeenCalledWith(result.storagePath);
    expect(storageMocks.file).toHaveBeenCalledWith(result.metadataPath);
    expect(storageMocks.getMetadata).toHaveBeenCalledTimes(2);
    expect(storageMocks.save).toHaveBeenCalledTimes(3);
    expect(
      JSON.parse(storageMocks.getObject('rnc/current.json').body),
    ).toMatchObject({
      activatedAt: '2026-06-17T10:00:00.000Z',
      activationReason: 'publish',
      manifestPath: result.metadataPath,
      rejectedSha256List: [],
      schemaVersion: 1,
      sha256: result.sha256,
      snapshotGzipSha256: result.sha256,
    });
    expect(result.manifest).not.toHaveProperty('publishedAt');
    expect(
      JSON.parse(storageMocks.getObject('rnc/current.json').body),
    ).not.toHaveProperty('publishedAt');
    expect(storageMocks.save).toHaveBeenCalledWith(
      result.storagePath,
      expect.any(Buffer),
      expect.objectContaining({
        preconditionOpts: {
          ifGenerationMatch: 0,
        },
      }),
    );
    expect(storageMocks.save).toHaveBeenCalledWith(
      result.metadataPath,
      expect.any(String),
      expect.objectContaining({
        preconditionOpts: {
          ifGenerationMatch: 0,
        },
      }),
    );
    expect(storageMocks.save).toHaveBeenCalledWith(
      'rnc/current.json',
      expect.any(String),
      expect.objectContaining({
        preconditionOpts: {
          ifGenerationMatch: 0,
        },
      }),
    );
  });

  it('reuses identical snapshot and manifest objects after a partial publish retry', async () => {
    const text =
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL';
    const firstResult = await refreshRncSnapshot({
      env: {
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn: vi.fn(async () => createZipResponse(text)),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });
    storageMocks.deleteObject('rnc/current.json');
    storageMocks.save.mockClear();

    const secondResult = await refreshRncSnapshot({
      env: {
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn: vi.fn(async () => createZipResponse(text)),
      now: () => new Date('2026-06-17T10:05:00.000Z'),
      trigger: 'unit-test-retry',
    });

    expect(secondResult.sha256).toBe(firstResult.sha256);
    expect(secondResult.snapshotGzipSha256)
      .toBe(firstResult.snapshotGzipSha256);
    expect(secondResult.sqliteSha256).toBe(firstResult.sqliteSha256);
    expect(secondResult.metadataPath).toBe(firstResult.metadataPath);
    expect(secondResult.storagePath).toBe(firstResult.storagePath);
    expect(storageMocks.save).toHaveBeenCalledTimes(3);
    expect(
      JSON.parse(storageMocks.getObject('rnc/current.json').body),
    ).toMatchObject({
      manifestPath: firstResult.metadataPath,
      sha256: firstResult.sha256,
    });
  });

  it('publishes current with the existing generation when current.json already exists', async () => {
    const currentSha256 = 'a'.repeat(64);
    storageMocks.setCurrentManifest(
      'rnc/current.json',
      {
        schemaVersion: 1,
        generatedAt: '2026-06-16T10:00:00.000Z',
        rowCount: 1,
        sha256: currentSha256,
        snapshotPath: `rnc/snapshots/${currentSha256}.sqlite.gz`,
        source: {
          entryName: 'TMP/DGII_RNC.TXT',
          type: 'dgii-rnc-zip',
        },
        sqliteBytes: 4096,
        sqliteGzipBytes: 1024,
        validation: {
          minimumRowCount: 1,
          quickCheck: 'ok',
          validationRncNumbers: [],
        },
      },
      {
        generation: '7',
      },
    );

    const result = await refreshRncSnapshot({
      env: {
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '',
      },
      fetchFn: vi.fn(async () =>
        createZipResponse(
          '401007551|EMPRESA NUEVA SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        ),
      ),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(storageMocks.save).toHaveBeenCalledWith(
      'rnc/current.json',
      expect.any(String),
      expect.objectContaining({
        preconditionOpts: {
          ifGenerationMatch: '7',
        },
      }),
    );
    expect(result.currentPath).toBe('rnc/current.json');
  });

  it('rejects a DGII ZIP without the expected RNC entry before upload', async () => {
    const fixture = createZipFixture(
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      'TMP/OTRO_ARCHIVO.TXT',
    );

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'El ZIP DGII RNC contiene una entrada inesperada: TMP/OTRO_ARCHIVO.TXT.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects unsafe DGII ZIP entry paths before upload', async () => {
    const fixture = createZipFixture(
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      '../TMP/DGII_RNC.TXT',
    );

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('El ZIP DGII RNC contiene una entrada insegura');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects duplicate expected DGII ZIP entries before upload', async () => {
    const fixture = createZipFixtureFromEntries([
      [
        'TMP/DGII_RNC.TXT',
        '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      ],
      [
        'TMP/DGII_RNC.TXT',
        '401007551|EMPRESA DUPLICADA SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      ],
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'El ZIP DGII RNC contiene una entrada duplicada: TMP/DGII_RNC.TXT.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects an oversized expected DGII TXT before upload', async () => {
    const fixture = createZipFixture(
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
    );

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_DGII_MAX_TEXT_BYTES: '10',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('TXT DGII RNC excede el maximo permitido');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects encrypted DGII ZIP entries before upload', async () => {
    const fixture = createStoredZipFixture([
      {
        body:
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        flags: 0x0001,
        name: 'TMP/DGII_RNC.TXT',
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'El ZIP DGII RNC contiene una entrada cifrada: TMP/DGII_RNC.TXT.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects DGII TXT when the extracted CRC32 does not match', async () => {
    const fixture = createStoredZipFixture([
      {
        body:
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        crc32: 0,
        name: 'TMP/DGII_RNC.TXT',
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('CRC32 TXT DGII RNC no coincide');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects DGII ZIP entries when central and local headers differ', async () => {
    const fixture = createStoredZipFixture([
      {
        body:
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        localName: 'TMP/OTRO.TXT',
        name: 'TMP/DGII_RNC.TXT',
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Cabecera local ZIP DGII RNC no coincide con directorio central',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects DGII ZIP files with too many entries before upload', async () => {
    const fixture = createStoredZipFixture([
      {
        body:
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        name: 'TMP/DGII_RNC.TXT',
      },
      {
        body: 'extra',
        name: 'TMP/README.TXT',
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_DGII_MAX_ZIP_ENTRIES: '1',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('ZIP DGII RNC contiene 2 entradas, limite 1.');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects DGII ZIP files with an oversized central directory', async () => {
    const fixture = createStoredZipFixture([
      {
        body:
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        name: 'TMP/DGII_RNC.TXT',
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_DGII_MAX_ZIP_CENTRAL_DIRECTORY_BYTES: '8',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Directorio central ZIP DGII RNC excede el maximo permitido',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects absolute DGII ZIP paths before upload', async () => {
    const fixture = createStoredZipFixture([
      {
        body:
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        name: '/TMP/DGII_RNC.TXT',
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'El ZIP DGII RNC contiene una entrada insegura: /TMP/DGII_RNC.TXT.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects unexpected DGII ZIP entries before upload', async () => {
    const fixture = createStoredZipFixture([
      {
        body:
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
        name: 'TMP/DGII_RNC.TXT',
      },
      {
        body: 'no esperado',
        name: 'TMP/README.TXT',
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'El ZIP DGII RNC contiene una entrada inesperada: TMP/README.TXT.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects DGII ZIP symlink metadata before upload', async () => {
    const fixture = createStoredZipFixture([
      {
        body: 'TMP/DGII_RNC.TXT',
        externalAttributes: 0o120777 * 0x10000,
        name: 'TMP/DGII_RNC.TXT',
        versionMadeBy: (3 << 8) | 20,
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'El ZIP DGII RNC contiene un enlace no permitido: TMP/DGII_RNC.TXT.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects oversized DGII ZIP entry declarations before extraction', async () => {
    const fixture = createStoredZipFixture([
      {
        compressedSize: 0,
        name: 'TMP/DGII_RNC.TXT',
        uncompressedSize: 128,
      },
    ]);

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_DGII_MAX_TEXT_BYTES: '32',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'TXT DGII RNC excede el maximo permitido: 128 bytes, limite 32.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects an oversized DGII ZIP while reading a streaming response', async () => {
    const fixture = createZipFixture(
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
    );

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_DGII_MAX_ZIP_BYTES: '8',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () =>
          createStreamingZipResponse(fixture.zipped, 4),
        ),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('ZIP DGII RNC excede el maximo permitido');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects snapshots below the configured minimum row count before upload', async () => {
    const fetchFn = vi.fn(async () =>
      createZipResponse(
        '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      ),
    );

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '2',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn,
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('Snapshot RNC invalido: 1 filas, minimo esperado 2.');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('skips DGII rows with an unexpected field count within the configured limit', async () => {
    const fetchFn = vi.fn(async () =>
      createZipResponse(
        [
          '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
          '101000000|FILA CON COLUMNAS FALTANTES',
        ].join('\n'),
      ),
    );

    const result = await refreshRncSnapshot({
      env: {
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn,
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      fieldCountDistribution: {
        2: 1,
        11: 1,
      },
      rowCount: 1,
      skippedRows: 1,
    });
  });

  it('rejects snapshots when skipped rows exceed the configured limit', async () => {
    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MAX_SKIPPED_ROWS: '0',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () =>
          createZipResponse(
            [
              '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
              '101000000|FILA CON COLUMNAS FALTANTES',
            ].join('\n'),
          ),
        ),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('Snapshot RNC invalido: 1 filas omitidas, maximo 0.');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects snapshots when duplicate RNC ratio exceeds the configured limit', async () => {
    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO: '0.2',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () =>
          createZipResponse(
            [
              '401007551|EMPRESA ORIGINAL SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
              '101027797|3 M DOMINICANA SRL||SERVICIOS| | | | |04/05/1995|ACTIVO|NORMAL',
              '401007551|EMPRESA DUPLICADA SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
            ].join('\n'),
          ),
        ),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Snapshot RNC invalido: duplicateRncCount 1 equivale a 33.33% de validSourceRows',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('does not skip unchanged sources when manifest duplicate ratio exceeds the configured limit', async () => {
    const text = [
      '401007551|EMPRESA ORIGINAL SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      '401007551|EMPRESA DUPLICADA SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
    ].join('\n');
    const fixture = createZipFixture(text);
    const currentSha256 = 'a'.repeat(64);
    const currentManifestPath = `rnc/manifests/${currentSha256}.json`;
    storageMocks.setCurrentManifest('rnc/current.json', {
      manifestPath: currentManifestPath,
      schemaVersion: 1,
      sha256: currentSha256,
    });
    storageMocks.setCurrentManifest(currentManifestPath, {
      duplicateRncCount: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 1,
      schemaVersion: 1,
      sha256: currentSha256,
      snapshotPath: `rnc/snapshots/${currentSha256}.sqlite.gz`,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sourceZipSha256: sha256(fixture.zipped),
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      validSourceRows: 2,
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: [],
      },
    });

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
          RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO: '0.2',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '',
        },
        fetchFn: vi.fn(async () => fixture.response),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Snapshot RNC invalido: duplicateRncCount 1 equivale a 50.00% de validSourceRows',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('allows duplicate RNC count when no absolute limit is configured', async () => {
    const result = await refreshRncSnapshot({
      env: {
        RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO: '1',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn: vi.fn(async () =>
        createZipResponse(
          [
            '401007551|EMPRESA ORIGINAL SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
            '401007551|EMPRESA DUPLICADA 1 SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
            '401007551|EMPRESA DUPLICADA 2 SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
          ].join('\n'),
        ),
      ),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      duplicateRncCount: 2,
      duplicateRncRatio: 2 / 3,
      rowCount: 1,
      validSourceRows: 3,
    });
  });

  it('rejects snapshots when duplicate RNC count exceeds the configured limit', async () => {
    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MAX_DUPLICATE_RNC_COUNT: '1',
          RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO: '1',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
        },
        fetchFn: vi.fn(async () =>
          createZipResponse(
            [
              '401007551|EMPRESA ORIGINAL SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
              '401007551|EMPRESA DUPLICADA 1 SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
              '401007551|EMPRESA DUPLICADA 2 SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
            ].join('\n'),
          ),
        ),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Snapshot RNC invalido: duplicateRncCount 2, maximo 1.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects snapshots when duplicate RNC ratio jumps against the previous manifest', async () => {
    const currentSha256 = 'a'.repeat(64);
    storageMocks.setCurrentManifest('rnc/current.json', {
      duplicateRncCount: 1,
      schemaVersion: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 1,
      sha256: currentSha256,
      snapshotPath: `rnc/snapshots/${currentSha256}.sqlite.gz`,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      validSourceRows: 3,
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: [],
      },
    });

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
          RNC_SNAPSHOT_MAX_DUPLICATE_RNC_COUNT: '10',
          RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO: '1',
          RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO_INCREASE: '0.2',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '',
        },
        fetchFn: vi.fn(async () =>
          createZipResponse(
            [
              '401007551|EMPRESA ORIGINAL SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
              '401007551|EMPRESA DUPLICADA 1 SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
              '401007551|EMPRESA DUPLICADA 2 SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
            ].join('\n'),
          ),
        ),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Snapshot RNC invalido: duplicateRncCount subio 33.33 puntos',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects snapshots when row count increases above the configured ratio', async () => {
    const currentSha256 = 'a'.repeat(64);
    storageMocks.setCurrentManifest('rnc/current.json', {
      schemaVersion: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 1,
      sha256: currentSha256,
      snapshotPath: `rnc/snapshots/${currentSha256}.sqlite.gz`,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: [],
      },
    });

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
          RNC_SNAPSHOT_MAX_ROW_COUNT_INCREASE_RATIO: '0.2',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '',
        },
        fetchFn: vi.fn(async () =>
          createZipResponse(
            [
              '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
              '101027797|3 M DOMINICANA SRL|3 M DOMINICANA|SERVICIOS| | | | |04/05/1995|ACTIVO|NORMAL',
            ].join('\n'),
          ),
        ),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('Snapshot RNC invalido: rowCount subio 100.00%');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects snapshots when row count drops above the configured ratio', async () => {
    const currentSha256 = 'a'.repeat(64);
    storageMocks.setCurrentManifest('rnc/current.json', {
      schemaVersion: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 2,
      sha256: currentSha256,
      snapshotPath: `rnc/snapshots/${currentSha256}.sqlite.gz`,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: [],
      },
    });

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
          RNC_SNAPSHOT_MAX_ROW_COUNT_DROP_RATIO: '0.2',
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '',
        },
        fetchFn: vi.fn(async () =>
          createZipResponse(
            '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
          ),
        ),
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow('Snapshot RNC invalido: rowCount bajo 50.00%');

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects snapshots missing configured known RNC lookups before upload', async () => {
    const fetchFn = vi.fn(async () =>
      createZipResponse(
        '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      ),
    );

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401506254',
        },
        fetchFn,
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Snapshot RNC no contiene RNC de validacion: 401506254.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('rejects snapshots when configured canary records do not match expected fields', async () => {
    const fetchFn = vi.fn(async () =>
      createZipResponse(
        '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      ),
    );

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
          RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
          RNC_SNAPSHOT_VALIDATE_RECORDS_JSON: JSON.stringify([
            {
              rnc: '401007551',
              full_name: 'EMPRESA INCORRECTA SRL',
              status: 'ACTIVO',
              condition: 'NORMAL',
            },
          ]),
        },
        fetchFn,
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Snapshot RNC no coincide con registros canario: 401007551.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('uses multiple default known lookups', async () => {
    const fetchFn = vi.fn(async () =>
      createZipResponse(
        '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL',
      ),
    );

    await expect(
      refreshRncSnapshot({
        env: {
          RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        },
        fetchFn,
        now: () => new Date('2026-06-17T10:00:00.000Z'),
        trigger: 'unit-test',
      }),
    ).rejects.toThrow(
      'Snapshot RNC no contiene RNC de validacion: 401506254, 101027797, 101000155.',
    );

    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('skips publishing current when the DGII ZIP hash is unchanged', async () => {
    const text =
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL';
    const fixture = createZipFixture(text);
    const currentSha256 = 'a'.repeat(64);
    const currentManifestPath = `rnc/manifests/${currentSha256}.json`;
    const currentSnapshotPath = `rnc/snapshots/${currentSha256}.sqlite.gz`;
    storageMocks.setCurrentManifest('rnc/current.json', {
      manifestPath: currentManifestPath,
      schemaVersion: 1,
      sha256: currentSha256,
    });
    storageMocks.setCurrentManifest(currentManifestPath, {
      schemaVersion: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 123,
      sha256: currentSha256,
      skippedRows: 2,
      snapshotPath: currentSnapshotPath,
      entryName: 'TMP/DGII_RNC.TXT',
      minimumRowCount: 1,
      parserVersion: CURRENT_RNC_PARSER_VERSION,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      sourceZipSha256: sha256(fixture.zipped),
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: [],
      },
    });

    const result = await refreshRncSnapshot({
      env: {
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '',
        RNC_SQLITE_BUCKET: 'rnc-bucket',
      },
      fetchFn: vi.fn(async () => fixture.response),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      ok: true,
      skipped: true,
      skipReason: 'source-zip-unchanged',
      rowCount: 123,
      skippedRows: 2,
      storagePath: currentSnapshotPath,
    });
    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('regenerates when the current manifest parser version is stale', async () => {
    const text =
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL';
    const fixture = createZipFixture(text);
    const currentSha256 = 'a'.repeat(64);
    const currentManifestPath = `rnc/manifests/${currentSha256}.json`;
    const currentSnapshotPath = `rnc/snapshots/${currentSha256}.sqlite.gz`;
    storageMocks.setCurrentManifest('rnc/current.json', {
      manifestPath: currentManifestPath,
      schemaVersion: 1,
      sha256: currentSha256,
    });
    storageMocks.setCurrentManifest(currentManifestPath, {
      schemaVersion: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 1,
      sha256: currentSha256,
      skippedRows: 0,
      snapshotPath: currentSnapshotPath,
      entryName: 'TMP/DGII_RNC.TXT',
      minimumRowCount: 1,
      parserVersion: OLD_RNC_PARSER_VERSION,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      sourceTextSha256: sha256(text),
      sourceZipSha256: sha256(fixture.zipped),
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: [],
      },
    });

    const result = await refreshRncSnapshot({
      env: {
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '',
        RNC_SQLITE_BUCKET: 'rnc-bucket',
      },
      fetchFn: vi.fn(async () => fixture.response),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      ok: true,
      parserVersion: CURRENT_RNC_PARSER_VERSION,
      rowCount: 1,
      sourceTextSha256: sha256(text),
      sourceZipSha256: sha256(fixture.zipped),
    });
    expect(result).not.toHaveProperty('skipped');
    expect(result).not.toHaveProperty('skipReason');
    expect(storageMocks.save).toHaveBeenCalledTimes(3);
    expect(
      JSON.parse(storageMocks.getObject('rnc/current.json').body),
    ).toMatchObject({
      manifestPath: result.metadataPath,
      sha256: result.sha256,
    });
  });

  it('caps DGII download timeout to preserve refresh processing budget', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    const text =
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL';

    await refreshRncSnapshot({
      env: {
        RNC_DGII_DOWNLOAD_TIMEOUT_MS: '480000',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn: vi.fn(async () => createZipResponse(text)),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(timeoutSpy).toHaveBeenCalledWith(300000);
    timeoutSpy.mockRestore();
  });

  it('skips publishing current when ZIP bytes changed but extracted data did not', async () => {
    const text =
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL';
    const fixture = createZipFixture(text);
    const currentSha256 = 'a'.repeat(64);
    const currentManifestPath = `rnc/manifests/${currentSha256}.json`;
    const currentSnapshotPath = `rnc/snapshots/${currentSha256}.sqlite.gz`;
    storageMocks.setCurrentManifest('rnc/current.json', {
      manifestPath: currentManifestPath,
      schemaVersion: 1,
      sha256: currentSha256,
    });
    storageMocks.setCurrentManifest(currentManifestPath, {
      schemaVersion: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 123,
      sha256: currentSha256,
      skippedRows: 2,
      snapshotPath: currentSnapshotPath,
      entryName: 'TMP/DGII_RNC.TXT',
      minimumRowCount: 1,
      parserVersion: CURRENT_RNC_PARSER_VERSION,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      sourceTextSha256: sha256(text),
      sourceZipSha256: 'b'.repeat(64),
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: [],
      },
    });

    const result = await refreshRncSnapshot({
      env: {
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '',
        RNC_SQLITE_BUCKET: 'rnc-bucket',
      },
      fetchFn: vi.fn(async () => fixture.response),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      ok: true,
      skipped: true,
      skipReason: 'source-text-unchanged',
      sourceTextSha256: sha256(text),
      storagePath: currentSnapshotPath,
    });
    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('publishes a versioned manifest pointer when current still has legacy manifest shape', async () => {
    const text =
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL';
    const fixture = createZipFixture(text);
    const currentSha256 = 'a'.repeat(64);
    storageMocks.setCurrentManifest('rnc/current.json', {
      schemaVersion: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 1,
      sha256: currentSha256,
      skippedRows: 0,
      snapshotPath: `rnc/snapshots/${currentSha256}.sqlite.gz`,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      sourceZipSha256: sha256(fixture.zipped),
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: ['401007551'],
      },
    });

    const result = await refreshRncSnapshot({
      env: {
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn: vi.fn(async () => fixture.response),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      ok: true,
    });
    expect(result).not.toHaveProperty('skipped');
    expect(
      JSON.parse(storageMocks.getObject('rnc/current.json').body),
    ).toMatchObject({
      manifestPath: result.metadataPath,
      sha256: result.sha256,
    });
  });

  it('skips refresh while rollback hold is active on the current pointer', async () => {
    const currentSha256 = 'a'.repeat(64);
    const manifestPath = `rnc/manifests/${currentSha256}.json`;
    const currentSnapshotPath = `rnc/snapshots/${currentSha256}.sqlite.gz`;
    storageMocks.setCurrentManifest('rnc/current.json', {
      activatedAt: '2026-06-17T09:00:00.000Z',
      activationReason: 'rollback',
      manifestPath,
      rollbackHoldUntil: '2026-06-18T12:00:00.000Z',
      schemaVersion: 1,
      sha256: currentSha256,
    });
    storageMocks.setCurrentManifest(manifestPath, {
      schemaVersion: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      rowCount: 123,
      sha256: currentSha256,
      skippedRows: 2,
      snapshotPath: currentSnapshotPath,
      source: {
        entryName: 'TMP/DGII_RNC.TXT',
        type: 'dgii-rnc-zip',
      },
      sqliteBytes: 4096,
      sqliteGzipBytes: 1024,
      validation: {
        minimumRowCount: 1,
        quickCheck: 'ok',
        validationRncNumbers: [],
      },
    });
    const fetchFn = vi.fn();

    const result = await refreshRncSnapshot({
      env: {
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '',
      },
      fetchFn,
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      ok: true,
      rollbackHoldUntil: '2026-06-18T12:00:00.000Z',
      skipped: true,
      skipReason: 'rollback-hold-active',
      storagePath: currentSnapshotPath,
    });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(storageMocks.save).not.toHaveBeenCalled();
  });

  it('does not publish a snapshot hash listed as rejected', async () => {
    const text =
      '401007551|EMPRESA EJEMPLO SRL||SERVICIOS| | | | |17/06/2026|ACTIVO|NORMAL';
    const firstResult = await refreshRncSnapshot({
      env: {
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn: vi.fn(async () => createZipResponse(text)),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    storageMocks.reset();

    const result = await refreshRncSnapshot({
      env: {
        RNC_SNAPSHOT_MIN_ROW_COUNT: '1',
        RNC_SNAPSHOT_REJECTED_SHA256_LIST: firstResult.sha256,
        RNC_SNAPSHOT_VALIDATE_RNCS: '401007551',
      },
      fetchFn: vi.fn(async () => createZipResponse(text)),
      now: () => new Date('2026-06-17T10:00:00.000Z'),
      trigger: 'unit-test',
    });

    expect(result).toMatchObject({
      ok: true,
      rejectedSha256: firstResult.sha256,
      skipped: true,
      skipReason: 'snapshot-sha256-rejected',
    });
    expect(storageMocks.save).not.toHaveBeenCalled();
  });
});
