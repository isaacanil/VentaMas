#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const usage = `
Uso:
  node tools/rnc/prepare-rollback-pointer.mjs --bucket gs://bucket --hash <sha256> --reject-hash <sha256>
  node tools/rnc/prepare-rollback-pointer.mjs --bucket gs://bucket --hash <sha256> --reject-hash <sha256> --output .\\rollback-current.json
  node tools/rnc/prepare-rollback-pointer.mjs --bucket gs://bucket --hash <sha256> --reject-hash <sha256> --rollback-hold-hours 12 --publish

Opcional:
  --current-path rnc/current.json
  --manifest rnc/manifests/<sha256>.json
  --reject-hash <sha256>        Puede repetirse; se une con rejectedSha256List existente.
  --rollback-hold-until <iso>   Sobrescribe/preserva el hold con una fecha ISO valida.
  --rollback-hold-hours <horas> Define rollbackHoldUntil desde ahora.
  --clear-rollback-hold         Omite rollbackHoldUntil aunque exista en current.json.
  --expected-generation <gen>   Falla si current.json no esta en esa generacion.
  --output <path>               Escribe UTF-8 sin BOM. Si se omite y no hay --publish, imprime JSON.
  --publish                     Publica rnc/current.json con --if-generation-match=<generacion leida>.
`;

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const BOOLEAN_OPTIONS = new Set(['clear-rollback-hold', 'help', 'publish']);
const VALUE_OPTIONS = new Set([
  'bucket',
  'current-path',
  'expected-generation',
  'hash',
  'manifest',
  'output',
  'reject-hash',
  'rollback-hold-hours',
  'rollback-hold-until',
]);
const REPEATABLE_OPTIONS = new Set(['reject-hash']);

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
  const args = {
    'reject-hash': [],
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '-h') {
      args.help = true;
      continue;
    }

    if (!token.startsWith('--')) {
      throw new Error(`Argumento invalido: ${token}`);
    }

    const equalsIndex = token.indexOf('=');
    const key =
      equalsIndex === -1 ? token.slice(2) : token.slice(2, equalsIndex);
    const inlineValue =
      equalsIndex === -1 ? undefined : token.slice(equalsIndex + 1);

    if (BOOLEAN_OPTIONS.has(key)) {
      if (inlineValue !== undefined) {
        throw new Error(`${key} no acepta valor.`);
      }
      args[key] = true;
      continue;
    }

    if (!VALUE_OPTIONS.has(key)) {
      throw new Error(`Opcion desconocida: --${key}`);
    }

    const value = inlineValue ?? argv[index + 1];
    if (!value || (inlineValue === undefined && value.startsWith('--'))) {
      throw new Error(`Falta valor para --${key}`);
    }
    if (inlineValue === undefined) index += 1;

    if (REPEATABLE_OPTIONS.has(key)) {
      args[key].push(value);
      continue;
    }

    if (args[key] !== undefined) {
      throw new Error(`Opcion duplicada: --${key}`);
    }
    args[key] = value;
  }

  return args;
};

const normalizeBucket = (bucket) => {
  const value = String(bucket ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (!value) throw new Error('Debe indicar --bucket.');
  if (!value.startsWith('gs://')) {
    throw new Error('--bucket debe iniciar con gs://.');
  }
  const bucketName = value.slice('gs://'.length);
  if (!bucketName || bucketName.includes('/')) {
    throw new Error(
      '--bucket debe ser solo el bucket, por ejemplo gs://bucket.',
    );
  }
  return value;
};

const normalizeStoragePath = (value, label) => {
  const normalized = String(value ?? '')
    .trim()
    .replace(/^\/+/, '');
  if (!normalized) throw new Error(`${label} no puede estar vacio.`);
  if (normalized.startsWith('gs://')) {
    throw new Error(
      `${label} debe ser una ruta dentro del bucket, no un gs:// URI.`,
    );
  }
  if (normalized.includes('\\')) {
    throw new Error(`${label} debe usar / como separador.`);
  }
  return normalized;
};

const normalizeSha256 = (value, label) => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!SHA256_PATTERN.test(normalized)) {
    throw new Error(
      `${label} debe ser un SHA-256 valido de 64 caracteres hex.`,
    );
  }
  return normalized;
};

