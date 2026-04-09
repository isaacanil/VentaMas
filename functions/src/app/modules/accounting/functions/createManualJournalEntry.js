import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { CreateManualJournalEntryInputSchema } from '../../../../shared/accountingSchemas.js';

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
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { buildJournalEntry } from '../../../versions/v2/accounting/utils/journalEntry.util.js';
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
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

const sanitizeManualLines = (lines) =>
  lines.map((line) => ({
    accountId: line.accountId,
    debit: roundToTwoDecimals(line.debit),
    credit: roundToTwoDecimals(line.credit),
    description: line.description ?? null,
  }));

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
      'La fecha del asiento no es válida.',
    );
  }

  return Timestamp.fromDate(parsedDate);
};

export const createManualJournalEntry = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const parsedPayload = parseSchemaOrThrow(
    CreateManualJournalEntryInputSchema,
    {
      businessId:
        toCleanString(payload.businessId) ||
        toCleanString(payload.businessID) ||
        null,
      description: toCleanString(payload.description),
      note: toCleanString(payload.note),
      entryDate: toCleanString(payload.entryDate),
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
    'No se pudo validar el asiento manual.',
  );
  const { businessId, description, note, entryDate } = parsedPayload;
  const sanitizedLines = sanitizeManualLines(parsedPayload.lines);

  const totals = sanitizedLines.reduce(
    (accumulator, line) => ({
      debit: roundToTwoDecimals(accumulator.debit + line.debit),
      credit: roundToTwoDecimals(accumulator.credit + line.credit),
    }),
    { debit: 0, credit: 0 },
  );
  if (Math.abs(totals.debit - totals.credit) > THRESHOLD) {
    throw new HttpsError(
      'invalid-argument',
      'El asiento no cuadra. Debito y credito deben coincidir.',
    );
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
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

  const entryDateTimestamp = buildEntryDateTimestamp(entryDate);
  const journalEntriesCollection = db.collection(
    `businesses/${businessId}/journalEntries`,
  );
  const entryRef = journalEntriesCollection.doc();
  const entryId = entryRef.id;
  const settingsRef = db.doc(`businesses/${businessId}/settings/accounting`);

  let result = null;

  await db.runTransaction(async (transaction) => {
    const [settingsSnap, ...accountSnaps] = await Promise.all([
      transaction.get(settingsRef),
      ...Array.from(new Set(sanitizedLines.map((line) => line.accountId))).map(
        (accountId) =>
          transaction.get(
            db.doc(`businesses/${businessId}/chartOfAccounts/${accountId}`),
          ),
      ),
    ]);

    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: entryDateTimestamp,
      settings: settingsSnap.exists ? settingsSnap.data() || {} : {},
      rolloutEnabled,
      operationLabel: 'registrar este asiento manual',
      createError: (message) => new HttpsError('failed-precondition', message),
    });

    const accountsById = new Map(
      accountSnaps.map((snapshot) => [snapshot.id, asRecord(snapshot.data())]),
    );

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
      if (account.postingAllowed === false) {
        throw new HttpsError(
          'invalid-argument',
          'Todas las cuentas del asiento deben permitir posteo.',
        );
      }

      return {
        lineNumber: index + 1,
        accountId: line.accountId,
        accountCode: toCleanString(account.code),
        accountName: toCleanString(account.name),
        accountSystemKey: toCleanString(account.systemKey),
        description: line.description ?? null,
        debit: line.debit,
        credit: line.credit,
        reference: note ?? null,
      };
    });

    const now = Timestamp.now();
    const accountingEvent = buildAccountingEvent({
      businessId,
      eventType: 'manual.entry.recorded',
      status: 'projected',
      sourceType: 'manual_entry',
      sourceId: entryId,
      sourceDocumentType: 'journalEntry',
      sourceDocumentId: entryId,
      currency: accountingSettings?.functionalCurrency ?? 'DOP',
      functionalCurrency: accountingSettings?.functionalCurrency ?? 'DOP',
      payload: {
        description,
        lineCount: resolvedLines.length,
        note: note ?? null,
        entryOrigin: 'manual',
      },
      projection: {
        status: 'projected',
        journalEntryId: entryId,
        lastAttemptAt: now,
        projectedAt: now,
      },
      occurredAt: entryDateTimestamp,
      recordedAt: now,
      createdAt: now,
      createdBy: authUid,
      metadata: {
        entryOrigin: 'manual',
      },
    });
    const entry = buildJournalEntry({
      businessId,
      entryId,
      event: accountingEvent,
      entryDate: entryDateTimestamp,
      description,
      currency: accountingSettings?.functionalCurrency ?? 'DOP',
      functionalCurrency: accountingSettings?.functionalCurrency ?? 'DOP',
      sourceType: 'manual_entry',
      sourceId: entryId,
      lines: resolvedLines,
      createdAt: now,
      createdBy: authUid,
      metadata: {
        entryOrigin: 'manual',
        note: note ?? null,
      },
    });

    transaction.set(entryRef, entry);
    result = {
      ok: true,
      entryId,
      eventId: accountingEvent.id,
      status: entry.status,
    };
  });

  return result;
  },
);
