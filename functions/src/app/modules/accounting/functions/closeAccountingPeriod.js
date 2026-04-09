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
import { parseSchemaOrThrow } from '../utils/zodHttps.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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
