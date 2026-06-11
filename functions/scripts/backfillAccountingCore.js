/*
  Script: backfillAccountingCore.js

  Purpose:
    Backfill mínimo para el go-live contable sin versionado:
    - asegura cuentas contables base faltantes;
    - migra perfiles default sembrados para separar ITBIS/retenciones;
    - materializa vendorBills canónicas desde purchases existentes.

  Usage:
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --business <businessId> --dry-run
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --business <businessId> --write
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --all-businesses --dry-run

    Por seguridad, solo se actualizan perfiles con metadata.seededBy == "default_posting_profiles".
    Para auditar perfiles antiguos que solo tienen metadata.seedKey:
    node functions/scripts/backfillAccountingCore.js --service-account C:/path/key.json --business <businessId> --dry-run --include-seed-key-only
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import admin from 'firebase-admin';

import {
  buildPurchasePaymentState,
  sanitizeForResponse,
} from '../src/app/modules/purchase/functions/payablePayments.shared.js';
import {
  buildExpenseRecordedAccountingEvent,
} from '../src/app/modules/expenses/functions/expenseAccountingEvent.shared.js';
import {
  buildPurchaseCommittedAccountingEvent,
} from '../src/app/modules/purchase/functions/purchaseAccountingEvent.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
} from '../src/app/modules/purchase/functions/vendorBill.shared.js';

const REQUIRED_CHART_OF_ACCOUNTS = [
  {
    code: '1135',
    name: 'Activos fijos',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'fixed_assets',
    parentSystemKey: 'assets_root',
  },
  {
    code: '1138',
    name: 'Gastos pagados por anticipado',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'prepaid_expenses',
    parentSystemKey: 'assets_root',
  },
  {
    code: '2210',
    name: 'Retenciones ITBIS por pagar',
    type: 'liability',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'withholding_itbis_payable',
    parentSystemKey: 'liabilities_root',
  },
  {
    code: '2220',
    name: 'Retenciones ISR por pagar',
    type: 'liability',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'withholding_isr_payable',
    parentSystemKey: 'liabilities_root',
  },
];

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const CHART_OF_ACCOUNTS_SOURCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'utils',
  'accounting',
  'chartOfAccounts.ts',
);
const POSTING_PROFILES_SOURCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'utils',
  'accounting',
  'postingProfiles.ts',
);

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);

const getFlagValue = (flag) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
};

const extractArrayLiteralAfterMarker = (source, marker) => {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`No se encontro el marcador ${marker}.`);
  }

  const equalsIndex = source.indexOf('=', markerIndex);
  const startIndex = source.indexOf('[', equalsIndex);
  if (equalsIndex === -1 || startIndex === -1) {
    throw new Error(`No se pudo ubicar el arreglo para ${marker}.`);
  }

  let depth = 0;
  let quote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error(`No se pudo cerrar el arreglo para ${marker}.`);
};

const evaluateArrayLiteral = (literal, context = {}) => {
  const names = Object.keys(context);
  const values = Object.values(context);
  return Function(...names, `"use strict"; return (${literal});`)(...values);
};

const buildImmediatePurchaseProfileSeed = ({
  creditAccountSystemKey,
  debitAccountSystemKey,
  description,
  documentNature,
  name,
  priority,
  seedKey,
  settlementKind,
}) => ({
  seedKey,
  name,
  description,
  eventType: 'purchase.committed',
  moduleKey: 'purchases',
  priority,
  conditions: {
    documentNature,
    settlementKind,
    settlementTiming: 'immediate',
  },
  linesTemplate: [
    {
      side: 'debit',
      accountSystemKey: debitAccountSystemKey,
      amountSource: 'purchase_subtotal',
    },
    {
      side: 'debit',
      accountSystemKey: 'tax_receivable',
      amountSource: 'purchase_tax',
    },
    {
      side: 'credit',
      accountSystemKey: creditAccountSystemKey,
      amountSource: 'purchase_net_payable',
    },
    {
      side: 'credit',
      accountSystemKey: 'withholding_itbis_payable',
      amountSource: 'purchase_withholding_itbis',
    },
    {
      side: 'credit',
      accountSystemKey: 'withholding_isr_payable',
      amountSource: 'purchase_withholding_isr',
    },
  ],
});

export const loadDefaultChartOfAccountTemplatesFromSource = (
  source = fs.readFileSync(CHART_OF_ACCOUNTS_SOURCE_PATH, 'utf8'),
) =>
  evaluateArrayLiteral(
    extractArrayLiteralAfterMarker(
      source,
      'export const DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE',
    ),
  );

export const loadDefaultPostingProfileSeedsFromSource = (
  source = fs.readFileSync(POSTING_PROFILES_SOURCE_PATH, 'utf8'),
) => {
  const immediatePurchaseProfileSeeds = evaluateArrayLiteral(
    extractArrayLiteralAfterMarker(
      source,
      'const IMMEDIATE_PURCHASE_PROFILE_SEEDS',
    ),
    { buildImmediatePurchaseProfileSeed },
  );
  const allSeedLiteral = extractArrayLiteralAfterMarker(
    source,
    'const DEFAULT_ACCOUNTING_POSTING_PROFILE_SEEDS',
  ).replaceAll(
    '...IMMEDIATE_PURCHASE_PROFILE_SEEDS',
    '...immediatePurchaseProfileSeeds',
  );

  return evaluateArrayLiteral(allSeedLiteral, { immediatePurchaseProfileSeeds });
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwoDecimals = (value) =>
  Math.round((safeNumber(value) || 0) * 100) / 100;

const buildAccountMaps = (accounts) => ({
  bySystemKey: new Map(
    accounts
      .map((account) => [toCleanString(account.systemKey), account])
      .filter(([systemKey]) => Boolean(systemKey)),
  ),
  byCode: new Map(
    accounts
      .map((account) => [toCleanString(account.code), account])
      .filter(([code]) => Boolean(code)),
  ),
});

export const planMissingChartAccounts = ({
  accounts,
  businessId,
  templates = loadDefaultChartOfAccountTemplatesFromSource(),
  createRef,
}) => {
  const { byCode, bySystemKey } = buildAccountMaps(accounts);
  const writes = [];
  const skippedExistingCodeMissingSystemKey = [];

  for (const template of templates) {
    const systemKey = toCleanString(template.systemKey);
    if (!systemKey || bySystemKey.has(systemKey)) {
      continue;
    }

    const code = toCleanString(template.code);
    const existingByCode = code ? byCode.get(code) : null;
    if (existingByCode) {
      skippedExistingCodeMissingSystemKey.push({
        code,
        existingAccountId: existingByCode.id ?? null,
        systemKey,
      });
      continue;
    }

    const ref =
      typeof createRef === 'function'
        ? createRef(template)
        : {
            id: `dryrun_${systemKey}`,
          };
    const parent =
      bySystemKey.get(toCleanString(template.parentSystemKey)) ??
      byCode.get(toCleanString(template.parentCode)) ??
      null;
    const payload = {
      id: ref.id,
      businessId,
      code,
      name: template.name,
      type: template.type,
      postingAllowed: template.postingAllowed,
      status: 'active',
      normalSide: template.normalSide,
      currencyMode: template.currencyMode,
      systemKey,
      parentId: parent?.id ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'script:backfillAccountingCore',
      updatedBy: 'script:backfillAccountingCore',
      metadata: {
        backfilledBy: 'backfillAccountingCore',
        seededBy: 'default_chart_template',
      },
    };

    writes.push({ ref, payload, systemKey });
    const plannedAccount = {
      ...payload,
      id: ref.id,
    };
    bySystemKey.set(systemKey, plannedAccount);
    if (code) {
      byCode.set(code, plannedAccount);
    }
  }

  return {
    writes,
    skippedExistingCodeMissingSystemKey,
  };
};

const buildDefaultPostingProfileLines = ({ accountsBySystemKey, seed }) => {
  const seedKey = toCleanString(seed.seedKey);
  return (Array.isArray(seed.linesTemplate) ? seed.linesTemplate : []).map(
    (line, index) => {
      const accountSystemKey = toCleanString(line.accountSystemKey);
      const account = accountsBySystemKey.get(accountSystemKey) ?? null;
      if (!seedKey || !accountSystemKey || !account) {
        return null;
      }

      return {
        id: `${seedKey}__${toCleanString(line.amountSource) ?? 'amount'}__${index + 1}`,
        side: line.side,
        accountId: account.id,
        accountCode: toCleanString(account.code),
        accountName: toCleanString(account.name),
        accountSystemKey,
        amountSource: line.amountSource,
        description: line.description ?? null,
        omitIfZero: line.omitIfZero !== false,
        metadata: asRecord(line.metadata),
      };
    },
  );
};

const buildDefaultPostingProfilePayload = ({
  accountsBySystemKey,
  businessId,
  refId,
  seed,
}) => {
  const seedKey = toCleanString(seed.seedKey);
  const linesTemplate = buildDefaultPostingProfileLines({
    accountsBySystemKey,
    seed,
  });
  if (!seedKey || linesTemplate.some((line) => !line)) {
    return null;
  }

  return {
    id: refId,
    businessId,
    name: seed.name,
    description: seed.description ?? null,
    eventType: seed.eventType,
    moduleKey: seed.moduleKey,
    priority: safeNumber(seed.priority) ?? 100,
    status: 'active',
    conditions: seed.conditions ?? null,
    linesTemplate,
    metadata: {
      seedKey,
      seededBy: 'default_posting_profiles',
      backfilledBy: 'backfillAccountingCore',
    },
  };
};

const OBSOLETE_POSTING_PROFILE_SEED_KEYS = new Set([
  'purchase_committed',
  'purchase_committed_cash',
]);

const isManagedLegacyPostingProfile = (profile) => {
  const metadata = asRecord(profile.metadata);
  const seededBy = toCleanString(metadata.seededBy);
  return (
    seededBy === 'default_posting_profiles' ||
    Boolean(seededBy?.startsWith('codex'))
  );
};

const normalizeLineForComparison = (line) => ({
  accountId: toCleanString(line.accountId),
  accountSystemKey: toCleanString(line.accountSystemKey),
  amountSource: toCleanString(line.amountSource),
  side: toCleanString(line.side),
});

const linesMatchTemplate = (currentLines, nextLines) =>
  JSON.stringify(
    (Array.isArray(currentLines) ? currentLines : []).map(
      normalizeLineForComparison,
    ),
  ) === JSON.stringify(nextLines.map(normalizeLineForComparison));

const serializeRecordForComparison = (value) => {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeRecordForComparison(item)).join(',')}]`;
  }

  const record = asRecord(value);
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${serializeRecordForComparison(record[key])}`)
    .join(',')}}`;
};

const serializeConditionsForComparison = (conditions) =>
  serializeRecordForComparison(asRecord(conditions));

const profileMatchesDefaultSeed = (profile, payload) =>
  profile.name === payload.name &&
  (profile.description ?? null) === (payload.description ?? null) &&
  profile.eventType === payload.eventType &&
  profile.moduleKey === payload.moduleKey &&
  safeNumber(profile.priority) === payload.priority &&
  (profile.status ?? 'active') === payload.status &&
  serializeConditionsForComparison(profile.conditions) ===
    serializeConditionsForComparison(payload.conditions) &&
  linesMatchTemplate(profile.linesTemplate, payload.linesTemplate);

export const planDefaultPostingProfileChanges = ({
  accounts,
  businessId,
  createRef,
  includeSeedKeyOnly = false,
  profiles,
  seeds = loadDefaultPostingProfileSeedsFromSource(),
}) => {
  const { bySystemKey: accountsBySystemKey } = buildAccountMaps(accounts);
  const profilesBySeedKey = new Map();
  const creates = [];
  const updates = [];
  const deactivations = [];
  const alreadyCurrent = [];
  const skippedCustom = [];
  const skippedMissingAccounts = [];

  for (const profile of profiles) {
    const seedKey = toCleanString(asRecord(profile.metadata).seedKey);
    if (!seedKey || profilesBySeedKey.has(seedKey)) {
      continue;
    }
    profilesBySeedKey.set(seedKey, profile);

    if (
      OBSOLETE_POSTING_PROFILE_SEED_KEYS.has(seedKey) &&
      toCleanString(profile.status) !== 'inactive' &&
      isManagedLegacyPostingProfile(profile)
    ) {
      deactivations.push({
        ref: profile.ref,
        payload: {
          status: 'inactive',
          metadata: {
            ...asRecord(profile.metadata),
            deactivatedBy: 'backfillAccountingCore',
            deactivatedReason: 'replaced_by_default_posting_profiles',
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'script:backfillAccountingCore',
        },
        profileId: profile.id ?? null,
        seedKey,
        eventType: profile.eventType,
      });
    }
  }

  for (const seed of seeds) {
    const seedKey = toCleanString(seed.seedKey);
    if (!seedKey) {
      continue;
    }

    const existingProfile = profilesBySeedKey.get(seedKey) ?? null;
    const ref =
      existingProfile?.ref ??
      (typeof createRef === 'function'
        ? createRef(seed)
        : {
            id: seedKey,
          });
    const payload = buildDefaultPostingProfilePayload({
      accountsBySystemKey,
      businessId,
      refId: existingProfile?.id ?? ref.id ?? seedKey,
      seed,
    });

    if (!payload) {
      skippedMissingAccounts.push({
        seedKey,
        eventType: seed.eventType,
        missingSystemKeys: Array.from(
          new Set(
            (Array.isArray(seed.linesTemplate) ? seed.linesTemplate : [])
              .map((line) => toCleanString(line.accountSystemKey))
              .filter(
                (systemKey) =>
                  Boolean(systemKey) && !accountsBySystemKey.has(systemKey),
              ),
          ),
        ),
      });
      continue;
    }

    if (!existingProfile) {
      creates.push({
        ref,
        payload: {
          ...payload,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'script:backfillAccountingCore',
          updatedBy: 'script:backfillAccountingCore',
        },
        seedKey,
        eventType: seed.eventType,
      });
      continue;
    }

    const metadata = asRecord(existingProfile.metadata);
    if (
      metadata.seededBy !== 'default_posting_profiles' &&
      !includeSeedKeyOnly
    ) {
      skippedCustom.push({
        profileId: existingProfile.id ?? null,
        seedKey,
        eventType: seed.eventType,
      });
      continue;
    }

    if (profileMatchesDefaultSeed(existingProfile, payload)) {
      alreadyCurrent.push({
        profileId: existingProfile.id ?? null,
        seedKey,
        eventType: seed.eventType,
      });
      continue;
    }

    updates.push({
      ref,
      payload: {
        ...payload,
        id: existingProfile.id ?? payload.id,
        metadata: {
          ...metadata,
          seedKey,
          seededBy: 'default_posting_profiles',
          backfilledFiscalSourcesBy: 'backfillAccountingCore',
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'script:backfillAccountingCore',
      },
      seedKey,
      eventType: seed.eventType,
    });
  }

  return {
    creates,
    updates,
    deactivations,
    alreadyCurrent,
    skippedCustom,
    skippedMissingAccounts,
    likelyFixableEventTypes: Array.from(
      new Set(
        [...creates, ...updates, ...deactivations]
          .map((change) => toCleanString(change.eventType))
          .filter(Boolean),
      ),
    ).sort(),
  };
};

const ACCOUNTING_EVENT_REPAIR_FIELDS = [
  'eventType',
  'eventVersion',
  'status',
  'sourceType',
  'sourceId',
  'sourceDocumentType',
  'sourceDocumentId',
  'counterpartyType',
  'counterpartyId',
  'currency',
  'functionalCurrency',
  'monetary',
  'treasury',
  'payload',
  'dedupeKey',
  'idempotencyKey',
  'reversalOfEventId',
  'createdBy',
];

const stableSerialize = (value) => {
  const sanitized = sanitizeForResponse(value);
  if (sanitized == null || typeof sanitized !== 'object') {
    return JSON.stringify(sanitized);
  }
  if (Array.isArray(sanitized)) {
    return `[${sanitized.map((item) => stableSerialize(item)).join(',')}]`;
  }
  const record = asRecord(sanitized);
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(',')}}`;
};

export const buildAccountingEventRepairPatch = (rebuiltEvent) =>
  ACCOUNTING_EVENT_REPAIR_FIELDS.reduce((patch, field) => {
    if (rebuiltEvent[field] !== undefined) {
      patch[field] = rebuiltEvent[field];
    }
    return patch;
  }, {});

export const resolveChangedAccountingEventFields = ({
  currentEvent,
  rebuiltEvent,
}) =>
  ACCOUNTING_EVENT_REPAIR_FIELDS.filter(
    (field) =>
      stableSerialize(currentEvent?.[field] ?? null) !==
      stableSerialize(rebuiltEvent?.[field] ?? null),
  );

export const getAccountingEventRepairPlan = ({
  currentEvent,
  eventRef,
  rebuiltEvent,
  sourceCollection,
  sourceId,
}) => {
  if (!rebuiltEvent) {
    return {
      reason: 'source_not_accounting_event_candidate',
      shouldRepair: false,
    };
  }

  const eventId = toCleanString(rebuiltEvent.id);
  if (!eventId) {
    return {
      reason: 'rebuilt_event_missing_id',
      shouldRepair: false,
    };
  }

  if (!currentEvent) {
    return {
      eventId,
      eventType: toCleanString(rebuiltEvent.eventType),
      patch: rebuiltEvent,
      ref: eventRef,
      repairType: 'create',
      shouldRepair: true,
      sourceCollection,
      sourceId,
    };
  }

  const changedFields = resolveChangedAccountingEventFields({
    currentEvent,
    rebuiltEvent,
  });
  if (!changedFields.length) {
    return {
      eventId,
      reason: 'already_current',
      shouldRepair: false,
    };
  }

  return {
    changedFields,
    eventId,
    eventType: toCleanString(rebuiltEvent.eventType),
    patch: buildAccountingEventRepairPatch(rebuiltEvent),
    ref: eventRef,
    repairType: 'update',
    shouldRepair: true,
    sourceCollection,
    sourceId,
  };
};

const planAccountingEventRepairFromSource = async ({
  buildEvent,
  businessId,
  db,
  sourceCollection,
  sourceId,
}) => {
  let rebuiltEvent;
  try {
    rebuiltEvent = buildEvent();
  } catch (error) {
    return {
      skipped: {
        reason: 'rebuild_failed',
        sourceCollection,
        sourceId,
        message: error?.message ?? String(error),
      },
    };
  }

  if (!rebuiltEvent) {
    return {
      skipped: {
        reason: 'source_not_accounting_event_candidate',
        sourceCollection,
        sourceId,
      },
    };
  }

  const eventId = toCleanString(rebuiltEvent.id);
  const eventRef = db.doc(`businesses/${businessId}/accountingEvents/${eventId}`);
  const currentEventSnap = await eventRef.get();
  const currentEvent = currentEventSnap.exists
    ? {
        id: currentEventSnap.id,
        ...asRecord(currentEventSnap.data()),
      }
    : null;
  const plan = getAccountingEventRepairPlan({
    currentEvent,
    eventRef,
    rebuiltEvent,
    sourceCollection,
    sourceId,
  });

  return plan.shouldRepair
    ? { repair: plan }
    : {
        skipped: {
          eventId: plan.eventId ?? eventId,
          reason: plan.reason,
          sourceCollection,
          sourceId,
        },
      };
};

const repairAccountingEventsFromSourceDocuments = async (
  db,
  businessId,
  { dryRun },
) => {
  const [purchasesSnap, expensesSnap] = await Promise.all([
    db.collection(`businesses/${businessId}/purchases`).get(),
    db.collection(`businesses/${businessId}/expenses`).get(),
  ]);
  const repairs = [];
  const skipped = [];

  for (const purchaseSnap of purchasesSnap.docs) {
    const purchaseId = toCleanString(purchaseSnap.id);
    const purchaseRecord = asRecord(purchaseSnap.data());
    if (!purchaseId) {
      skipped.push({
        reason: 'source_id_missing',
        sourceCollection: 'purchases',
        sourceId: purchaseSnap.id,
      });
      continue;
    }

    const plan = await planAccountingEventRepairFromSource({
      businessId,
      db,
      sourceCollection: 'purchases',
      sourceId: purchaseId,
      buildEvent: () =>
        buildPurchaseCommittedAccountingEvent({
          afterPurchase: purchaseRecord,
          beforePurchase: null,
          businessId,
          purchaseId,
        }),
    });

    if (plan.repair) {
      repairs.push(plan.repair);
    } else if (plan.skipped?.reason !== 'source_not_accounting_event_candidate') {
      skipped.push(plan.skipped);
    }
  }

  for (const expenseSnap of expensesSnap.docs) {
    const expenseId = toCleanString(expenseSnap.id);
    const expenseDocument = asRecord(expenseSnap.data());
    const expenseRecord = asRecord(expenseDocument.expense ?? expenseDocument);
    if (!expenseId) {
      skipped.push({
        reason: 'source_id_missing',
        sourceCollection: 'expenses',
        sourceId: expenseSnap.id,
      });
      continue;
    }

    const plan = await planAccountingEventRepairFromSource({
      businessId,
      db,
      sourceCollection: 'expenses',
      sourceId: expenseId,
      buildEvent: () =>
        buildExpenseRecordedAccountingEvent({
          afterExpense: expenseRecord,
          beforeExpense: null,
          businessId,
          expenseId,
        }),
    });

    if (plan.repair) {
      repairs.push(plan.repair);
    } else if (plan.skipped?.reason !== 'source_not_accounting_event_candidate') {
      skipped.push(plan.skipped);
    }
  }

  if (!dryRun) {
    const batchLimit = 450;
    for (let index = 0; index < repairs.length; index += batchLimit) {
      const batch = db.batch();
      repairs.slice(index, index + batchLimit).forEach(({ patch, ref }) => {
        batch.set(ref, patch, { merge: true });
      });
      await batch.commit();
    }
  }

  const plannedCreates = repairs.filter(
    (repair) => repair.repairType === 'create',
  );
  const plannedUpdates = repairs.filter(
    (repair) => repair.repairType === 'update',
  );

  return {
    planned: repairs.length,
    created: dryRun ? 0 : plannedCreates.length,
    updated: dryRun ? 0 : plannedUpdates.length,
    plannedCreatedAccountingEvents: plannedCreates.map((repair) => ({
      eventId: repair.eventId,
      eventType: repair.eventType,
      sourceCollection: repair.sourceCollection,
      sourceId: repair.sourceId,
    })),
    plannedUpdatedAccountingEvents: plannedUpdates.map((repair) => ({
      changedFields: repair.changedFields,
      eventId: repair.eventId,
      eventType: repair.eventType,
      sourceCollection: repair.sourceCollection,
      sourceId: repair.sourceId,
    })),
    skippedAccountingEvents: skipped,
  };
};

const resolvePurchaseDocumentTotal = (purchaseRecord) => {
  const monetary = asRecord(purchaseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const totalFromPaymentState = safeNumber(purchaseRecord.paymentState?.total);
  const totalFromMonetary = safeNumber(
    documentTotals.total ?? documentTotals.gross,
  );
  const totalFallback =
    safeNumber(purchaseRecord.totalAmount) ??
    safeNumber(purchaseRecord.total) ??
    safeNumber(purchaseRecord.amount);

  return roundToTwoDecimals(
    totalFromPaymentState ?? totalFromMonetary ?? totalFallback ?? 0,
  );
};

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  return admin.credential.cert(
    JSON.parse(fs.readFileSync(absolutePath, 'utf8')),
  );
};

const ensureChartOfAccounts = async (db, businessId, { dryRun }) => {
  const accountsSnap = await db
    .collection(`businesses/${businessId}/chartOfAccounts`)
    .get();
  const accounts = accountsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...asRecord(docSnap.data()),
  }));
  const { skippedExistingCodeMissingSystemKey, writes } =
    planMissingChartAccounts({
      accounts,
      businessId,
      templates: [
        ...loadDefaultChartOfAccountTemplatesFromSource(),
        ...REQUIRED_CHART_OF_ACCOUNTS,
      ],
      createRef: () =>
        db.collection(`businesses/${businessId}/chartOfAccounts`).doc(),
    });

  if (!writes.length) {
    return {
      planned: 0,
      created: 0,
      skippedExistingCodeMissingSystemKey,
    };
  }

  if (dryRun) {
    return {
      planned: writes.length,
      created: 0,
      skippedExistingCodeMissingSystemKey,
    };
  }

  const batch = db.batch();
  writes.forEach(({ ref, payload }) =>
    batch.set(ref, payload, { merge: true }),
  );
  await batch.commit();
  return {
    planned: writes.length,
    created: writes.length,
    skippedExistingCodeMissingSystemKey,
  };
};

const loadChartOfAccounts = async (db, businessId) => {
  const accountsSnap = await db
    .collection(`businesses/${businessId}/chartOfAccounts`)
    .get();
  return accountsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...asRecord(docSnap.data()),
  }));
};

const migrateDefaultPostingProfiles = async (
  db,
  businessId,
  { dryRun, includeSeedKeyOnly },
) => {
  const [accounts, profilesSnap] = await Promise.all([
    loadChartOfAccounts(db, businessId),
    db.collection(`businesses/${businessId}/accountingPostingProfiles`).get(),
  ]);

  const profiles = profilesSnap.docs.map((profileSnap) => ({
    id: profileSnap.id,
    ref: profileSnap.ref,
    ...asRecord(profileSnap.data()),
  }));
  const plan = planDefaultPostingProfileChanges({
    accounts,
    businessId,
    createRef: (seed) => {
      const seedKey = toCleanString(seed.seedKey);
      return db
        .collection(`businesses/${businessId}/accountingPostingProfiles`)
        .doc(seedKey || undefined);
    },
    includeSeedKeyOnly,
    profiles,
  });
  const skippedCustom = plan.skippedCustom.map((skipped) => ({
    ...skipped,
    includeSeedKeyOnlyRequested: includeSeedKeyOnly,
  }));
  const updates = plan.updates;
  const deactivations = plan.deactivations;

  if (!dryRun) {
    const batchLimit = 450;
    const writes = [
      ...plan.creates.map((change) => ({
        ref: change.ref,
        payload: change.payload,
      })),
      ...updates.map((change) => ({
        ref: change.ref,
        payload: change.payload,
      })),
      ...deactivations
        .filter((change) => change.ref)
        .map((change) => ({
          ref: change.ref,
          payload: change.payload,
        })),
    ];

    for (let index = 0; index < writes.length; index += batchLimit) {
      const batch = db.batch();
      writes.slice(index, index + batchLimit).forEach(({ ref, payload }) => {
        batch.set(ref, payload, { merge: true });
      });
      await batch.commit();
    }
  }

  return {
    planned: plan.creates.length + updates.length + deactivations.length,
    created: dryRun ? 0 : plan.creates.length,
    updated: dryRun ? 0 : updates.length,
    deactivated: dryRun ? 0 : deactivations.length,
    alreadyCurrent: plan.alreadyCurrent.length,
    plannedCreates: plan.creates.map(({ seedKey, eventType }) => ({
      seedKey,
      eventType,
    })),
    plannedUpdates: updates.map(({ seedKey, eventType }) => ({
      seedKey,
      eventType,
    })),
    plannedDeactivations: deactivations.map(
      ({ profileId, seedKey, eventType }) => ({
        profileId,
        seedKey,
        eventType,
      }),
    ),
    skippedCustom,
    skippedSeedKeyOnly: skippedCustom.length,
    skippedMissingAccounts: plan.skippedMissingAccounts,
    likelyFixableEventTypes: plan.likelyFixableEventTypes,
  };
};

const syncVendorBillsFromPurchases = async (db, businessId, { dryRun }) => {
  const purchasesSnap = await db
    .collection(`businesses/${businessId}/purchases`)
    .get();
  let plannedMaterialized = 0;
  let materialized = 0;
  let plannedDeleted = 0;
  let deleted = 0;

  for (const purchaseSnap of purchasesSnap.docs) {
    const purchaseId = toCleanString(purchaseSnap.id);
    if (!purchaseId) {
      continue;
    }

    const purchaseRecord = asRecord(purchaseSnap.data());
    const total = resolvePurchaseDocumentTotal(purchaseRecord);
    const paymentTerms = {
      ...asRecord(purchaseRecord.paymentTerms),
    };
    const paymentState =
      purchaseRecord.paymentState ??
      buildPurchasePaymentState({
        purchaseRecord,
        total,
        paid: 0,
        paymentCount: 0,
        lastPaymentAt: null,
        lastPaymentId: null,
        nextPaymentAt:
          paymentTerms.nextPaymentAt ?? paymentTerms.expectedPaymentAt ?? null,
      });
    const vendorBillId = buildCanonicalVendorBillIdFromPurchaseId(purchaseId);
    const vendorBillProjection = buildVendorBillProjection({
      purchaseId,
      purchaseRecord,
      paymentState,
      paymentTerms,
      vendorBillId,
    });
    const vendorBillRef = db.doc(
      `businesses/${businessId}/vendorBills/${vendorBillId}`,
    );

    if (!vendorBillProjection) {
      plannedDeleted += 1;
      if (!dryRun) {
        await vendorBillRef.delete().catch(() => null);
        deleted += 1;
      }
      continue;
    }

    plannedMaterialized += 1;
    if (!dryRun) {
      await vendorBillRef.set(vendorBillProjection, { merge: true });
      materialized += 1;
    }
  }

  return { plannedMaterialized, materialized, plannedDeleted, deleted };
};

const main = async () => {
  const serviceAccountPath =
    getFlagValue('--service-account') ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    null;
  const targetBusinessId = getFlagValue('--business');
  const dryRun = !hasFlag('--write') || hasFlag('--dry-run');
  const allBusinesses = hasFlag('--all-businesses');
  const includeSeedKeyOnly = hasFlag('--include-seed-key-only');

  if (!serviceAccountPath) {
    throw new Error(
      'Debe indicar --service-account o GOOGLE_APPLICATION_CREDENTIALS.',
    );
  }

  if (!targetBusinessId && !allBusinesses) {
    throw new Error(
      'Debe indicar --business <businessId> o --all-businesses. Dry-run por defecto; agregue --write para escribir.',
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: loadServiceAccountCredential(serviceAccountPath),
    });
  }

  const db = admin.firestore();
  const businessesSnap = targetBusinessId
    ? {
        docs: [await db.doc(`businesses/${targetBusinessId}`).get()].filter(
          (snapshot) => snapshot.exists,
        ),
      }
    : await db.collection('businesses').get();

  console.log(
    JSON.stringify({
      mode: dryRun ? 'dry-run' : 'write',
      target: targetBusinessId ?? 'all-businesses',
    }),
  );

  for (const businessSnap of businessesSnap.docs) {
    const businessId = businessSnap.id;
    const accounts = await ensureChartOfAccounts(db, businessId, { dryRun });
    const postingProfiles = await migrateDefaultPostingProfiles(
      db,
      businessId,
      {
        dryRun,
        includeSeedKeyOnly,
      },
    );
    const accountingEvents = await repairAccountingEventsFromSourceDocuments(
      db,
      businessId,
      { dryRun },
    );
    const vendorBills = await syncVendorBillsFromPurchases(db, businessId, {
      dryRun,
    });

    console.log(
      JSON.stringify({
        businessId,
        plannedChartAccounts: accounts.planned,
        createdChartAccounts: accounts.created,
        skippedChartAccountsExistingCodeMissingSystemKey:
          accounts.skippedExistingCodeMissingSystemKey,
        plannedPostingProfiles: postingProfiles.planned,
        createdPostingProfiles: postingProfiles.created,
        updatedPostingProfiles: postingProfiles.updated,
        deactivatedPostingProfiles: postingProfiles.deactivated,
        currentPostingProfiles: postingProfiles.alreadyCurrent,
        plannedCreatedPostingProfiles: postingProfiles.plannedCreates,
        plannedUpdatedPostingProfiles: postingProfiles.plannedUpdates,
        plannedDeactivatedPostingProfiles:
          postingProfiles.plannedDeactivations,
        skippedCustomPostingProfiles: postingProfiles.skippedCustom,
        skippedSeedKeyOnlyPostingProfiles: postingProfiles.skippedSeedKeyOnly,
        skippedMissingAccountPostingProfiles:
          postingProfiles.skippedMissingAccounts,
        likelyFixableEventTypes: postingProfiles.likelyFixableEventTypes,
        plannedAccountingEvents: accountingEvents.planned,
        createdAccountingEvents: accountingEvents.created,
        updatedAccountingEvents: accountingEvents.updated,
        plannedCreatedAccountingEvents:
          accountingEvents.plannedCreatedAccountingEvents,
        plannedUpdatedAccountingEvents:
          accountingEvents.plannedUpdatedAccountingEvents,
        skippedAccountingEvents: accountingEvents.skippedAccountingEvents,
        plannedVendorBills: vendorBills.plannedMaterialized,
        materializedVendorBills: vendorBills.materialized,
        plannedDeletedVendorBills: vendorBills.plannedDeleted,
        deletedVendorBills: vendorBills.deleted,
      }),
    );
  }
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[backfillAccountingCore] Failed:', error);
      process.exit(1);
    });
}
