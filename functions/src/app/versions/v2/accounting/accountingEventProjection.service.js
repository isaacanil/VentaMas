import { db, Timestamp } from '../../../core/config/firebase.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from './utils/accountingRollout.util.js';
import {
  buildProjectedJournalEntry,
  buildProjectedJournalLines,
  buildProjectionError,
  buildProjectionPatch,
  resolvePostingProfileForEvent,
  validateProjectedLines,
} from './utils/accountingProjection.util.js';
import {
  buildJournalEntry,
  isJournalEntryBalanced,
  normalizeJournalEntryLine,
} from './utils/journalEntry.util.js';
import { buildAccountingPeriodKey } from './utils/periodClosure.util.js';

export const PROJECTOR_VERSION = 1;
const VOIDED_ACCOUNTING_EVENT_STATUSES = new Set(['voided']);
const ZERO_AMOUNT_PROJECTION_STATUS = 'skipped_zero_amount';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeInteger = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

const buildCollectionDocs = (snapshot) =>
  Array.isArray(snapshot?.docs)
    ? snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...asRecord(docSnapshot.data()),
      }))
    : [];

const resolveEventPeriodKey = (event, fallbackDate) =>
  buildAccountingPeriodKey(
    event?.occurredAt ?? event?.entryDate ?? event?.recordedAt ?? fallbackDate,
    fallbackDate,
  );

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasPostingAmountSignal = (event) => {
  const monetary = asRecord(event?.monetary);
  const payload = asRecord(event?.payload);
  const fiscalTotals = asRecord(payload.fiscalTotals);
  const amountKeys = [
    'amount',
    'functionalAmount',
    'subtotalAmount',
    'functionalSubtotalAmount',
    'taxAmount',
    'functionalTaxAmount',
    'netPayableAmount',
    'functionalNetPayableAmount',
    'withholdingITBISAmount',
    'functionalWithholdingITBISAmount',
    'withholdingISRAmount',
    'functionalWithholdingISRAmount',
  ];

  const payloadAmountKeys = [
    'amount',
    'total',
    'netAmount',
    'grossAmount',
    'subtotal',
    'taxAmount',
    'netPayableAmount',
  ];

  return (
    amountKeys.some((key) => Math.abs(safeNumber(monetary[key])) > 0) ||
    payloadAmountKeys.some(
      (key) =>
        Math.abs(safeNumber(payload[key])) > 0 ||
        Math.abs(safeNumber(fiscalTotals[key])) > 0,
    )
  );
};

const buildProjectionUpdate = ({
  accountingEvent,
  status,
  now,
  projectorVersion,
  journalEntryId = null,
  lastError = null,
  replayRequestedBy = null,
}) => {
  const currentProjection = asRecord(accountingEvent.projection);
  const basePatch = buildProjectionPatch({
    status,
    now,
    projectorVersion,
    journalEntryId,
    lastError,
  });

  return {
    ...basePatch,
    projection: {
      ...basePatch.projection,
      attemptCount: safeInteger(currentProjection.attemptCount, 0) + 1,
      replayCount:
        safeInteger(currentProjection.replayCount, 0) +
        (replayRequestedBy ? 1 : 0),
      lastReplayRequestedAt: replayRequestedBy
        ? now
        : (currentProjection.lastReplayRequestedAt ?? null),
      lastReplayRequestedBy:
        toCleanString(replayRequestedBy) ??
        toCleanString(currentProjection.lastReplayRequestedBy) ??
        null,
    },
  };
};

