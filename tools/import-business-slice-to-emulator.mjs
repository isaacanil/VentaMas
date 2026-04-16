#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  deserializeFromExport,
  exitWithUsage,
  getOrInitEmulatorDb,
  parseCliArgs,
  parseIntegerArg,
  readJsonFile,
  sortDocsForImport,
} from './business-slice/utils.mjs';

const USAGE = `
Uso:
  $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"
  node .\\tools\\import-business-slice-to-emulator.mjs --in=<archivo-json> [opciones]

Opciones:
  --in=<archivo-json>             Requerido. Archivo generado por export-business-slice.
  --project-id=<firebase-project> Opcional. Si falta, usa manifest, env o .firebaserc.
  --batch-size=<n>                Default: 200
  --help                          Muestra esta ayuda.
`;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const commitChunk = async (db, chunk) => {
  const batch = db.batch();
  for (const entry of chunk) {
    const ref = db.doc(entry.path);
    batch.set(ref, deserializeFromExport(entry.data, db), { merge: false });
  }
  await batch.commit();
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const readDefaultFirebaseProjectId = async () => {
  const firebaseRcPath = path.resolve(process.cwd(), '.firebaserc');
  try {
    const firebaseRc = await readJsonFile(firebaseRcPath);
    if (
      isRecord(firebaseRc) &&
      isRecord(firebaseRc.projects) &&
      typeof firebaseRc.projects.default === 'string' &&
      firebaseRc.projects.default.trim()
    ) {
      return firebaseRc.projects.default.trim();
    }
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }
  return undefined;
};

const ensureInputExists = async (inputPath) => {
  try {
    await fs.access(inputPath);
  } catch {
    exitWithUsage(`No existe archivo: ${inputPath}`, USAGE);
  }
};

const main = async () => {
  const { flags } = parseCliArgs(process.argv);
  if (flags.help) {
    console.log(USAGE.trim());
    return;
  }

  const inputPath = flags.in ? path.resolve(process.cwd(), String(flags.in)) : null;
  if (!inputPath) {
    exitWithUsage('Falta --in.', USAGE);
  }
  await ensureInputExists(inputPath);

  const batchSize = parseIntegerArg(flags['batch-size'], 200);
  if (batchSize > 400) {
    exitWithUsage('Usa --batch-size <= 400 para dejar margen seguro.', USAGE);
  }

  const manifest = await readJsonFile(inputPath);
  if (!isRecord(manifest) || !Array.isArray(manifest.docs)) {
    throw new Error('Archivo de entrada invalido. Falta manifest.docs[].');
  }

  const firebaseRcProjectId = await readDefaultFirebaseProjectId();
  const projectId =
    (typeof flags['project-id'] === 'string' && flags['project-id'].trim()) ||
    (typeof manifest.projectId === 'string' && manifest.projectId.trim()) ||
    (typeof process.env.GCLOUD_PROJECT === 'string' && process.env.GCLOUD_PROJECT.trim()) ||
    (typeof process.env.GOOGLE_CLOUD_PROJECT === 'string' &&
      process.env.GOOGLE_CLOUD_PROJECT.trim()) ||
    firebaseRcProjectId ||
    undefined;

  if (!projectId) {
    throw new Error(
      'No pude resolver projectId. Usa --project-id, define GCLOUD_PROJECT, o agrega projects.default en .firebaserc.',
    );
  }

  process.env.GCLOUD_PROJECT = projectId;
  process.env.GOOGLE_CLOUD_PROJECT = projectId;

  const db = getOrInitEmulatorDb({ projectId });
  const sortedDocs = sortDocsForImport(
    manifest.docs.filter((entry) => isRecord(entry) && typeof entry.path === 'string'),
  );
  const chunks = chunkArray(sortedDocs, batchSize);

  for (const [index, chunk] of chunks.entries()) {
    await commitChunk(db, chunk);
    console.log(`Batch ${index + 1}/${chunks.length}: ${chunk.length} docs`);
  }

  console.log('');
  console.log(`Import completado en emulador ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`Docs importados: ${sortedDocs.length}`);
  if (manifest.businessId) {
    console.log(`Business: ${manifest.businessId}`);
  }
  if (manifest.localAuth?.username && manifest.localAuth?.password) {
    console.log(`Login local: ${manifest.localAuth.username} / ${manifest.localAuth.password}`);
  }
};

main().catch((error) => {
  console.error('[import-business-slice-to-emulator] failed');
  console.error(error);
  process.exitCode = 1;
});
