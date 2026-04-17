/*
  Script: seedBankInstitutionCatalog.mjs

  Purpose:
    Seed bank institution catalog into Firestore for RD and future countries.

  Writes:
    bankInstitutionCatalog/{countryCode}_{bankCode}

  Usage (PowerShell 7.5.4):
    node functions/scripts/seedBankInstitutionCatalog.mjs --projectId ventamaxpos --dry-run
    node functions/scripts/seedBankInstitutionCatalog.mjs --projectId ventamaxpos --write
    node functions/scripts/seedBankInstitutionCatalog.mjs --projectId ventamaxpos --keyPath C:\path\key.json --write
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';
import doBankInstitutions from './data/doBankInstitutions.json' with { type: 'json' };

const getFlagValue = (args, name) => {
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) {
    return withEq.slice(name.length + 1) || null;
  }
  const idx = args.findIndex((item) => item === name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeName = (value) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return admin.credential.cert(JSON.parse(raw));
};

const initializeAdminApp = ({ projectId, keyPath }) => {
  if (admin.apps.length) return admin.app();

  const options = {
    projectId,
    credential: keyPath
      ? loadServiceAccountCredential(keyPath)
      : admin.credential.applicationDefault(),
  };

  return admin.initializeApp(options);
};

const buildCatalogDocument = ({ institution, nowIso }) => ({
  code: institution.code,
  countryCode: institution.countryCode,
  name: institution.name,
  normalizedName: normalizeName(institution.name),
  status: 'active',
  isSystemBuiltin: true,
  source: 'seedBankInstitutionCatalog',
  createdAt: nowIso,
  updatedAt: nowIso,
});

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const projectId = toCleanString(getFlagValue(args, '--projectId')) || 'ventamaxpos';
const keyPath =
  toCleanString(getFlagValue(args, '--keyPath')) ||
  toCleanString(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: node functions/scripts/seedBankInstitutionCatalog.mjs --projectId <firebase-project-id> [--keyPath <path>] [--dry-run|--write]',
  );
  process.exit(0);
}

const app = initializeAdminApp({ projectId, keyPath });
const db = admin.firestore();
const resolvedProjectId =
  toCleanString(app.options.projectId) ||
  toCleanString(process.env.GOOGLE_CLOUD_PROJECT) ||
  toCleanString(process.env.GCLOUD_PROJECT) ||
  projectId;

const run = async () => {
  const nowIso = new Date().toISOString();
  const documents = doBankInstitutions.map((institution) => ({
    id: `${institution.countryCode}_${institution.code}`,
    ...buildCatalogDocument({ institution, nowIso }),
  }));

  if (!shouldWrite) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          projectId: resolvedProjectId,
          documents,
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const document of documents) {
    // Idempotente para reruns y expansión futura.
    // eslint-disable-next-line no-await-in-loop
    await db.doc(`bankInstitutionCatalog/${document.id}`).set(document, {
      merge: true,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'write',
        projectId: resolvedProjectId,
        seededDocuments: documents.map((document) => document.id),
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[seedBankInstitutionCatalog] failed:', error);
  process.exitCode = 1;
});