const buildDeadLetterRecord = ({
  businessId,
  eventId,
  accountingEvent,
  projectionUpdate,
  lastError = null,
  replayRequestedBy = null,
  now,
}) => ({
  id: eventId,
  businessId,
  eventId,
  eventType: toCleanString(accountingEvent.eventType),
  eventVersion: Number(accountingEvent.eventVersion) || 1,
  sourceType: toCleanString(accountingEvent.sourceType),
  sourceId: toCleanString(accountingEvent.sourceId),
  sourceDocumentType: toCleanString(accountingEvent.sourceDocumentType),
  sourceDocumentId: toCleanString(accountingEvent.sourceDocumentId),
  periodKey: resolveEventPeriodKey(accountingEvent, now),
  projectionStatus: projectionUpdate.projection.status,
  journalEntryId: toCleanString(projectionUpdate.projection.journalEntryId),
  projectorVersion: projectionUpdate.projection.projectorVersion,
  attemptCount: projectionUpdate.projection.attemptCount,
  replayCount: projectionUpdate.projection.replayCount,
  retryable:
    projectionUpdate.projection.status === 'failed' ||
    projectionUpdate.projection.status === 'pending_account_mapping',
  lastAttemptAt: projectionUpdate.projection.lastAttemptAt,
  lastReplayRequestedAt: projectionUpdate.projection.lastReplayRequestedAt,
  lastReplayRequestedBy: projectionUpdate.projection.lastReplayRequestedBy,
  lastError: lastError ?? projectionUpdate.projection.lastError ?? null,
  metadata: {
    source: 'accountingEvents.projector',
    replayRequestedBy: toCleanString(replayRequestedBy),
    eventStatus: toCleanString(accountingEvent.status),
  },
  updatedAt: now,
});

const persistDeadLetter = async ({
  deadLetterRef,
  businessId,
  eventId,
  accountingEvent,
  projectionUpdate,
  lastError,
  replayRequestedBy,
  now,
}) => {
  await deadLetterRef.set(
    buildDeadLetterRecord({
      businessId,
      eventId,
      accountingEvent,
      projectionUpdate,
      lastError,
      replayRequestedBy,
      now,
    }),
    { merge: true },
  );
};

const buildExistingJournalEntryValidationError = ({
  businessId,
  entry,
  event,
  eventId,
  now,
}) => {
  const entryBusinessId = toCleanString(entry.businessId);
  if (entryBusinessId && entryBusinessId !== businessId) {
    return buildProjectionError({
      code: 'existing-journal-entry-invalid',
      message: 'El asiento existente pertenece a otro negocio.',
      now,
      details: {
        expectedBusinessId: businessId,
        foundBusinessId: entryBusinessId,
      },
    });
  }

  const entryEventId = toCleanString(entry.eventId);
  if (entryEventId && entryEventId !== eventId) {
    return buildProjectionError({
      code: 'existing-journal-entry-invalid',
      message: 'El asiento existente no corresponde al evento contable.',
      now,
      details: { expectedEventId: eventId, foundEventId: entryEventId },
    });
  }

  const entryEventType = toCleanString(entry.eventType);
  const eventType = toCleanString(event.eventType);
  if (entryEventType && eventType && entryEventType !== eventType) {
    return buildProjectionError({
      code: 'existing-journal-entry-invalid',
      message: 'El asiento existente no coincide con el tipo de evento.',
      now,
      details: {
        expectedEventType: eventType,
        foundEventType: entryEventType,
      },
    });
  }

  if (toCleanString(entry.status) === 'reversed') {
    return buildProjectionError({
      code: 'existing-journal-entry-invalid',
      message: 'El asiento existente esta reversado y no puede reutilizarse.',
      now,
      details: { status: 'reversed' },
    });
  }

  if (!isJournalEntryBalanced(entry)) {
    return buildProjectionError({
      code: 'existing-journal-entry-invalid',
      message: 'El asiento existente esta descuadrado.',
      now,
      details: { journalEntryId: toCleanString(entry.id) ?? eventId },
    });
  }

  const entryPeriodKey = toCleanString(entry.periodKey);
  const eventPeriodKey = resolveEventPeriodKey(event, now);
  if (entryPeriodKey && eventPeriodKey && entryPeriodKey !== eventPeriodKey) {
    return buildProjectionError({
      code: 'existing-journal-entry-invalid',
      message: 'El asiento existente pertenece a otro periodo contable.',
      now,
      details: {
        expectedPeriodKey: eventPeriodKey,
        foundPeriodKey: entryPeriodKey,
      },
    });
  }

  const entryCurrency = toCleanString(entry.currency);
  const eventCurrency = toCleanString(event.currency);
  if (entryCurrency && eventCurrency && entryCurrency !== eventCurrency) {
    return buildProjectionError({
      code: 'existing-journal-entry-invalid',
      message: 'El asiento existente no coincide con la moneda del evento.',
      now,
      details: {
        expectedCurrency: eventCurrency,
        foundCurrency: entryCurrency,
      },
    });
  }

  const entryFunctionalCurrency = toCleanString(entry.functionalCurrency);
  const eventFunctionalCurrency = toCleanString(event.functionalCurrency);
  if (
    entryFunctionalCurrency &&
    eventFunctionalCurrency &&
    entryFunctionalCurrency !== eventFunctionalCurrency
  ) {
    return buildProjectionError({
      code: 'existing-journal-entry-invalid',
      message:
        'El asiento existente no coincide con la moneda funcional del evento.',
      now,
      details: {
        expectedFunctionalCurrency: eventFunctionalCurrency,
        foundFunctionalCurrency: entryFunctionalCurrency,
      },
    });
  }

  return null;
};

