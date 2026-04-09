import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { runAccountingEventProjection } from '../../../versions/v2/accounting/accountingEventProjection.service.js';

const RETRYABLE_PROJECTION_STATUSES = new Set([
  'failed',
  'pending_account_mapping',
  'pending',
]);

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

const sanitizeForResponse = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForResponse(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }

  const next = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (nestedValue === undefined) return;
    next[key] = sanitizeForResponse(nestedValue);
  });
  return next;
};

export const replayAccountingEventProjection = onCall(
  { cors: true, invoker: 'public' },
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
  const eventId = toCleanString(payload.eventId);
  const allowProjected = payload.allowProjected === true;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!eventId) {
    throw new HttpsError('invalid-argument', 'eventId es requerido.');
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

  const eventRef = db.doc(`businesses/${businessId}/accountingEvents/${eventId}`);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new HttpsError('not-found', 'El accountingEvent solicitado no existe.');
  }

  const accountingEvent = {
    id: eventSnap.id,
    ...asRecord(eventSnap.data()),
  };
  const projectionStatus = toCleanString(accountingEvent.projection?.status);
  if (
    projectionStatus &&
    !RETRYABLE_PROJECTION_STATUSES.has(projectionStatus) &&
    !allowProjected
  ) {
    throw new HttpsError(
      'failed-precondition',
      'El evento no está en un estado reprocesable. Usa allowProjected=true solo si necesitas reparar su proyección.',
    );
  }

  const result = await runAccountingEventProjection({
    businessId,
    eventId,
    accountingEvent,
    replayRequestedBy: authUid,
  });

  return sanitizeForResponse({
    ok: result.ok,
    eventId,
    status: result.status,
    journalEntryId: result.journalEntryId ?? null,
    reusedExistingEntry: result.reusedExistingEntry === true,
    deadLetterId: result.deadLetterId ?? null,
    lastError: result.lastError ?? null,
  });
  },
);