const normalizeGeneration = (value, label) => {
  const normalized = String(value ?? '').trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} debe ser una generacion GCS numerica.`);
  }
  return normalized;
};

const buildGsUri = ({ bucket, objectPath }) =>
  `${bucket}/${normalizeStoragePath(objectPath, 'objectPath')}`;

const stripBom = (value) => value.replace(/^\uFEFF/, '');

const parseJsonObject = (raw, label) => {
  let parsed;
  try {
    parsed = JSON.parse(stripBom(String(raw ?? '')));
  } catch (error) {
    throw new Error(`${label} no contiene JSON valido: ${error.message}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} debe ser un objeto JSON.`);
  }
  return parsed;
};

const runGcloudCapture = async (args, label) => {
  const gcloud = buildGcloudSpawn(args);
  const child = spawn(gcloud.command, gcloud.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdout = [];
  const stderr = [];

  child.stdout.on('data', (chunk) => stdout.push(chunk));
  child.stderr.on('data', (chunk) => stderr.push(chunk));

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });

  if (exitCode !== 0) {
    throw new Error(
      `${label} fallo con exit=${exitCode}: ${Buffer.concat(stderr).toString('utf8')}`,
    );
  }

  return Buffer.concat(stdout).toString('utf8');
};

const describeGcsObject = async (uri) => {
  const metadataText = await runGcloudCapture(
    ['storage', 'objects', 'describe', uri, '--format=json'],
    `gcloud storage objects describe ${uri}`,
  );
  const metadata = parseJsonObject(metadataText, `${uri} metadata`);
  return {
    ...metadata,
    generation: normalizeGeneration(metadata.generation, `${uri} generation`),
  };
};

const readCurrentPointer = async (currentUri) => {
  const before = await describeGcsObject(currentUri);
  const rawCurrent = await runGcloudCapture(
    ['storage', 'cat', currentUri],
    `gcloud storage cat ${currentUri}`,
  );
  const after = await describeGcsObject(currentUri);

  if (before.generation !== after.generation) {
    throw new Error(
      `current.json cambio durante la lectura (${before.generation} -> ${after.generation}). Vuelve a intentar.`,
    );
  }

  return {
    current: parseJsonObject(rawCurrent, currentUri),
    generation: after.generation,
  };
};

const normalizeRejectedSha256List = (current) => {
  const rawValues = [
    ...(Array.isArray(current.rejectedSha256List)
      ? current.rejectedSha256List
      : []),
    ...(Array.isArray(current.rejectedSha256)
      ? current.rejectedSha256
      : [current.rejectedSha256]),
  ].filter(Boolean);

  return [
    ...new Set(
      rawValues.map((value) =>
        normalizeSha256(value, 'rejectedSha256List existente'),
      ),
    ),
  ];
};

const assertValidIsoDate = (value, label) => {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} debe ser una fecha ISO valida.`);
  }
};

const parseRollbackHoldHours = (value) => {
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error('--rollback-hold-hours debe ser un numero mayor que 0.');
  }
  return hours;
};

const resolveRollbackHoldUntil = ({ args, current, now }) => {
  const holdOptions = [
    Boolean(args['clear-rollback-hold']),
    Boolean(args['rollback-hold-until']),
    Boolean(args['rollback-hold-hours']),
  ].filter(Boolean);
  if (holdOptions.length > 1) {
    throw new Error(
      'Use solo una opcion de hold: --clear-rollback-hold, --rollback-hold-until o --rollback-hold-hours.',
    );
  }

  if (args['clear-rollback-hold']) return null;

  if (args['rollback-hold-until']) {
    assertValidIsoDate(args['rollback-hold-until'], '--rollback-hold-until');
    return new Date(args['rollback-hold-until']).toISOString();
  }

  if (args['rollback-hold-hours']) {
    const hours = parseRollbackHoldHours(args['rollback-hold-hours']);
    return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
  }

  if (
    typeof current.rollbackHoldUntil === 'string' &&
    current.rollbackHoldUntil
  ) {
    assertValidIsoDate(
      current.rollbackHoldUntil,
      'rollbackHoldUntil existente',
    );
    return current.rollbackHoldUntil;
  }

  return null;
};