const resolveExistingReversalEntryId = (entry) => {
  const metadata = asRecord(entry.metadata);
  return (
    toCleanString(metadata.reversedByEntryId) ||
    toCleanString(metadata.reversalEntryId) ||
    null
  );
};

const resolveJournalEntryPeriodKey = (entry, fallbackDate) =>
  toCleanString(entry?.periodKey) ||
  buildAccountingPeriodKey(
    entry?.entryDate ?? entry?.createdAt ?? fallbackDate,
    fallbackDate,
  );

const resolveVoidReversalPeriodKey = ({ eventRecord, reversalEntry, now }) =>
  toCleanString(reversalEntry?.periodKey) ||
  buildAccountingPeriodKey(
    eventRecord?.voidedAt ??
      eventRecord?.recordedAt ??
      eventRecord?.occurredAt ??
      now,
    now,
  );

const buildClosedVoidReversalPeriodError = ({
  eventId,
  now,
  periodKey,
  periodRole,
}) =>
  buildProjectionError({
    code: 'accounting-period-closed',
    message:
      'El periodo contable requerido para anular el evento esta cerrado; reabre el periodo o registra un ajuste posterior.',
    now,
    details: {
      eventId,
      periodKey,
      periodRole,
    },
  });

const findClosedVoidReversalPeriodError = async ({
  businessId,
  eventId,
  eventRecord,
  originalEntry,
  reversalEntry,
  settingsRef,
  now,
}) => {
  const settingsSnap = await settingsRef.get();
  const rawSettings = settingsSnap.exists ? settingsSnap.data() || {} : {};
  const accountingSettings = await getPilotAccountingSettingsForBusiness(
    businessId,
    { settings: rawSettings },
  );

  if (
    !accountingSettings ||
    rawSettings.generalAccountingEnabled !== true ||
    !isAccountingRolloutEnabledForBusiness(businessId, rawSettings)
  ) {
    return null;
  }

  const checks = [
    {
      periodKey: resolveJournalEntryPeriodKey(originalEntry, now),
      periodRole: 'original_entry',
    },
  ];

  if (reversalEntry) {
    checks.push({
      periodKey: resolveVoidReversalPeriodKey({
        eventRecord,
        reversalEntry,
        now,
      }),
      periodRole: 'void_reversal',
    });
  }

  const checkedPeriodKeys = new Set();
  for (const { periodKey, periodRole } of checks) {
    if (!periodKey || checkedPeriodKeys.has(periodKey)) {
      continue;
    }
    checkedPeriodKeys.add(periodKey);

    const closureSnap = await db
      .doc(`businesses/${businessId}/accountingPeriodClosures/${periodKey}`)
      .get();
    if (closureSnap.exists) {
      return buildClosedVoidReversalPeriodError({
        eventId,
        now,
        periodKey,
        periodRole,
      });
    }
  }

  return null;
};

