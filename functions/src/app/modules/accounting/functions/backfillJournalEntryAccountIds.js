import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldPath, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';

const BACKFILL_VERSION = 'journal-entry-account-ids-v1';
const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 400;
const DEFAULT_MAX_PAGES = 5;
const MAX_PAGES = 25;
const MAX_SAMPLES = 25;

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

const clampInteger = ({ value, fallback, min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
};

const uniqueStrings = (values) => {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const cleaned = toCleanString(value);
    if (!cleaned || seen.has(cleaned)) return;
    seen.add(cleaned);
    result.push(cleaned);
  });
  return result;
};

const resolveJournalEntryLines = (entry) => {
  const record = asRecord(entry);
  const data = asRecord(record.data);
  const candidates = [
    record.lines,
    data.lines,
    record.journalLines,
    data.journalLines,
    record.entryLines,
    data.entryLines,
  ];
  return candidates.find((candidate) => Array.isArray(candidate)) ?? null;
};

const resolveLineAccountId = (line) => {
  const record = asRecord(line);
  const account = asRecord(record.account);
  return (
    toCleanString(record.accountId) ||
    toCleanString(record.accountID) ||
    toCleanString(record.chartOfAccountId) ||
    toCleanString(account.id) ||
    toCleanString(account.accountId) ||
    null
  );
};

export const deriveJournalEntryAccountIds = (entry) => {
  const lines = resolveJournalEntryLines(entry);
  if (!Array.isArray(lines)) {
    return {
      ok: false,
      code: 'missing_lines',
      message: 'El asiento no tiene líneas contables legibles.',
      accountIds: [],
    };
  }
  if (!lines.length) {
    return {
      ok: false,
      code: 'empty_lines',
      message: 'El asiento no tiene líneas contables.',
      accountIds: [],
    };
  }

  const missingLineIndexes = [];
  const accountIds = [];
  lines.forEach((line, index) => {
    const accountId = resolveLineAccountId(line);
    if (!accountId) {
      missingLineIndexes.push(index + 1);
      return;
    }
    accountIds.push(accountId);
  });

  if (missingLineIndexes.length) {
    return {
      ok: false,
      code: 'missing_line_account_id',
      message: 'Una o más líneas del asiento no tienen accountId.',
      missingLineIndexes,
      accountIds: uniqueStrings(accountIds),
    };
  }

  const uniqueAccountIds = uniqueStrings(accountIds);
  if (!uniqueAccountIds.length) {
    return {
      ok: false,
      code: 'no_account_ids',
      message: 'No se encontraron cuentas contables en las líneas del asiento.',
      accountIds: [],
    };
  }

  return {
    ok: true,
    accountIds: uniqueAccountIds,
  };
};

export const journalEntryAccountIdsAreCurrent = (
  currentAccountIds,
  derivedAccountIds,
) => {
  if (!Array.isArray(currentAccountIds)) return false;
  const currentClean = currentAccountIds.map((value) => toCleanString(value));
  if (currentClean.some((value) => !value)) return false;

  const currentUnique = uniqueStrings(currentClean);
  if (currentUnique.length !== currentAccountIds.length) return false;
  if (currentUnique.length !== derivedAccountIds.length) return false;

  const currentSet = new Set(currentUnique);
  return derivedAccountIds.every((accountId) => currentSet.has(accountId));
};

const addSample = (samples, sample) => {
  if (samples.length < MAX_SAMPLES) {
    samples.push(sample);
  }
};

const buildBackfillPayload = ({ accountIds, authUid, now }) => ({
  accountIds,
  accountIdsBackfill: {
    version: BACKFILL_VERSION,
    updatedAt: now,
    updatedBy: authUid,
  },
});

