/**
 * Backfill de bankAccounts a contrato estricto:
 * - institutionName: snapshot/display
 * - bankCode: top-level
 * - countryCode: top-level
 * - isCustomBank: top-level
 * - limpia metadata.institutionCatalog legacy
 *
 * Uso:
 *   node scripts/backfillBankAccountInstitutions.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --projectId=ventamaxpos `
 *     --write
 *
 * Opcional:
 *   --businessId=<id>
 */

import fs from 'node:fs';
import admin from 'firebase-admin';
import bankCatalogSource from './data/doBankInstitutions.json' with { type: 'json' };

const DEFAULT_COUNTRY_CODE = 'DO';
const CUSTOM_BANK_CODE = 'CUSTOM';
const BANK_CATALOG = bankCatalogSource;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const normalizedArg = arg.replace(/^--/, '');
    const [key, ...rest] = normalizedArg.split('=');
    return [key, rest.length ? rest.join('=') : 'true'];
  }),
);

const normalizeString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeName = (value) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const resolveByCode = (countryCode, bankCode) => {
  if (!bankCode || bankCode === CUSTOM_BANK_CODE) return null;
  return (
    BANK_CATALOG.find(
      (institution) =>
        institution.countryCode === countryCode && institution.code === bankCode,
    ) ?? null
  );
};

const resolveByName = (countryCode, institutionName) => {
  const normalizedInstitutionName = normalizeName(institutionName);
  if (!normalizedInstitutionName) return null;
  return (
    BANK_CATALOG.find(
      (institution) =>
        institution.countryCode === countryCode &&
        normalizeName(institution.name) === normalizedInstitutionName,
    ) ?? null
  );
};

const initializeApp = () => {
  const projectId = normalizeString(args.projectId) ?? 'ventamaxpos';
  const keyPath = normalizeString(args.keyPath);

  if (keyPath) {
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Key file no existe: ${keyPath}`);
    }

    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))),
      projectId,
    });
    return;
  }

  admin.initializeApp({ projectId });
};

const buildNormalizedSnapshot = (docData) => {
  const metadata =
    docData.metadata && typeof docData.metadata === 'object' && !Array.isArray(docData.metadata)
      ? { ...docData.metadata }
      : {};
  const legacyInstitutionCatalog =
    metadata.institutionCatalog &&
    typeof metadata.institutionCatalog === 'object' &&
    !Array.isArray(metadata.institutionCatalog)
      ? metadata.institutionCatalog
      : {};

  delete metadata.institutionCatalog;

  const countryCode =
    normalizeString(docData.countryCode ?? legacyInstitutionCatalog.countryCode)?.toUpperCase() ??
    DEFAULT_COUNTRY_CODE;
  const rawBankCode = normalizeString(docData.bankCode ?? legacyInstitutionCatalog.bankCode);
  const bankCode =
    rawBankCode?.toUpperCase() === CUSTOM_BANK_CODE ? CUSTOM_BANK_CODE : rawBankCode;
  const rawInstitutionName = normalizeString(docData.institutionName ?? docData.bankName);
  const isCustomBank =
    typeof docData.isCustomBank === 'boolean'
      ? docData.isCustomBank
      : legacyInstitutionCatalog.isCustom === true ||
        bankCode === CUSTOM_BANK_CODE;

  if (isCustomBank) {
    const customName =
      normalizeString(legacyInstitutionCatalog.customName) ?? rawInstitutionName;

    if (!customName) {
      return {
        status: 'skipped',
        reason: 'custom-bank-without-name',
      };
    }

    return {
      status: 'normalized',
      payload: {
        institutionName: customName,
        bankCode: CUSTOM_BANK_CODE,
        countryCode,
        isCustomBank: true,
        metadata,
      },
    };
  }

  const resolvedInstitution =
    resolveByCode(countryCode, bankCode) ?? resolveByName(countryCode, rawInstitutionName);

  if (!resolvedInstitution) {
    if (!rawInstitutionName) {
      return {
        status: 'skipped',
        reason: 'missing-bank-identity',
      };
    }

    return {
      status: 'normalized',
      payload: {
        institutionName: rawInstitutionName,
        bankCode: CUSTOM_BANK_CODE,
        countryCode,
        isCustomBank: true,
        metadata,
      },
    };
  }

  return {
    status: 'normalized',
    payload: {
      institutionName: resolvedInstitution.name,
      bankCode: resolvedInstitution.code,
      countryCode: resolvedInstitution.countryCode,
      isCustomBank: false,
      metadata,
    },
  };
};

const main = async () => {
  initializeApp();
  const db = admin.firestore();
  const shouldWrite = args.write === 'true';
  const businessIdFilter = normalizeString(args.businessId);
  const businessesSnapshot = businessIdFilter
    ? await db.collection('businesses').where(admin.firestore.FieldPath.documentId(), '==', businessIdFilter).get()
    : await db.collection('businesses').get();

  const summary = {
    scanned: 0,
    normalized: 0,
    written: 0,
    skipped: 0,
  };

  for (const businessDoc of businessesSnapshot.docs) {
    const bankAccountsSnapshot = await businessDoc.ref.collection('bankAccounts').get();

    for (const bankAccountDoc of bankAccountsSnapshot.docs) {
      summary.scanned += 1;
      const result = buildNormalizedSnapshot(bankAccountDoc.data());

      if (result.status !== 'normalized') {
        summary.skipped += 1;
        console.log(
          `[skip] business=${businessDoc.id} bankAccount=${bankAccountDoc.id} reason=${result.reason}`,
        );
        continue;
      }

      summary.normalized += 1;
      console.log(
        `[plan] business=${businessDoc.id} bankAccount=${bankAccountDoc.id} bankCode=${result.payload.bankCode} custom=${result.payload.isCustomBank}`,
      );

      if (!shouldWrite) {
        continue;
      }

      await bankAccountDoc.ref.set(result.payload, { merge: true });
      summary.written += 1;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