const buildAutomaticVoidReversalEntry = ({
  businessId,
  eventId,
  eventRecord,
  originalEntry,
  reversalEntryId,
  now,
}) => {
  const originalLines = Array.isArray(originalEntry.lines)
    ? originalEntry.lines.map((line, index) =>
        normalizeJournalEntryLine(line, index),
      )
    : [];
  if (!originalLines.length) {
    return null;
  }

  const reversalLines = originalLines.map((line, index) => ({
    ...line,
    lineNumber: index + 1,
    debit: safeNumber(line.credit),
    credit: safeNumber(line.debit),
    description:
      toCleanString(line.description) ||
      `Reverso automatico linea ${index + 1}`,
    reference: 'Evento contable anulado',
  }));

  return buildJournalEntry({
    businessId,
    entryId: reversalEntryId,
    event: {
      id: `${eventId}:void-reversal`,
      businessId,
      eventType: toCleanString(eventRecord.eventType),
      eventVersion: Number(eventRecord.eventVersion) || 1,
      reversalOfEventId: eventId,
    },
    entryDate:
      eventRecord.voidedAt ??
      eventRecord.recordedAt ??
      eventRecord.occurredAt ??
      now,
    description: `Reverso automatico de ${
      toCleanString(originalEntry.description) || eventId
    }`,
    currency:
      toCleanString(originalEntry.currency) ||
      toCleanString(eventRecord.currency),
    functionalCurrency:
      toCleanString(originalEntry.functionalCurrency) ||
      toCleanString(eventRecord.functionalCurrency),
    sourceType: 'accounting_event_void',
    sourceId: eventId,
    reversalOfEntryId: toCleanString(originalEntry.id) || eventId,
    reversalOfEventId: eventId,
    lines: reversalLines,
    createdAt: now,
    createdBy:
      toCleanString(eventRecord.voidedBy) ||
      toCleanString(eventRecord.updatedBy) ||
      toCleanString(eventRecord.createdBy) ||
      'system:accounting-event-projection',
    metadata: {
      entryOrigin: 'automatic_void_reversal',
      reversedEntryId: toCleanString(originalEntry.id) || eventId,
      reversedEventId: eventId,
      originalSourceType: toCleanString(originalEntry.sourceType),
      originalSourceId: toCleanString(originalEntry.sourceId),
      sourceEventStatus: 'voided',
    },
  });
};

