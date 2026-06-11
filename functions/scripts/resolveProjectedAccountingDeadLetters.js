/*
  Script: resolveProjectedAccountingDeadLetters.js

  Purpose:
    Marca como resueltos dead letters de proyección que ya tienen un asiento
    contable existente. No borra documentos y no reprocesa eventos.

  Usage:
    node functions/scripts/resolveProjectedAccountingDeadLetters.js --service-account C:/path/key.json --business <businessId> --dry-run
    node functions/scripts/resolveProjectedAccountingDeadLetters.js --service-account C:/path/key.json --business <businessId> --write
*/

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import admin from 'firebase-admin';

const ACTIVE_DEAD_LETTER_STATUSES = new Set([
  'failed',
  'pending',
  'pending_account_mapping',
  'projected',
]);
const RESOLVED_STATUS = 'resolved';
const SCRIPT_NAME = 'resolveProjectedAccountingDeadLetters';
const VOIDED_ACCOUNTING_EVENT_STATUSES = new Set(['voided']);
const RESOLVED_EVENT_PROJECTION_STATUSES = new Set([
  'voided',
  'skipped_zero_amount',
]);

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);

const getFlagValue = (flag) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  return admin.credential.cert(
    JSON.parse(fs.readFileSync(absolutePath, 'utf8')),
  );
};

export const resolveJournalEntryIdForDeadLetter = ({
  accountingEvent,
  deadLetter,
}) => {
  const eventProjection = asRecord(accountingEvent?.projection);
  const eventMetadata = asRecord(accountingEvent?.metadata);
  return (
    toCleanString(deadLetter?.journalEntryId) ||
    toCleanString(eventProjection.journalEntryId) ||
    toCleanString(accountingEvent?.journalEntryId) ||
    toCleanString(eventMetadata.journalEntryId) ||
    toCleanString(deadLetter?.eventId) ||
    null
  );
};

export const planDeadLetterResolution = ({
  accountingEvent,
  deadLetter,
  journalEntryExists,
  now = admin.firestore.FieldValue.serverTimestamp(),
  resolvedBy = `script:${SCRIPT_NAME}`,
}) => {
  const eventId = toCleanString(deadLetter?.eventId) ?? toCleanString(deadLetter?.id);
  const projectionStatus =
    toCleanString(deadLetter?.projectionStatus) ??
    toCleanString(asRecord(deadLetter?.projection).status) ??
    'pending';

  if (projectionStatus === RESOLVED_STATUS) {
    return {
      reason: 'already_resolved',
      shouldResolve: false,
    };
  }

  if (!eventId) {
    return {
      reason: 'missing_event_id',
      shouldResolve: false,
    };
  }

  if (!ACTIVE_DEAD_LETTER_STATUSES.has(projectionStatus)) {
    return {
      reason: 'non_active_status',
      shouldResolve: false,
    };
  }

  if (!accountingEvent || !Object.keys(asRecord(accountingEvent)).length) {
    return {
      reason: 'event_missing',
      shouldResolve: false,
    };
  }

  const eventStatus = toCleanString(accountingEvent.status);
  const eventProjectionStatus = toCleanString(
    asRecord(accountingEvent.projection).status,
  );
  if (VOIDED_ACCOUNTING_EVENT_STATUSES.has(eventStatus)) {
    const previousMetadata = asRecord(deadLetter.metadata);
    const currentProjection = asRecord(accountingEvent.projection);
    return {
      journalEntryId: null,
      accountingEventPatch: {
        projection: {
          ...currentProjection,
          status: 'voided',
          journalEntryId: null,
          lastAttemptAt: now,
          lastError: null,
        },
        projectionStatus: 'voided',
        updatedAt: now,
      },
      patch: {
        projectionStatus: RESOLVED_STATUS,
        retryable: false,
        resolvedAt: now,
        resolvedBy,
        resolution: {
          eventStatus,
          previousProjectionStatus: projectionStatus,
          reason: 'accounting_event_voided',
          resolvedBy,
        },
        metadata: {
          ...previousMetadata,
          resolvedBy,
          resolvedReason: 'accounting_event_voided',
        },
        updatedAt: now,
      },
      reason: 'accounting_event_voided',
      shouldResolve: true,
    };
  }

  if (RESOLVED_EVENT_PROJECTION_STATUSES.has(eventProjectionStatus)) {
    const previousMetadata = asRecord(deadLetter.metadata);
    return {
      journalEntryId: null,
      patch: {
        projectionStatus: RESOLVED_STATUS,
        retryable: false,
        resolvedAt: now,
        resolvedBy,
        resolution: {
          eventProjectionStatus,
          previousProjectionStatus: projectionStatus,
          reason: 'event_projection_resolved_without_journal',
          resolvedBy,
        },
        metadata: {
          ...previousMetadata,
          resolvedBy,
          resolvedReason: 'event_projection_resolved_without_journal',
        },
        updatedAt: now,
      },
      reason: 'event_projection_resolved_without_journal',
      shouldResolve: true,
    };
  }

  const journalEntryId = resolveJournalEntryIdForDeadLetter({
    accountingEvent,
    deadLetter: {
      ...asRecord(deadLetter),
      eventId,
    },
  });
  if (!journalEntryId) {
    return {
      reason: 'journal_entry_id_missing',
      shouldResolve: false,
    };
  }

  if (!journalEntryExists) {
    return {
      journalEntryId,
      reason: 'journal_entry_missing',
      shouldResolve: false,
    };
  }

  const hasProjectionSignal =
    eventProjectionStatus === 'projected' ||
    projectionStatus === 'projected' ||
    Boolean(
      toCleanString(asRecord(accountingEvent.projection).journalEntryId) ||
        toCleanString(asRecord(accountingEvent.metadata).journalEntryId) ||
        toCleanString(deadLetter.journalEntryId),
    );

  if (!hasProjectionSignal) {
    return {
      journalEntryId,
      reason: 'projection_signal_missing',
      shouldResolve: false,
    };
  }

  const previousMetadata = asRecord(deadLetter.metadata);
  return {
    journalEntryId,
    patch: {
      projectionStatus: RESOLVED_STATUS,
      retryable: false,
      resolvedAt: now,
      resolvedBy,
      resolution: {
        journalEntryId,
        previousProjectionStatus: projectionStatus,
        reason: 'journal_entry_exists',
        resolvedBy,
      },
      metadata: {
        ...previousMetadata,
        resolvedBy,
        resolvedReason: 'journal_entry_exists',
      },
      updatedAt: now,
    },
    reason: 'journal_entry_exists',
    shouldResolve: true,
  };
};

