import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { CloseAccountingPeriodInputSchema } from '../../../../shared/accountingSchemas.js';

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
import { isJournalEntryBalanced } from '../../../versions/v2/accounting/utils/journalEntry.util.js';
import { parseSchemaOrThrow } from '../utils/zodHttps.util.js';

const MAX_BLOCKER_EXAMPLES = 10;
const VOIDED_ACCOUNTING_EVENT_STATUSES = new Set(['voided']);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const parsePeriodRange = (periodKey) => {
  const [year, month] = periodKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return { end, start };
};

const mapSnapshotDocs = (snapshot) =>
  Array.isArray(snapshot?.docs)
    ? snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...asRecord(docSnapshot.data()),
      }))
    : [];

const resolveEventProjectionStatus = (event) => {
  const projection = asRecord(event.projection);
  return (
    toCleanString(projection.status) ||
    toCleanString(event.projectionStatus) ||
    'pending'
  );
};

const resolveEventJournalEntryId = (event) => {
  const projection = asRecord(event.projection);
  const metadata = asRecord(event.metadata);
  return (
    toCleanString(projection.journalEntryId) ||
    toCleanString(event.journalEntryId) ||
    toCleanString(metadata.journalEntryId)
  );
};

const loadPeriodClosureBlockers = async ({ businessId, periodKey }) => {
  const { end, start } = parsePeriodRange(periodKey);
  const [eventsSnap, journalEntriesSnap] = await Promise.all([
    db
      .collection(`businesses/${businessId}/accountingEvents`)
      .where('occurredAt', '>=', start)
      .where('occurredAt', '<', end)
      .get(),
    db
      .collection(`businesses/${businessId}/journalEntries`)
      .where('periodKey', '==', periodKey)
      .get(),
  ]);

  const accountingEvents = mapSnapshotDocs(eventsSnap).filter(
    (event) => !VOIDED_ACCOUNTING_EVENT_STATUSES.has(toCleanString(event.status)),
  );
  const journalEntries = mapSnapshotDocs(journalEntriesSnap);
  const unresolvedEvents = accountingEvents.filter((event) => {
    const projectionStatus = resolveEventProjectionStatus(event);
    if (projectionStatus !== 'projected') {
      return true;
    }

    return !resolveEventJournalEntryId(event);
  });
  const unbalancedEntries = journalEntries.filter(
    (entry) => !isJournalEntryBalanced(entry),
  );

  return {
    accountingEventCount: accountingEvents.length,
    journalEntryCount: journalEntries.length,
    unresolvedEvents,
    unbalancedEntries,
  };
};

const assertPeriodCanBeClosed = async ({ businessId, periodKey }) => {
  const blockers = await loadPeriodClosureBlockers({ businessId, periodKey });
  if (!blockers.unresolvedEvents.length && !blockers.unbalancedEntries.length) {
    return blockers;
  }

  throw new HttpsError(
    'failed-precondition',
    'No se puede cerrar el periodo porque quedan validaciones contables pendientes.',
    {
      accountingEventCount: blockers.accountingEventCount,
      journalEntryCount: blockers.journalEntryCount,
      unresolvedEventCount: blockers.unresolvedEvents.length,
      unbalancedJournalEntryCount: blockers.unbalancedEntries.length,
      unresolvedEvents: blockers.unresolvedEvents
        .slice(0, MAX_BLOCKER_EXAMPLES)
        .map((event) => ({
          id: event.id,
          eventType: toCleanString(event.eventType),
          projectionStatus: resolveEventProjectionStatus(event),
          journalEntryId: resolveEventJournalEntryId(event),
        })),
      unbalancedJournalEntries: blockers.unbalancedEntries
        .slice(0, MAX_BLOCKER_EXAMPLES)
        .map((entry) => ({
          id: entry.id,
          eventId: toCleanString(entry.eventId),
          totals: asRecord(entry.totals),
        })),
    },
  );
};

export const closeAccountingPeriod = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const { businessId, periodKey, note } = parseSchemaOrThrow(
    CloseAccountingPeriodInputSchema,
    {
      businessId:
        toCleanString(payload.businessId) ||
        toCleanString(payload.businessID) ||
        null,
      periodKey: toCleanString(payload.periodKey),
      note: toCleanString(payload.note),
    },
    'No se pudo validar el cierre del periodo.',
  );

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

  await assertPeriodCanBeClosed({ businessId, periodKey });

  const closureRef = db.doc(
    `businesses/${businessId}/accountingPeriodClosures/${periodKey}`,
  );

  let result = null;

  await db.runTransaction(async (transaction) => {
    const closureSnap = await transaction.get(closureRef);
    if (closureSnap.exists) {
      result = {
        ok: true,
        periodKey,
        reused: true,
      };
      return;
    }

    transaction.set(closureRef, {
      id: periodKey,
      businessId,
      periodKey,
      status: 'closed',
      note: note ?? null,
      closedAt: Timestamp.now(),
      closedBy: authUid,
    });

    result = {
      ok: true,
      periodKey,
      reused: false,
    };
  });

  return result;
  },
);