export const runAccountingEventProjection = async ({
  businessId,
  eventId,
  accountingEvent,
  replayRequestedBy = null,
} = {}) => {
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedEventId = toCleanString(eventId);
  const eventRecord = {
    id: normalizedEventId,
    ...asRecord(accountingEvent),
  };

  if (
    !normalizedBusinessId ||
    !normalizedEventId ||
    !Object.keys(eventRecord).length
  ) {
    return {
      ok: false,
      status: 'failed',
      journalEntryId: null,
      reusedExistingEntry: false,
      deadLetterId: normalizedEventId,
      lastError: buildProjectionError({
        code: 'accounting-event-missing',
        message: 'El evento contable no existe o no pudo leerse.',
        now: Timestamp.now(),
      }),
    };
  }

  const eventRef = db.doc(
    `businesses/${normalizedBusinessId}/accountingEvents/${normalizedEventId}`,
  );
  const entryRef = db.doc(
    `businesses/${normalizedBusinessId}/journalEntries/${normalizedEventId}`,
  );
  const settingsRef = db.doc(
    `businesses/${normalizedBusinessId}/settings/accounting`,
  );
  const deadLetterRef = db.doc(
    `businesses/${normalizedBusinessId}/accountingEventProjectionDeadLetters/${normalizedEventId}`,
  );
  const now = Timestamp.now();

  if (VOIDED_ACCOUNTING_EVENT_STATUSES.has(toCleanString(eventRecord.status))) {
    const projectionUpdate = buildProjectionUpdate({
      accountingEvent: eventRecord,
      status: 'voided',
      now,
      projectorVersion: PROJECTOR_VERSION,
      replayRequestedBy,
    });
    const entrySnap = await entryRef.get();
    const entryRecord = entrySnap.exists
      ? {
          id: entrySnap.id,
          ...asRecord(entrySnap.data()),
        }
      : null;
    const entryStatus = toCleanString(entryRecord?.status) ?? null;
    const existingReversalEntryId = entryRecord
      ? resolveExistingReversalEntryId(entryRecord)
      : null;
    const reversalEntryId =
      existingReversalEntryId || `${normalizedEventId}__void_reversal`;
    const reversalEntryRef =
      entryRecord && entryStatus !== 'reversed'
        ? db.doc(
            `businesses/${normalizedBusinessId}/journalEntries/${reversalEntryId}`,
          )
        : null;
    const reversalEntry =
      entryRecord && entryStatus !== 'reversed'
        ? buildAutomaticVoidReversalEntry({
            businessId: normalizedBusinessId,
            eventId: normalizedEventId,
            eventRecord,
            originalEntry: entryRecord,
            reversalEntryId,
            now,
          })
        : null;

    if (entryRecord && entryStatus !== 'reversed') {
      const closedPeriodError = await findClosedVoidReversalPeriodError({
        businessId: normalizedBusinessId,
        eventId: normalizedEventId,
        eventRecord,
        originalEntry: entryRecord,
        reversalEntry,
        settingsRef,
        now,
      });
      if (closedPeriodError) {
        const failedProjectionUpdate = buildProjectionUpdate({
          accountingEvent: eventRecord,
          status: 'failed',
          now,
          projectorVersion: PROJECTOR_VERSION,
          journalEntryId: toCleanString(entryRecord.id) ?? normalizedEventId,
          lastError: closedPeriodError,
          replayRequestedBy,
        });
        await eventRef.update(failedProjectionUpdate);
        await persistDeadLetter({
          deadLetterRef,
          businessId: normalizedBusinessId,
          eventId: normalizedEventId,
          accountingEvent: eventRecord,
          projectionUpdate: failedProjectionUpdate,
          lastError: closedPeriodError,
          replayRequestedBy,
          now,
        });

        return {
          ok: false,
          status: 'failed',
          journalEntryId: toCleanString(entryRecord.id) ?? normalizedEventId,
          reusedExistingEntry: false,
          deadLetterId: normalizedEventId,
          lastError: closedPeriodError,
        };
      }

      const originalMetadata = asRecord(entryRecord.metadata);
      if (reversalEntry) {
        const reversalEntrySnap = await reversalEntryRef.get();
        if (!reversalEntrySnap.exists) {
          await reversalEntryRef.set(reversalEntry);
        }
      }
      await entryRef.update({
        status: 'reversed',
        metadata: {
          ...originalMetadata,
          reversedAt: now,
          reversedBy:
            toCleanString(eventRecord.voidedBy) ||
            toCleanString(eventRecord.updatedBy) ||
            'system:accounting-event-projection',
          reversedByEntryId: reversalEntry ? reversalEntryId : null,
          reversalReason: 'Evento contable anulado',
          reversedByEventId: normalizedEventId,
        },
      });
    }

    await eventRef.update({
      ...projectionUpdate,
      'metadata.journalEntryId': null,
      'metadata.voidedJournalEntryId': entryRecord?.id ?? null,
      'metadata.voidedJournalEntryReversalId':
        entryRecord && (existingReversalEntryId || reversalEntry)
          ? reversalEntryId
          : null,
    });
    await deadLetterRef.delete().catch(() => undefined);

    return {
      ok: true,
      status: 'voided',
      journalEntryId: null,
      reusedExistingEntry: false,
      deadLetterId: null,
      lastError: null,
    };
  }

  const [
    settingsSnap,
    entrySnap,
    profilesSnap,
    chartSnap,
    bankAccountsSnap,
    cashAccountsSnap,
  ] = await Promise.all([
    settingsRef.get(),
    entryRef.get(),
    db
      .collection(
        `businesses/${normalizedBusinessId}/accountingPostingProfiles`,
      )
      .get(),
    db.collection(`businesses/${normalizedBusinessId}/chartOfAccounts`).get(),
    db.collection(`businesses/${normalizedBusinessId}/bankAccounts`).get(),
    db.collection(`businesses/${normalizedBusinessId}/cashAccounts`).get(),
  ]);

  if (entrySnap.exists) {
    const existingEntry = {
      id: entrySnap.id,
      ...asRecord(entrySnap.data()),
    };
    const existingEntryError = buildExistingJournalEntryValidationError({
      businessId: normalizedBusinessId,
      entry: existingEntry,
      event: eventRecord,
      eventId: normalizedEventId,
      now,
    });
    if (existingEntryError) {
      const projectionUpdate = buildProjectionUpdate({
        accountingEvent: eventRecord,
        status: 'failed',
        now,
        projectorVersion: PROJECTOR_VERSION,
        journalEntryId: normalizedEventId,
        lastError: existingEntryError,
        replayRequestedBy,
      });
      await eventRef.update(projectionUpdate);
      await persistDeadLetter({
        deadLetterRef,
        businessId: normalizedBusinessId,
        eventId: normalizedEventId,
        accountingEvent: eventRecord,
        projectionUpdate,
        lastError: existingEntryError,
        replayRequestedBy,
        now,
      });

      return {
        ok: false,
        status: 'failed',
        journalEntryId: normalizedEventId,
        reusedExistingEntry: false,
        deadLetterId: normalizedEventId,
        lastError: existingEntryError,
      };
    }

    const projectionUpdate = buildProjectionUpdate({
      accountingEvent: eventRecord,
      status: 'projected',
      now,
      projectorVersion: PROJECTOR_VERSION,
      journalEntryId: normalizedEventId,
      replayRequestedBy,
    });
    await eventRef.update({
      ...projectionUpdate,
      'metadata.journalEntryId': normalizedEventId,
    });
    await deadLetterRef.delete().catch(() => undefined);

    return {
      ok: true,
      status: 'projected',
      journalEntryId: normalizedEventId,
      reusedExistingEntry: true,
      deadLetterId: null,
      lastError: null,
    };
  }

  const rawSettings = settingsSnap.exists ? settingsSnap.data() || {} : {};
  const accountingSettings = await getPilotAccountingSettingsForBusiness(
    normalizedBusinessId,
    { settings: rawSettings },
  );

  if (
    !accountingSettings ||
    rawSettings.generalAccountingEnabled !== true ||
    !isAccountingRolloutEnabledForBusiness(normalizedBusinessId, rawSettings)
  ) {
    const lastError = buildProjectionError({
      code: 'general-accounting-disabled',
      message:
        'La contabilidad general no está habilitada para proyectar este evento.',
      now,
    });
    const projectionUpdate = buildProjectionUpdate({
      accountingEvent: eventRecord,
      status: 'failed',
      now,
      projectorVersion: PROJECTOR_VERSION,
      lastError,
      replayRequestedBy,
    });
    await eventRef.update(projectionUpdate);
    await persistDeadLetter({
      deadLetterRef,
      businessId: normalizedBusinessId,
      eventId: normalizedEventId,
      accountingEvent: eventRecord,
      projectionUpdate,
      lastError,
      replayRequestedBy,
      now,
    });

    return {
      ok: false,
      status: 'failed',
      journalEntryId: null,
      reusedExistingEntry: false,
      deadLetterId: normalizedEventId,
      lastError,
    };
  }

  const eventPeriodKey = resolveEventPeriodKey(eventRecord, now);
  const closureSnap = eventPeriodKey
    ? await db
        .doc(
          `businesses/${normalizedBusinessId}/accountingPeriodClosures/${eventPeriodKey}`,
        )
        .get()
    : null;
  if (closureSnap?.exists) {
    const lastError = buildProjectionError({
      code: 'accounting-period-closed',
      message:
        'El periodo contable del evento esta cerrado; reabre el periodo o registra un ajuste posterior.',
      now,
      details: {
        periodKey: eventPeriodKey,
      },
    });
    const projectionUpdate = buildProjectionUpdate({
      accountingEvent: eventRecord,
      status: 'failed',
      now,
      projectorVersion: PROJECTOR_VERSION,
      lastError,
      replayRequestedBy,
    });
    await eventRef.update(projectionUpdate);
    await persistDeadLetter({
      deadLetterRef,
      businessId: normalizedBusinessId,
      eventId: normalizedEventId,
      accountingEvent: eventRecord,
      projectionUpdate,
      lastError,
      replayRequestedBy,
      now,
    });

    return {
      ok: false,
      status: 'failed',
      journalEntryId: null,
      reusedExistingEntry: false,
      deadLetterId: normalizedEventId,
      lastError,
    };
  }

  if (!hasPostingAmountSignal(eventRecord)) {
    const projectionUpdate = buildProjectionUpdate({
      accountingEvent: eventRecord,
      status: ZERO_AMOUNT_PROJECTION_STATUS,
      now,
      projectorVersion: PROJECTOR_VERSION,
      replayRequestedBy,
    });
    await eventRef.update(projectionUpdate);
    await deadLetterRef.delete().catch(() => undefined);

    return {
      ok: true,
      status: ZERO_AMOUNT_PROJECTION_STATUS,
      journalEntryId: null,
      reusedExistingEntry: false,
      deadLetterId: null,
      lastError: null,
    };
  }

  const postingProfiles = buildCollectionDocs(profilesSnap);
  const chartOfAccounts = buildCollectionDocs(chartSnap);
  const bankAccounts = buildCollectionDocs(bankAccountsSnap);
  const cashAccounts = buildCollectionDocs(cashAccountsSnap);
  const profile = resolvePostingProfileForEvent(eventRecord, postingProfiles);

  if (!profile) {
    const lastError = buildProjectionError({
      code: 'posting-profile-not-found',
      message:
        'No existe un perfil contable activo que aplique para este evento.',
      now,
      details: {
        eventType: toCleanString(eventRecord.eventType),
      },
    });
    const projectionUpdate = buildProjectionUpdate({
      accountingEvent: eventRecord,
      status: 'pending_account_mapping',
      now,
      projectorVersion: PROJECTOR_VERSION,
      lastError,
      replayRequestedBy,
    });
    await eventRef.update(projectionUpdate);
    await persistDeadLetter({
      deadLetterRef,
      businessId: normalizedBusinessId,
      eventId: normalizedEventId,
      accountingEvent: eventRecord,
      projectionUpdate,
      lastError,
      replayRequestedBy,
      now,
    });

    return {
      ok: false,
      status: 'pending_account_mapping',
      journalEntryId: null,
      reusedExistingEntry: false,
      deadLetterId: normalizedEventId,
      lastError,
    };
  }

  const { lines, unresolvedLines } = buildProjectedJournalLines({
    event: eventRecord,
    profile,
    bankAccounts,
    cashAccounts,
    chartOfAccounts,
  });

  if (unresolvedLines.length) {
    const lastError = buildProjectionError({
      code: 'posting-line-account-unresolved',
      message:
        'El perfil contable apunta a cuentas no disponibles o no posteables.',
      now,
      details: {
        postingProfileId: profile.id,
        unresolvedLines,
      },
    });
    const projectionUpdate = buildProjectionUpdate({
      accountingEvent: eventRecord,
      status: 'pending_account_mapping',
      now,
      projectorVersion: PROJECTOR_VERSION,
      lastError,
      replayRequestedBy,
    });
    await eventRef.update(projectionUpdate);
    await persistDeadLetter({
      deadLetterRef,
      businessId: normalizedBusinessId,
      eventId: normalizedEventId,
      accountingEvent: eventRecord,
      projectionUpdate,
      lastError,
      replayRequestedBy,
      now,
    });

    return {
      ok: false,
      status: 'pending_account_mapping',
      journalEntryId: null,
      reusedExistingEntry: false,
      deadLetterId: normalizedEventId,
      lastError,
    };
  }

  const validation = validateProjectedLines(lines);
  if (!validation.ok) {
    const lastError = buildProjectionError({
      code: validation.code,
      message: validation.message,
      now,
      details: {
        postingProfileId: profile.id,
        lineCount: lines.length,
      },
    });
    const projectionUpdate = buildProjectionUpdate({
      accountingEvent: eventRecord,
      status: 'failed',
      now,
      projectorVersion: PROJECTOR_VERSION,
      lastError,
      replayRequestedBy,
    });
    await eventRef.update(projectionUpdate);
    await persistDeadLetter({
      deadLetterRef,
      businessId: normalizedBusinessId,
      eventId: normalizedEventId,
      accountingEvent: eventRecord,
      projectionUpdate,
      lastError,
      replayRequestedBy,
      now,
    });

    return {
      ok: false,
      status: 'failed',
      journalEntryId: null,
      reusedExistingEntry: false,
      deadLetterId: normalizedEventId,
      lastError,
    };
  }

  const entry = buildProjectedJournalEntry({
    businessId: normalizedBusinessId,
    event: eventRecord,
    entryId: normalizedEventId,
    profile,
    lines,
    projectorVersion: PROJECTOR_VERSION,
    now,
  });
  const projectionUpdate = buildProjectionUpdate({
    accountingEvent: eventRecord,
    status: 'projected',
    now,
    projectorVersion: PROJECTOR_VERSION,
    journalEntryId: normalizedEventId,
    replayRequestedBy,
  });

  await db.runTransaction(async (transaction) => {
    const currentEntrySnap = await transaction.get(entryRef);
    if (!currentEntrySnap.exists) {
      transaction.set(entryRef, entry);
    }

    transaction.update(eventRef, {
      ...projectionUpdate,
      'metadata.journalEntryId': normalizedEventId,
      'metadata.projectedFromProfileId': profile.id,
    });
  });

  await deadLetterRef.delete().catch(() => undefined);

  return {
    ok: true,
    status: 'projected',
    journalEntryId: normalizedEventId,
    reusedExistingEntry: false,
    deadLetterId: null,
    lastError: null,
  };
};