const loadBusinesses = async ({ db, targetBusinessId }) => {
  if (targetBusinessId) {
    const snapshot = await db.doc(`businesses/${targetBusinessId}`).get();
    return snapshot.exists ? [snapshot] : [];
  }

  const businessesSnap = await db.collection('businesses').get();
  return businessesSnap.docs;
};

const resolveDeadLettersForBusiness = async (db, businessId, { dryRun }) => {
  const deadLettersSnap = await db
    .collection(`businesses/${businessId}/accountingEventProjectionDeadLetters`)
    .get();
  const resolved = [];
  const skipped = [];

  for (const deadLetterSnap of deadLettersSnap.docs) {
    const deadLetter = {
      id: deadLetterSnap.id,
      ...asRecord(deadLetterSnap.data()),
    };
    const eventId = toCleanString(deadLetter.eventId) ?? deadLetterSnap.id;
    const eventSnap = eventId
      ? await db.doc(`businesses/${businessId}/accountingEvents/${eventId}`).get()
      : null;
    const accountingEvent = eventSnap?.exists
      ? {
          id: eventSnap.id,
          ...asRecord(eventSnap.data()),
        }
      : null;
    const journalEntryId = resolveJournalEntryIdForDeadLetter({
      accountingEvent,
      deadLetter: {
        ...deadLetter,
        eventId,
      },
    });
    const journalEntrySnap = journalEntryId
      ? await db
          .doc(`businesses/${businessId}/journalEntries/${journalEntryId}`)
          .get()
      : null;
    const plan = planDeadLetterResolution({
      accountingEvent,
      deadLetter: {
        ...deadLetter,
        eventId,
      },
      journalEntryExists: journalEntrySnap?.exists === true,
    });

    if (!plan.shouldResolve) {
      skipped.push({
        deadLetterId: deadLetterSnap.id,
        eventId,
        journalEntryId,
        reason: plan.reason,
      });
      continue;
    }

    resolved.push({
      deadLetterId: deadLetterSnap.id,
      eventId,
      reason: plan.reason,
      journalEntryId: plan.journalEntryId,
    });

    if (!dryRun) {
      await deadLetterSnap.ref.set(plan.patch, { merge: true });
      if (plan.accountingEventPatch && eventSnap?.ref) {
        await eventSnap.ref.set(plan.accountingEventPatch, { merge: true });
      }
    }
  }

  return {
    plannedResolved: resolved.length,
    resolved: dryRun ? 0 : resolved.length,
    resolvedDeadLetters: resolved,
    skippedDeadLetters: skipped,
  };
};

const main = async () => {
  const serviceAccountPath =
    getFlagValue('--service-account') ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    null;
  const targetBusinessId = getFlagValue('--business');
  const dryRun = !hasFlag('--write') || hasFlag('--dry-run');

  if (!serviceAccountPath) {
    throw new Error(
      'Debe indicar --service-account o GOOGLE_APPLICATION_CREDENTIALS.',
    );
  }

  if (!targetBusinessId) {
    throw new Error(
      'Debe indicar --business <businessId>. Dry-run por defecto; agregue --write para escribir.',
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: loadServiceAccountCredential(serviceAccountPath),
    });
  }

  const db = admin.firestore();
  const businesses = await loadBusinesses({ db, targetBusinessId });

  console.log(
    JSON.stringify({
      mode: dryRun ? 'dry-run' : 'write',
      target: targetBusinessId,
    }),
  );

  for (const businessSnap of businesses) {
    const result = await resolveDeadLettersForBusiness(db, businessSnap.id, {
      dryRun,
    });
    console.log(
      JSON.stringify({
        businessId: businessSnap.id,
        ...result,
      }),
    );
  }
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(`[${SCRIPT_NAME}] Failed:`, error);
      process.exit(1);
    });
}