const assertManifestPathMatchesHash = ({ hash, manifestPath }) => {
  if (!manifestPath.endsWith(`/${hash}.json`)) {
    throw new Error(
      '--manifest debe terminar en /<hash>.json para el --hash indicado.',
    );
  }
};

const assertCliInputs = (args) => {
  const hash = normalizeSha256(args.hash, '--hash');
  if (args['reject-hash'].length === 0) {
    throw new Error('Debe indicar al menos un --reject-hash.');
  }
  args['reject-hash'].forEach((value) =>
    normalizeSha256(value, '--reject-hash'),
  );

  if (args.manifest) {
    const manifestPath = normalizeStoragePath(args.manifest, '--manifest');
    assertManifestPathMatchesHash({ hash, manifestPath });
  }

  resolveRollbackHoldUntil({
    args,
    current: {},
    now: new Date(),
  });
};

const buildRollbackPointer = ({ args, current, now }) => {
  const hash = normalizeSha256(args.hash, '--hash');
  const rejectHashes = args['reject-hash'].map((value) =>
    normalizeSha256(value, '--reject-hash'),
  );
  if (rejectHashes.length === 0) {
    throw new Error('Debe indicar al menos un --reject-hash.');
  }

  const currentRejected = normalizeRejectedSha256List(current);
  const rejectedSha256List = [
    ...new Set([...currentRejected, ...rejectHashes]),
  ];
  const manifestPath = normalizeStoragePath(
    args.manifest ?? `rnc/manifests/${hash}.json`,
    '--manifest',
  );
  assertManifestPathMatchesHash({ hash, manifestPath });
  const rollbackHoldUntil = resolveRollbackHoldUntil({ args, current, now });

  return {
    schemaVersion: 1,
    manifestPath,
    sha256: hash,
    snapshotGzipSha256: hash,
    activatedAt: now.toISOString(),
    activationReason: 'rollback',
    ...(rollbackHoldUntil ? { rollbackHoldUntil } : {}),
    rejectedSha256List,
  };
};

const publishPointer = async ({ body, currentUri, generation }) => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'ventamas-rnc-rollback-'));
  try {
    const tempPath = path.join(tempDir, 'current.rollback.json');
    await writeFile(tempPath, body, 'utf8');
    await runGcloudCapture(
      [
        'storage',
        'cp',
        tempPath,
        currentUri,
        `--if-generation-match=${generation}`,
      ],
      `gcloud storage cp ${tempPath} ${currentUri}`,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

const main = async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(usage);
    return;
  }

  const bucket = normalizeBucket(args.bucket);
  const currentPath = normalizeStoragePath(
    args['current-path'] ?? 'rnc/current.json',
    '--current-path',
  );
  const currentUri = buildGsUri({ bucket, objectPath: currentPath });
  const expectedGeneration = args['expected-generation']
    ? normalizeGeneration(args['expected-generation'], '--expected-generation')
    : null;
  assertCliInputs(args);

  const { current, generation } = await readCurrentPointer(currentUri);
  if (expectedGeneration && generation !== expectedGeneration) {
    throw new Error(
      `current.json esta en generacion ${generation}, no en --expected-generation ${expectedGeneration}.`,
    );
  }

  const pointer = buildRollbackPointer({
    args,
    current,
    now: new Date(),
  });
  const body = `${JSON.stringify(pointer, null, 2)}\n`;

  if (args.output) {
    await writeFile(args.output, body, 'utf8');
  }

  if (args.publish) {
    await publishPointer({ body, currentUri, generation });
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: true,
          currentPath,
          currentUri,
          generationMatched: generation,
          published: true,
          rejectedSha256List: pointer.rejectedSha256List,
          rollbackHoldUntil: pointer.rollbackHoldUntil ?? null,
          sha256: pointer.sha256,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  if (!args.output) {
    process.stdout.write(body);
    return;
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        currentPath,
        currentUri,
        generationRead: generation,
        output: args.output,
        rejectedSha256List: pointer.rejectedSha256List,
        rollbackHoldUntil: pointer.rollbackHoldUntil ?? null,
        sha256: pointer.sha256,
      },
      null,
      2,
    )}\n`,
  );
};

main().catch((error) => {
  process.stderr.write(`${error?.message ?? error}\n${usage}`);
  process.exit(1);
});