export const backfillJournalEntryAccountIds = onCall(
  {
    cors: true,
    invoker: 'public',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId =
      toCleanString(payload.businessId) ||
      toCleanString(payload.businessID) ||
      null;
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido.');
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_ADMIN,
    });

    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);
    const rolloutEnabled = isAccountingRolloutEnabledForBusiness(
      businessId,
      accountingSettings,
    );
    if (!rolloutEnabled || accountingSettings?.generalAccountingEnabled !== true) {
      throw new HttpsError(
        'failed-precondition',
        'La contabilidad general no está habilitada para este negocio.',
      );
    }

    const dryRun = payload.dryRun !== false;
    const pageSize = clampInteger({
      value: payload.pageSize ?? payload.limit,
      fallback: DEFAULT_PAGE_SIZE,
      min: 1,
      max: MAX_PAGE_SIZE,
    });
    const maxPages = clampInteger({
      value: payload.maxPages,
      fallback: DEFAULT_MAX_PAGES,
      min: 1,
      max: MAX_PAGES,
    });
    const startAfterId = toCleanString(payload.startAfterId);

    const journalEntriesRef = db.collection(
      `businesses/${businessId}/journalEntries`,
    );
    const docIdField = FieldPath.documentId();
    let query = journalEntriesRef.orderBy(docIdField).limit(pageSize);
    if (startAfterId) {
      query = query.startAfter(startAfterId);
    }

    const now = Timestamp.now();
    const summary = {
      ok: true,
      dryRun,
      businessId,
      version: BACKFILL_VERSION,
      pageSize,
      maxPages,
      pagesProcessed: 0,
      processed: 0,
      updated: 0,
      wouldUpdate: 0,
      skipped: 0,
      errors: 0,
      lastDocId: startAfterId ?? null,
      nextStartAfterId: null,
      hasMore: false,
      updatedSamples: [],
      skippedSamples: [],
      errorSamples: [],
    };

    let batch = dryRun ? null : db.batch();
    let batchCount = 0;

    const commitBatch = async () => {
      if (dryRun || batchCount === 0) return;
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    };

    while (summary.pagesProcessed < maxPages) {
      const snap = await query.get();
      if (snap.empty) {
        summary.hasMore = false;
        break;
      }

      summary.pagesProcessed += 1;
      for (const docSnap of snap.docs) {
        summary.processed += 1;
        summary.lastDocId = docSnap.id;

        try {
          const entry = asRecord(docSnap.data());
          const derivation = deriveJournalEntryAccountIds(entry);
          if (!derivation.ok) {
            summary.errors += 1;
            addSample(summary.errorSamples, {
              entryId: docSnap.id,
              code: derivation.code,
              message: derivation.message,
              missingLineIndexes: derivation.missingLineIndexes ?? null,
            });
            continue;
          }

          if (
            journalEntryAccountIdsAreCurrent(
              entry.accountIds,
              derivation.accountIds,
            )
          ) {
            summary.skipped += 1;
            addSample(summary.skippedSamples, {
              entryId: docSnap.id,
              reason: 'account_ids_current',
            });
            continue;
          }

          addSample(summary.updatedSamples, {
            entryId: docSnap.id,
            accountIds: derivation.accountIds,
          });

          if (dryRun) {
            summary.wouldUpdate += 1;
            continue;
          }

          batch.set(
            docSnap.ref,
            buildBackfillPayload({
              accountIds: derivation.accountIds,
              authUid,
              now,
            }),
            { merge: true },
          );
          batchCount += 1;
          summary.updated += 1;

          if (batchCount >= MAX_PAGE_SIZE) {
            await commitBatch();
          }
        } catch (error) {
          summary.errors += 1;
          addSample(summary.errorSamples, {
            entryId: docSnap.id,
            code: 'unexpected_error',
            message: error?.message || 'Error inesperado',
          });
        }
      }

      await commitBatch();

      if (snap.size < pageSize) {
        summary.hasMore = false;
        break;
      }

      summary.hasMore = true;
      summary.nextStartAfterId = summary.lastDocId;
      if (summary.pagesProcessed >= maxPages) {
        break;
      }

      query = journalEntriesRef
        .orderBy(docIdField)
        .startAfter(summary.lastDocId)
        .limit(pageSize);
    }

    if (!summary.hasMore) {
      summary.nextStartAfterId = null;
    }

    logger.info('[backfillJournalEntryAccountIds] completed', {
      businessId,
      dryRun,
      processed: summary.processed,
      updated: summary.updated,
      wouldUpdate: summary.wouldUpdate,
      skipped: summary.skipped,
      errors: summary.errors,
      hasMore: summary.hasMore,
      nextStartAfterId: summary.nextStartAfterId,
    });

    return summary;
  },
);
