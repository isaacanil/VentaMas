import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { UpdateJournalEntryInputSchema } from '../../../../shared/accountingSchemas.js';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  computeJournalEntryTotals,
  resolveJournalPeriodKey,
} from '../../../versions/v2/accounting/utils/journalEntry.util.js';
import {
  assertAccountingPeriodOpenInTransaction,
  buildClosedAccountingPeriodMessage,
  isAccountingPeriodValidationEnabled,
} from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import { parseSchemaOrThrow } from '../utils/zodHttps.util.js';

const THRESHOLD = 0.01;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const isIsoDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const toDateOnlyString = (value) => {
  const date =
    value && typeof value.toDate === 'function' ? value.toDate() : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
};

const buildEntryDateTimestamp = (entryDate) => {
  const normalizedDate = toCleanString(entryDate);
  if (!normalizedDate || !isIsoDateOnly(normalizedDate)) {
    throw new HttpsError(
      'invalid-argument',
      'La fecha del asiento debe tener formato YYYY-MM-DD.',
    );
  }

  const parsedDate = new Date(`${normalizedDate}T12:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new HttpsError(
      'invalid-argument',
      'La fecha del asiento no es valida.',
    );
  }

  return Timestamp.fromDate(parsedDate);
};

const buildChildCountByParentId = (chartAccounts = []) =>
  chartAccounts.reduce((accumulator, account) => {
    const parentId = toCleanString(account.parentId);
    if (!parentId) return accumulator;

    accumulator.set(parentId, (accumulator.get(parentId) || 0) + 1);
    return accumulator;
  }, new Map());

const sanitizeLines = (lines) =>
  lines.map((line) => ({
    accountId: line.accountId,
    debit: roundToTwoDecimals(line.debit),
    credit: roundToTwoDecimals(line.credit),
    description: line.description ?? null,
  }));

const isManualJournalEntry = (entry) => {
  const metadata = asRecord(entry.metadata);
  return (
    toCleanString(entry.eventType) === 'manual.entry.recorded' ||
    toCleanString(entry.sourceType) === 'manual_entry' ||
    toCleanString(metadata.entryOrigin) === 'manual'
  );
};

const isReversalJournalEntry = (entry) => {
  const metadata = asRecord(entry.metadata);
  return (
    toCleanString(entry.sourceType) === 'journal_entry_reversal' ||
    toCleanString(metadata.entryOrigin) === 'reversal' ||
    Boolean(toCleanString(entry.reversalOfEntryId))
  );
};

const resolveOriginalPeriodKey = (entry) =>
  toCleanString(entry.periodKey) || resolveJournalPeriodKey(entry.entryDate);

const assertOriginalPeriodOpenInTransaction = async ({
  transaction,
  businessId,
  periodKey,
  settings,
  rolloutEnabled,
}) => {
  if (
    !periodKey ||
    !isAccountingPeriodValidationEnabled({
      rolloutEnabled,
      settings,
    })
  ) {
    return;
  }

  const closureSnap = await transaction.get(
    db.doc(`businesses/${businessId}/accountingPeriodClosures/${periodKey}`),
  );
  if (!closureSnap.exists) {
    return;
  }

  throw new HttpsError(
    'failed-precondition',
    buildClosedAccountingPeriodMessage({
      periodKey,
      operationLabel: 'editar este asiento',
    }),
  );
};

const summarizeLineForAudit = (line) => ({
  lineNumber: Number(line.lineNumber) || null,
  accountId: toCleanString(line.accountId),
  accountCode: toCleanString(line.accountCode),
  accountName: toCleanString(line.accountName),
  debit: roundToTwoDecimals(line.debit),
  credit: roundToTwoDecimals(line.credit),
  description: toCleanString(line.description),
});

const serializeComparableLines = (lines = []) =>
  JSON.stringify(
    lines.map((line) => ({
      accountId: toCleanString(line.accountId),
      credit: roundToTwoDecimals(line.credit),
      debit: roundToTwoDecimals(line.debit),
      description: toCleanString(line.description) ?? '',
    })),
  );

const hasMeaningfulEntryChange = ({ originalEntry, nextDescription, nextDate, nextLines }) =>
  (toCleanString(originalEntry.description) ?? '') !==
    (toCleanString(nextDescription) ?? '') ||
  toDateOnlyString(originalEntry.entryDate) !== nextDate ||
  serializeComparableLines(originalEntry.lines) !==
    serializeComparableLines(nextLines);

const summarizeEntryForAudit = (entry) => ({
  description: toCleanString(entry.description),
  entryDate: entry.entryDate ?? null,
  periodKey: toCleanString(entry.periodKey),
  totals: {
    debit: roundToTwoDecimals(asRecord(entry.totals).debit),
    credit: roundToTwoDecimals(asRecord(entry.totals).credit),
  },
  lineCount: Array.isArray(entry.lines) ? entry.lines.length : 0,
  lines: Array.isArray(entry.lines)
    ? entry.lines.map((line) => summarizeLineForAudit(line))
    : [],
});

export const updateJournalEntry = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const parsedPayload = parseSchemaOrThrow(
      UpdateJournalEntryInputSchema,
      {
        businessId:
          toCleanString(payload.businessId) ||
          toCleanString(payload.businessID) ||
          null,
        entryId: toCleanString(payload.entryId),
        description: toCleanString(payload.description),
        entryDate: toCleanString(payload.entryDate),
        reason: toCleanString(payload.reason),
        lines: Array.isArray(payload.lines)
          ? payload.lines.map((line) => {
              const record = asRecord(line);
              return {
                accountId: toCleanString(record.accountId),
                debit: record.debit,
                credit: record.credit,
                description: toCleanString(record.description),
              };
            })
          : [],
      },
      'No se pudo validar la edicion del asiento.',
    );
    const { businessId, description, entryDate, entryId, reason } =
      parsedPayload;
    const sanitizedLines = sanitizeLines(parsedPayload.lines);
    const totals = computeJournalEntryTotals(sanitizedLines);
    if (Math.abs(totals.debit - totals.credit) > THRESHOLD) {
      throw new HttpsError(
        'invalid-argument',
        'El asiento no cuadra. Debito y credito deben coincidir.',
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_WRITE,
    });

    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);
    const rolloutEnabled = isAccountingRolloutEnabledForBusiness(
      businessId,
      accountingSettings,
    );
    if (
      !rolloutEnabled ||
      accountingSettings?.generalAccountingEnabled !== true
    ) {
      throw new HttpsError(
        'failed-precondition',
        'La contabilidad general no está habilitada para este negocio.',
      );
    }

    const entryDateTimestamp = buildEntryDateTimestamp(entryDate);
    const entryRef = db.doc(
      `businesses/${businessId}/journalEntries/${entryId}`,
    );
    const settingsRef = db.doc(`businesses/${businessId}/settings/accounting`);
    const chartAccountsRef = db.collection(
      `businesses/${businessId}/chartOfAccounts`,
    );

    let result = null;

    await db.runTransaction(async (transaction) => {
      const [settingsSnap, entrySnap, chartAccountsSnap, ...accountSnaps] =
        await Promise.all([
          transaction.get(settingsRef),
          transaction.get(entryRef),
          transaction.get(chartAccountsRef),
          ...Array.from(
            new Set(sanitizedLines.map((line) => line.accountId)),
          ).map((accountId) =>
            transaction.get(
              db.doc(`businesses/${businessId}/chartOfAccounts/${accountId}`),
            ),
          ),
        ]);

      if (!entrySnap.exists) {
        throw new HttpsError(
          'not-found',
          'El asiento seleccionado ya no existe.',
        );
      }

      const originalEntry = {
        id: entrySnap.id,
        ...asRecord(entrySnap.data()),
      };
      const originalStatus = toCleanString(originalEntry.status) ?? 'posted';
      if (originalStatus !== 'posted') {
        throw new HttpsError(
          'failed-precondition',
          'Solo se pueden editar asientos posteados.',
        );
      }
      if (isManualJournalEntry(originalEntry)) {
        throw new HttpsError(
          'failed-precondition',
          'Esta edicion esta disponible para asientos generados automaticamente.',
        );
      }
      if (isReversalJournalEntry(originalEntry)) {
        throw new HttpsError(
          'failed-precondition',
          'No se pueden editar asientos de reverso directamente.',
        );
      }

      const rawSettings = settingsSnap.exists ? settingsSnap.data() || {} : {};
      await assertOriginalPeriodOpenInTransaction({
        transaction,
        businessId,
        periodKey: resolveOriginalPeriodKey(originalEntry),
        settings: rawSettings,
        rolloutEnabled,
      });
      const validatedPeriodKey = await assertAccountingPeriodOpenInTransaction({
        transaction,
        businessId,
        effectiveDate: entryDateTimestamp,
        settings: rawSettings,
        rolloutEnabled,
        operationLabel: 'editar este asiento',
        createError: (message) =>
          new HttpsError('failed-precondition', message),
      });
      const periodKey =
        validatedPeriodKey ?? resolveJournalPeriodKey(entryDateTimestamp);

      const accountsById = new Map(
        accountSnaps.map((snapshot) => [
          snapshot.id,
          asRecord(snapshot.data()),
        ]),
      );
      const childCountByParentId = buildChildCountByParentId(
        chartAccountsSnap.docs.map((snapshot) => ({
          id: snapshot.id,
          ...asRecord(snapshot.data()),
        })),
      );
      const originalLines = Array.isArray(originalEntry.lines)
        ? originalEntry.lines
        : [];
      const resolvedLines = sanitizedLines.map((line, index) => {
        const account = accountsById.get(line.accountId);
        if (!account || !Object.keys(account).length) {
          throw new HttpsError(
            'invalid-argument',
            'Una de las cuentas del asiento ya no existe.',
          );
        }
        if (toCleanString(account.status) !== 'active') {
          throw new HttpsError(
            'invalid-argument',
            'Todas las cuentas del asiento deben estar activas.',
          );
        }
        if (
          account.postingAllowed === false ||
          (childCountByParentId.get(line.accountId) || 0) > 0
        ) {
          throw new HttpsError(
            'invalid-argument',
            'Todas las cuentas del asiento deben ser Cuentas Detalle.',
          );
        }

        const previousLine = asRecord(originalLines[index]);
        return {
          lineNumber: index + 1,
          accountId: line.accountId,
          accountCode: toCleanString(account.code),
          accountName: toCleanString(account.name),
          accountSystemKey: toCleanString(account.systemKey),
          description: line.description ?? null,
          debit: line.debit,
          credit: line.credit,
          reference:
            toCleanString(previousLine.reference) ??
            toCleanString(originalEntry.sourceId) ??
            null,
        };
      });
      const now = Timestamp.now();
      const editId = `${entryId}__${now.toMillis()}`;
      const auditRef = db.doc(
        `businesses/${businessId}/journalEntryEdits/${editId}`,
      );
      const eventId = toCleanString(originalEntry.eventId);
      const eventRef = eventId
        ? db.doc(`businesses/${businessId}/accountingEvents/${eventId}`)
        : null;
      const eventSnap = eventRef ? await transaction.get(eventRef) : null;
      const originalMetadata = asRecord(originalEntry.metadata);
      const nextEntry = {
        ...originalEntry,
        description,
        entryDate: entryDateTimestamp,
        periodKey,
        totals,
        lines: resolvedLines,
      };
      if (
        !hasMeaningfulEntryChange({
          originalEntry,
          nextDate: entryDate,
          nextDescription: description,
          nextLines: resolvedLines,
        })
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Realiza al menos un cambio antes de registrar la correccion contable.',
        );
      }

      transaction.update(entryRef, {
        description,
        entryDate: entryDateTimestamp,
        periodKey,
        totals,
        lines: resolvedLines,
        accountIds: Array.from(
          new Set(resolvedLines.map((line) => line.accountId)),
        ),
        updatedAt: now,
        updatedBy: authUid,
        metadata: {
          ...originalMetadata,
          manuallyEdited: true,
          lastManualEditAt: now,
          lastManualEditBy: authUid,
          lastManualEditId: editId,
          lastManualEditReason: reason,
        },
      });
      transaction.set(auditRef, {
        id: editId,
        businessId,
        entryId,
        eventId,
        eventType: toCleanString(originalEntry.eventType),
        editedAt: now,
        editedBy: authUid,
        reason,
        previous: summarizeEntryForAudit(originalEntry),
        next: summarizeEntryForAudit(nextEntry),
        metadata: {
          source: 'updateJournalEntry',
          sourceType: toCleanString(originalEntry.sourceType),
          sourceId: toCleanString(originalEntry.sourceId),
        },
      });
      if (eventRef && eventSnap?.exists) {
        transaction.update(eventRef, {
          'metadata.journalEntryManuallyEdited': true,
          'metadata.journalEntryEditedAt': now,
          'metadata.journalEntryEditedBy': authUid,
          'metadata.journalEntryEditId': editId,
          'metadata.journalEntryEditReason': reason,
        });
      }

      result = {
        ok: true,
        entryId,
        editId,
        status: originalStatus,
      };
    });

    return result;
  },
);
