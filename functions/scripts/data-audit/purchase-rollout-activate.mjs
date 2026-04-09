/**
 * Activate purchase/CxP rollout for one or more businesses.
 *
 * Usage:
 *   cd functions
 *   node .\scripts\data-audit\purchase-rollout-activate.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessIds=BUSINESS_ID
 *
 * Optional:
 *   --write=1
 *   --functionalCurrency=DOP
 *   --documentCurrencies=DOP,USD
 *   --bankAccountsEnabled=0
 *   --updatedBy=local-script
 *
 * Notes:
 * - Readonly by default.
 * - Writes only the minimum settings needed to opt a business into rollout.
 * - Existing currencies are preserved unless the settings doc is missing them.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const DEFAULT_FUNCTIONAL_CURRENCY = 'DOP';

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .map((raw) => raw.split('='))
      .map(([key, value]) => [key.replace(/^--/, ''), value ?? '']),
  );

  const readOptionalBool = (key) => {
    if (!args[key]) return null;
    return args[key] === '1' || args[key] === 'true';
  };

  const readBool = (key) => readOptionalBool(key) === true;

  const readBusinessIds = () =>
    (args.businessIds || args.businessId || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

  const readDocumentCurrencies = () =>
    (args.documentCurrencies || '')
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);

  return {
    keyPath: args.keyPath || '',
    projectId: args.projectId || '',
    businessIds: readBusinessIds(),
    functionalCurrency:
      (args.functionalCurrency || DEFAULT_FUNCTIONAL_CURRENCY).trim().toUpperCase(),
    documentCurrencies: readDocumentCurrencies(),
    bankAccountsEnabled: readOptionalBool('bankAccountsEnabled'),
    updatedBy: (args.updatedBy || 'local-script').trim() || 'local-script',
    write: readBool('write'),
  };
};

const ensureDir = (targetPath) => fs.mkdirSync(targetPath, { recursive: true });

const writeJson = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
};

const resolveRepoRoot = () => {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDir, '..', '..', '..');
};

const isoStamp = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    '-' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
};

const normalizeDocumentCurrencies = ({
  configuredCurrencies,
  functionalCurrency,
}) => {
  const nextCurrencies = configuredCurrencies.length
    ? configuredCurrencies
    : [functionalCurrency];
  return Array.from(new Set(nextCurrencies));
};

const buildActivationPayload = ({
  existingSettings,
  functionalCurrency,
  documentCurrencies,
  bankAccountsEnabled,
  updatedBy,
  timestamp,
}) => {
  const payload = {
    rolloutEnabled: true,
    updatedAt: timestamp,
    updatedBy,
  };
  if (typeof bankAccountsEnabled === 'boolean') {
    payload.bankAccountsEnabled = bankAccountsEnabled;
  } else if (typeof existingSettings?.bankAccountsEnabled !== 'boolean') {
    payload.bankAccountsEnabled = false;
  }

  const currentFunctionalCurrency =
    typeof existingSettings?.functionalCurrency === 'string'
      ? existingSettings.functionalCurrency.trim().toUpperCase()
      : '';
  if (!currentFunctionalCurrency) {
    payload.functionalCurrency = functionalCurrency;
  }

  const currentDocumentCurrencies = Array.isArray(existingSettings?.documentCurrencies)
    ? existingSettings.documentCurrencies
        .map((value) =>
          typeof value === 'string' ? value.trim().toUpperCase() : '',
        )
        .filter(Boolean)
    : [];
  if (!currentDocumentCurrencies.length) {
    payload.documentCurrencies = documentCurrencies;
  }

  if (!existingSettings) {
    payload.createdAt = timestamp;
    payload.createdBy = updatedBy;
  }

  return payload;
};

const resolveActivationMode = ({ existingSettings, payload }) => {
  const resolvedBankAccountsEnabled =
    typeof payload.bankAccountsEnabled === 'boolean'
      ? payload.bankAccountsEnabled
      : existingSettings?.bankAccountsEnabled !== false;
  return resolvedBankAccountsEnabled ? 'bank-enabled' : 'cash-only';
};

const run = async () => {
  const args = parseArgs();

  if (!args.keyPath) {
    throw new Error('Debes enviar --keyPath=...');
  }
  if (!args.businessIds.length) {
    throw new Error('Debes enviar --businessIds=ID1,ID2 o --businessId=ID');
  }

  const serviceAccount = JSON.parse(fs.readFileSync(args.keyPath, 'utf8'));
  const projectId = args.projectId || serviceAccount.project_id;

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });

  try {
    const repoRoot = resolveRepoRoot();
    const timestamp = isoStamp();
    const outputDir = path.resolve(
      repoRoot,
      '.tmp',
      'data-audit',
      'purchase-rollout-activate',
      timestamp,
      'analysis',
    );

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const documentCurrencies = normalizeDocumentCurrencies({
      configuredCurrencies: args.documentCurrencies,
      functionalCurrency: args.functionalCurrency,
    });

    const results = [];

    for (const businessId of args.businessIds) {
      const settingsRef = db
        .collection('businesses')
        .doc(businessId)
        .collection('settings')
        .doc('accounting');
      const settingsSnap = await settingsRef.get();
      const existingSettings = settingsSnap.exists ? settingsSnap.data() : null;

      const payload = buildActivationPayload({
        existingSettings,
        functionalCurrency: args.functionalCurrency,
        documentCurrencies,
        bankAccountsEnabled: args.bankAccountsEnabled,
        updatedBy: args.updatedBy,
        timestamp: now,
      });

      if (args.write) {
        await settingsRef.set(payload, { merge: true });
      }

      results.push({
        businessId,
        mode: resolveActivationMode({ existingSettings, payload }),
        writeApplied: args.write,
        existingSettings,
        activationPayload: payload,
      });
    }

    ensureDir(outputDir);
    writeJson(path.join(outputDir, 'purchase-rollout-activate.json'), {
      generatedAt: new Date().toISOString(),
      writeApplied: args.write,
      functionalCurrency: args.functionalCurrency,
      documentCurrencies,
      requestedBankAccountsEnabled: args.bankAccountsEnabled,
      businessIds: args.businessIds,
      results,
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          writeApplied: args.write,
          businessCount: args.businessIds.length,
          outputDir,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.delete();
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
