import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ReverseJournalEntryInputSchema } from '../../../../shared/accountingSchemas.js';

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
  buildJournalEntry,
  normalizeJournalEntryLine,
} from '../../../versions/v2/accounting/utils/journalEntry.util.js';
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import { parseSchemaOrThrow } from '../utils/zodHttps.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const isIsoDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const buildEntryDateTimestamp = (entryDate) => {
  const normalizedDate = toCleanString(entryDate);
  if (!normalizedDate || !isIsoDateOnly(normalizedDate)) {
    throw new HttpsError(
      'invalid-argument',
      'La fecha del reverso debe tener formato YYYY-MM-DD.',
    );
  }

  const parsedDate = new Date(`${normalizedDate}T12:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new HttpsError(
      'invalid-argument',
      'La fecha del reverso no es válida.',
    );
  }

  return Timestamp.fromDate(parsedDate);
};

const buildDefaultReversalDate = () => new Date().toISOString().slice(0, 10);

export const reverseJournalEntry = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const parsedPayload = parseSchemaOrThrow(
    ReverseJournalEntryInputSchema,
    {
      businessId:
        toCleanString(payload.businessId) ||
        toCleanString(payload.businessID) ||
        null,
      entryId: toCleanString(payload.entryId),
      reason: toCleanString(payload.reason),
      reversalDate: toCleanString(payload.reversalDate),
    },
    'No se pudo validar el reverso del asiento.',
  );
  const { businessId, entryId, reason: reversalReason } = parsedPayload;
  const reversalDate =
    parsedPayload.reversalDate || buildDefaultReversalDate();

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

  const reversalDateTimestamp = buildEntryDateTimestamp(reversalDate);
  const entryRef = db.doc(`businesses/${businessId}/journalEntries/${entryId}`);
  const settingsRef = db.doc(`businesses/${businessId}/settings/accounting`);
  const journalEntriesCollection = db.collection(
    `businesses/${businessId}/journalEntries`,
  );

  let result = null;

  await db.runTransaction(async (transaction) => {
    const [settingsSnap, originalEntrySnap] = await Promise.all([
      transaction.get(settingsRef),
      transaction.get(entryRef),
    ]);

    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: reversalDateTimestamp,
      settings: settingsSnap.exists ? settingsSnap.data() || {} : {},
      rolloutEnabled,
      operationLabel: 'registrar este reverso',
      createError: (message) => new HttpsError('failed-precondition', message),
    });

    if (!originalEntrySnap.exists) {
      throw new HttpsError(
        'not-found',
        'El asiento seleccionado ya no existe.',
      );
    }

    const originalEntry = asRecord(originalEntrySnap.data());
    const originalStatus = toCleanString(originalEntry.status) ?? 'posted';
    const originalMetadata = asRecord(originalEntry.metadata);
    const existingReversalEntryId =
      toCleanString(originalMetadata.reversedByEntryId) ||
      toCleanString(originalMetadata.reversalEntryId);

    if (originalStatus === 'reversed') {
      result = {
        ok: true,
        entryId,
        reversalEntryId: existingReversalEntryId,
        reused: true,
      };
      return;
    }

    const originalLines = Array.isArray(originalEntry.lines)
      ? originalEntry.lines.map((line, index) =>
          normalizeJournalEntryLine(line, index),
        )
      : [];

    if (!originalLines.length) {
      throw new HttpsError(
        'failed-precondition',
        'El asiento no tiene líneas válidas para revertir.',
      );
    }

    const reversalEntryRef = journalEntriesCollection.doc();
    const reversalEntryId = reversalEntryRef.id;
    const originalEventId =
      toCleanString(originalEntry.eventId) || `journal:${entryId}`;
    const originalEventType =
      toCleanString(originalEntry.eventType) || 'manual.entry.recorded';
    const now = Timestamp.now();
    const reversalEventId = `${originalEventId}:reversal:${reversalEntryId}`;
    const reversalDescription = [
      'Reverso de',
      toCleanString(originalEntry.description) || entryId,
    ].join(' ');

    const reversalLines = originalLines.map((line, index) => ({
      ...line,
      lineNumber: index + 1,
      debit: Number(line.credit) || 0,
      credit: Number(line.debit) || 0,
      description:
        toCleanString(line.description) ||
        `Reverso de linea ${index + 1}`,
      reference: reversalReason ?? toCleanString(line.reference),
    }));

    const reversalEntry = buildJournalEntry({
      businessId,
      entryId: reversalEntryId,
      event: {
        id: reversalEventId,
        businessId,
        eventType: originalEventType,
        eventVersion: Number(originalEntry.eventVersion) || 1,
        reversalOfEventId: originalEventId,
      },
      entryDate: reversalDateTimestamp,
      description: reversalDescription,
      currency:
        toCleanString(originalEntry.currency) ||
        accountingSettings?.functionalCurrency ||
        'DOP',
      functionalCurrency:
        toCleanString(originalEntry.functionalCurrency) ||
        accountingSettings?.functionalCurrency ||
        'DOP',
      sourceType: 'journal_entry_reversal',
      sourceId: entryId,
      reversalOfEntryId: entryId,
      reversalOfEventId: originalEventId,
      lines: reversalLines,
      createdAt: now,
      createdBy: authUid,
      metadata: {
        entryOrigin: 'reversal',
        reversedEntryId: entryId,
        reversedEventId: originalEventId,
        reversalReason: reversalReason ?? null,
        originalSourceType: toCleanString(originalEntry.sourceType),
        originalSourceId: toCleanString(originalEntry.sourceId),
      },
    });

    transaction.update(entryRef, {
      status: 'reversed',
      metadata: {
        ...originalMetadata,
        reversedAt: now,
        reversedBy: authUid,
        reversedByEntryId: reversalEntryId,
        reversalReason: reversalReason ?? null,
      },
    });
    transaction.set(reversalEntryRef, reversalEntry);

    result = {
      ok: true,
      entryId,
      reversalEntryId,
      reused: false,
    };
  });

  return result;
  },
);
