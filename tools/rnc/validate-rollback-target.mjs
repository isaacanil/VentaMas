#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import { createGunzip } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';

const usage = `
Uso:
  node tools/rnc/validate-rollback-target.mjs --bucket gs://bucket --hash <sha256>

Opcional:
  --manifest rnc/manifests/<sha256>.json
  --snapshot rnc/snapshots/<sha256>.sqlite.gz
  --expected-user-version 1
`;

const buildGcloudSpawn = (args) =>
  process.platform === 'win32'
    ? {
        args: ['/d', '/s', '/c', 'gcloud.cmd', ...args],
        command: 'cmd.exe',
      }
    : {
        args,
        command: 'gcloud',
      };

const parseArgs = (argv) => {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) {
      throw new Error(`Argumento invalido: ${key}`);
    }

    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Falta valor para ${key}`);
    }

    args[key.slice(2)] = value;
    index += 1;
  }

  return args;
};

const normalizeBucket = (bucket) => {
  if (!bucket) throw new Error('Debe indicar --bucket.');
  return bucket.replace(/\/+$/, '');
};

const assertSha256 = (value, label) => {
  if (!/^[a-f0-9]{64}$/i.test(String(value ?? ''))) {
    throw new Error(`${label} debe ser un SHA-256 valido.`);
  }
};

const buildGsUri = ({ bucket, objectPath }) =>
  `${normalizeBucket(bucket)}/${String(objectPath).replace(/^\/+/, '')}`;

const runGcloudCp = async ({ targetPath, uri }) => {
  const gcloud = buildGcloudSpawn(['storage', 'cp', uri, targetPath]);
  const child = spawn(gcloud.command, gcloud.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stderr = [];

  child.stderr.on('data', (chunk) => stderr.push(chunk));

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });

  if (exitCode !== 0) {
    throw new Error(
      `gcloud storage cp fallo para ${uri}: ${Buffer.concat(stderr).toString('utf8')}`,
    );
  }
};

const createHashTap = (hash) =>
  new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });

const downloadAndInflateSnapshot = async ({ bucket, manifest, tempDir }) => {
  const gzipHash = createHash('sha256');
  const sqliteHash = createHash('sha256');
  const gzipPath = path.join(tempDir, 'rollback-target.sqlite.gz');
  const sqlitePath = path.join(tempDir, 'rollback-target.sqlite');
  const uri = buildGsUri({ bucket, objectPath: manifest.snapshotPath });

  await runGcloudCp({
    targetPath: gzipPath,
    uri,
  });

  await pipeline(
    createReadStream(gzipPath),
    createHashTap(gzipHash),
    createGunzip(),
    createHashTap(sqliteHash),
    createWriteStream(sqlitePath),
  );

  return {
    gzipBytes: (await stat(gzipPath)).size,
    gzipSha256: gzipHash.digest('hex'),
    sqlitePath,
    sqliteSha256: sqliteHash.digest('hex'),
  };
};

const assertEqual = (actual, expected, label) => {
  if (expected == null || expected === '') return;
  if (actual !== expected) {
    throw new Error(`${label} no coincide. Esperado=${expected}; actual=${actual}`);
  }
};

const validateSqlite = ({ expectedUserVersion, manifest, sqlitePath }) => {
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    db.exec('PRAGMA query_only = ON;');
    const userVersion = Number(
      db.prepare('PRAGMA user_version').get()?.user_version ?? 0,
    );
    if (userVersion !== expectedUserVersion) {
      throw new Error(
        `user_version incompatible. Esperado=${expectedUserVersion}; actual=${userVersion}`,
      );
    }

    const quickCheckRows = db.prepare('PRAGMA quick_check').all();
    const quickCheck = quickCheckRows
      .map((row) => row.quick_check ?? Object.values(row)[0])
      .join('; ');
    if (quickCheck.toLowerCase() !== 'ok') {
      throw new Error(`PRAGMA quick_check fallo: ${quickCheck}`);
    }

    const rowCount = Number(
      db.prepare('SELECT COUNT(*) AS rowCount FROM rnc').get()?.rowCount ?? 0,
    );
    assertEqual(rowCount, manifest.rowCount, 'rowCount');

    return { quickCheck, rowCount, userVersion };
  } finally {
    db.close();
  }
};

const main = async () => {
  const args = parseArgs(process.argv);
  const bucket = normalizeBucket(args.bucket);
  const hash = args.hash?.toLowerCase();
  assertSha256(hash, '--hash');

  const manifestPath = args.manifest ?? `rnc/manifests/${hash}.json`;
  const manifestUri = buildGsUri({ bucket, objectPath: manifestPath });
  const tempDir = await mkdtemp(path.join(tmpdir(), 'ventamas-rnc-rollback-'));
  try {
    const localManifestPath = path.join(tempDir, 'manifest.json');
    await runGcloudCp({
      targetPath: localManifestPath,
      uri: manifestUri,
    });
    const manifest = JSON.parse(await readFile(localManifestPath, 'utf8'));
    const snapshotPath = args.snapshot ?? `rnc/snapshots/${hash}.sqlite.gz`;

    assertEqual(manifest.manifestPath, manifestPath, 'manifestPath');
    assertEqual(manifest.snapshotPath, snapshotPath, 'snapshotPath');
    assertEqual(
      manifest.snapshotGzipSha256 ?? manifest.sha256,
      hash,
      'snapshot hash',
    );

    const snapshot = await downloadAndInflateSnapshot({
      bucket,
      manifest,
      tempDir,
    });
    const sqliteStats = await stat(snapshot.sqlitePath);
    const gzipSha256 = snapshot.gzipSha256;

    assertEqual(gzipSha256, manifest.snapshotGzipSha256 ?? manifest.sha256, 'gzip sha256');
    assertEqual(snapshot.gzipBytes, manifest.sqliteGzipBytes, 'sqliteGzipBytes');
    assertEqual(snapshot.sqliteSha256, manifest.sqliteSha256, 'sqliteSha256');
    assertEqual(sqliteStats.size, manifest.sqliteBytes, 'sqliteBytes');

    const sqlite = validateSqlite({
      expectedUserVersion: Number(args['expected-user-version'] ?? 1),
      manifest,
      sqlitePath: snapshot.sqlitePath,
    });

    const output = {
      ok: true,
      gzipSha256,
      manifestPath,
      quickCheck: sqlite.quickCheck,
      rowCount: sqlite.rowCount,
      snapshotPath,
      sqliteBytes: sqliteStats.size,
      sqliteSha256: snapshot.sqliteSha256,
      userVersion: sqlite.userVersion,
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

main().catch((error) => {
  process.stderr.write(`${error?.message ?? error}\n${usage}`);
  process.exit(1);
});
