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

export const PROJECTOR_VERSION = 1;

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
      lastReplayRequestedAt:
        replayRequestedBy ? now : currentProjection.lastReplayRequestedAt ?? null,
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

  if (!normalizedBusinessId || !normalizedEventId || !Object.keys(eventRecord).length) {
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

  const [settingsSnap, entrySnap, profilesSnap, chartSnap] = await Promise.all([
    settingsRef.get(),
    entryRef.get(),
    db
      .collection(`businesses/${normalizedBusinessId}/accountingPostingProfiles`)
      .get(),
    db.collection(`businesses/${normalizedBusinessId}/chartOfAccounts`).get(),
  ]);

  if (entrySnap.exists) {
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

  const postingProfiles = buildCollectionDocs(profilesSnap);
  const chartOfAccounts = buildCollectionDocs(chartSnap);
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
